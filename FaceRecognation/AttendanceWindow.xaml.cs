using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media.Imaging;
using System.Windows.Threading;
using AForge.Video;
using AForge.Video.DirectShow;
using FaceRecognation.Dtos;
using FaceRecognation.Services.Interfaces;
using Microsoft.Extensions.DependencyInjection;

namespace FaceRecognation
{
    public partial class AttendanceWindow : Window
    {
        private VideoCaptureDevice? videoSource;
        private FilterInfoCollection? videoDevices;
        private int selectedDeviceIndex = -1;
        private bool isFlipped = true;

        private readonly ICompreFaceService _compreFaceService;
        private readonly Services.Interfaces.IAttendanceClient _attendanceClient;

        public AttendanceWindow(
            ICompreFaceService compreFaceService,
            Services.Interfaces.IAttendanceClient attendanceClient
        )
        {
            _compreFaceService =
                compreFaceService ?? throw new ArgumentNullException(nameof(compreFaceService));
            _attendanceClient =
                attendanceClient ?? throw new ArgumentNullException(nameof(attendanceClient));

            InitializeComponent();
            InitializeWebcam();
            AutoStartWebcam();
        }

        private void InitializeWebcam()
        {
            try
            {
                videoDevices = new FilterInfoCollection(FilterCategory.VideoInputDevice);
                if (videoDevices.Count == 0)
                {
                    StatusText.Text = "No webcam devices found!";
                }
                else
                {
                    DeviceComboBox.Items.Clear();
                    for (int i = 0; i < videoDevices.Count; i++)
                    {
                        DeviceComboBox.Items.Add($"Device {i}: {videoDevices[i].Name}");
                    }

                    if (videoDevices.Count > 1)
                        selectedDeviceIndex = 1;
                    else
                        selectedDeviceIndex = 0;

                    DeviceComboBox.SelectedIndex = selectedDeviceIndex;
                    StatusText.Text = $"Auto-selected: {videoDevices[selectedDeviceIndex].Name}";
                }
            }
            catch (Exception ex)
            {
                StatusText.Text = "Error initializing webcam: " + ex.Message;
            }
        }

        private void AutoStartWebcam()
        {
            var timer = new DispatcherTimer();
            timer.Interval = TimeSpan.FromMilliseconds(300);
            timer.Tick += (s, args) =>
            {
                timer.Stop();
                StartWebcam();
            };
            timer.Start();
        }

        private void StartWebcam()
        {
            try
            {
                if (videoDevices != null && videoDevices.Count > 0 && selectedDeviceIndex >= 0)
                {
                    videoSource = new VideoCaptureDevice(
                        videoDevices[selectedDeviceIndex].MonikerString
                    );
                    videoSource.NewFrame += VideoSource_NewFrame;
                    videoSource.Start();
                    System.Threading.Thread.Sleep(500);
                    if (videoSource.IsRunning)
                    {
                        StatusText.Text =
                            $"Webcam started: {videoDevices[selectedDeviceIndex].Name}";
                    }
                    else
                    {
                        StatusText.Text = "Failed to start webcam.";
                    }
                }
            }
            catch (Exception ex)
            {
                StatusText.Text = "Error starting webcam: " + ex.Message;
            }
        }

        private void VideoSource_NewFrame(object sender, NewFrameEventArgs eventArgs)
        {
            try
            {
                Bitmap bitmap = (Bitmap)eventArgs.Frame.Clone();
                if (isFlipped)
                    bitmap.RotateFlip(RotateFlipType.RotateNoneFlipX);

                var bitmapSource = ConvertBitmapToBitmapSource(bitmap);
                Dispatcher.BeginInvoke(
                    new Action(() =>
                    {
                        WebcamImage.Source = bitmapSource;
                        StatusText.Text = "Webcam streaming...";
                    })
                );
            }
            catch (Exception ex)
            {
                Dispatcher.BeginInvoke(
                    new Action(() =>
                    {
                        StatusText.Text = "Frame error: " + ex.Message;
                    })
                );
            }
        }

        private BitmapSource ConvertBitmapToBitmapSource(Bitmap bitmap)
        {
            try
            {
                var bitmapData = bitmap.LockBits(
                    new System.Drawing.Rectangle(0, 0, bitmap.Width, bitmap.Height),
                    ImageLockMode.ReadOnly,
                    bitmap.PixelFormat
                );
                var bitmapSource = BitmapSource.Create(
                    bitmapData.Width,
                    bitmapData.Height,
                    bitmap.HorizontalResolution,
                    bitmap.VerticalResolution,
                    System.Windows.Media.PixelFormats.Bgr24,
                    null,
                    bitmapData.Scan0,
                    bitmapData.Stride * bitmapData.Height,
                    bitmapData.Stride
                );
                bitmap.UnlockBits(bitmapData);
                bitmapSource.Freeze();
                return bitmapSource;
            }
            catch
            {
                using (var memory = new MemoryStream())
                {
                    bitmap.Save(memory, ImageFormat.Bmp);
                    memory.Position = 0;
                    var img = new BitmapImage();
                    img.BeginInit();
                    img.StreamSource = memory;
                    img.CacheOption = BitmapCacheOption.OnLoad;
                    img.EndInit();
                    img.Freeze();
                    return img;
                }
            }
        }

        private void DeviceComboBox_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            try
            {
                if (DeviceComboBox.SelectedIndex >= 0 && videoDevices != null)
                {
                    selectedDeviceIndex = DeviceComboBox.SelectedIndex;
                    if (videoSource != null && videoSource.IsRunning)
                    {
                        try
                        {
                            videoSource.SignalToStop();
                            videoSource.WaitForStop();
                        }
                        catch { }
                        StartWebcam();
                    }
                }
            }
            catch (Exception ex)
            {
                StatusText.Text = "Error changing device: " + ex.Message;
            }
        }

        private async Task<int?> RecognizeStaffIdFromCurrentFrameAsync()
        {
            try
            {
                if (WebcamImage?.Source == null)
                    return null;

                // Convert current webcam BitmapSource to JPEG bytes
                var bitmapSource = (BitmapSource)WebcamImage.Source;
                byte[] imageBytes;
                using (var ms = new MemoryStream())
                {
                    var encoder = new JpegBitmapEncoder();
                    encoder.Frames.Add(BitmapFrame.Create(bitmapSource));
                    encoder.QualityLevel = 85;
                    encoder.Save(ms);
                    imageBytes = ms.ToArray();
                }

                var json = await _compreFaceService.RecognizeAsync(imageBytes);
                using var doc = JsonDocument.Parse(json);
                // Look for result[0].subjects or root.subjects
                if (
                    doc.RootElement.TryGetProperty("result", out var result)
                    && result.ValueKind == JsonValueKind.Array
                    && result.GetArrayLength() > 0
                )
                {
                    var first = result[0];
                    if (
                        first.TryGetProperty("subjects", out var subjects)
                        && subjects.ValueKind == JsonValueKind.Array
                    )
                    {
                        foreach (var s in subjects.EnumerateArray())
                        {
                            if (
                                s.TryGetProperty("subject", out var subjName)
                                && subjName.ValueKind == JsonValueKind.String
                            )
                            {
                                var name = subjName.GetString();
                                if (!string.IsNullOrEmpty(name))
                                {
                                    // expected subject format: "{id}-{name}". Extract leading integer id
                                    var idx = name.IndexOf('-');
                                    if (
                                        idx > 0
                                        && int.TryParse(name.Substring(0, idx), out var staffId)
                                    )
                                    {
                                        return staffId;
                                    }
                                }
                            }
                        }
                    }
                }

                // fallback: root.subjects
                if (
                    doc.RootElement.TryGetProperty("subjects", out var rootSubjects)
                    && rootSubjects.ValueKind == JsonValueKind.Array
                )
                {
                    foreach (var s in rootSubjects.EnumerateArray())
                    {
                        if (
                            s.TryGetProperty("subject", out var subjName)
                            && subjName.ValueKind == JsonValueKind.String
                        )
                        {
                            var name = subjName.GetString();
                            if (!string.IsNullOrEmpty(name))
                            {
                                var idx = name.IndexOf('-');
                                if (
                                    idx > 0
                                    && int.TryParse(name.Substring(0, idx), out var staffId)
                                )
                                {
                                    return staffId;
                                }
                            }
                        }
                    }
                }

                return null;
            }
            catch (Exception ex)
            {
                RecognitionInfoText.Text = "Recognition error: " + ex.Message;
                return null;
            }
        }

        private async void CheckInButton_Click(object sender, RoutedEventArgs e)
        {
            StatusText.Text = "Recognizing...";
            var staffId = await RecognizeStaffIdFromCurrentFrameAsync();
            if (staffId == null)
            {
                RecognitionInfoText.Text =
                    "No recognized staff detected. Please ensure your face is visible and registered.";
                StatusText.Text = "Recognition failed";
                return;
            }

            StatusText.Text = $"Recognized staff id {staffId}, calling check-in...";
            try
            {
                var resp = await _attendanceClient.CheckInAsync(staffId.Value);
                if (resp != null && resp.Success)
                {
                    RecognitionInfoText.Text = resp.Message ?? "Check-in successful.";
                    StatusText.Text = "Check-in successful";
                }
                else
                {
                    RecognitionInfoText.Text = resp?.Message ?? "Check-in failed.";
                    StatusText.Text = "Check-in failed";
                }
            }
            catch (Exception ex)
            {
                RecognitionInfoText.Text = "Check-in error: " + ex.Message;
                StatusText.Text = "Error";
            }
        }

        private async void CheckOutButton_Click(object sender, RoutedEventArgs e)
        {
            StatusText.Text = "Recognizing...";
            var staffId = await RecognizeStaffIdFromCurrentFrameAsync();
            if (staffId == null)
            {
                RecognitionInfoText.Text =
                    "No recognized staff detected. Please ensure your face is visible and registered.";
                StatusText.Text = "Recognition failed";
                return;
            }

            StatusText.Text = $"Recognized staff id {staffId}, calling check-out...";
            try
            {
                var resp = await _attendanceClient.CheckOutAsync(staffId.Value);
                if (resp != null && resp.Success)
                {
                    RecognitionInfoText.Text = resp.Message ?? "Check-out successful.";
                    StatusText.Text = "Check-out successful";
                }
                else
                {
                    RecognitionInfoText.Text = resp?.Message ?? "Check-out failed.";
                    StatusText.Text = "Check-out failed";
                }
            }
            catch (Exception ex)
            {
                RecognitionInfoText.Text = "Check-out error: " + ex.Message;
                StatusText.Text = "Error";
            }
        }

        private void HomeButton_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                var app = Application.Current as App;
                var sp = app?.ServiceProvider;
                if (sp != null)
                {
                    var landing = sp.GetRequiredService<LandingWindow>();
                    landing.Show();
                    this.Close();
                    return;
                }
            }
            catch { }

            try
            {
                var landing = new LandingWindow();
                landing.Show();
                this.Close();
            }
            catch { }
        }

        protected override void OnClosed(EventArgs e)
        {
            try
            {
                if (videoSource != null && videoSource.IsRunning)
                {
                    videoSource.SignalToStop();
                    videoSource.WaitForStop();
                }
            }
            catch { }
            base.OnClosed(e);
        }
    }
}
