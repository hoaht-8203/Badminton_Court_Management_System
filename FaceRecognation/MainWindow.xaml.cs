using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using System.Windows.Shapes;
using System.Windows.Threading;
using AForge.Video;
using AForge.Video.DirectShow;

namespace FaceRecognation
{
    /// <summary>
    /// Interaction logic for MainWindow.xaml
    /// </summary>
    public partial class MainWindow : Window
    {
        private VideoCaptureDevice? videoSource;
        private FilterInfoCollection? videoDevices;
        private bool isWebcamRunning = false;
        private int selectedDeviceIndex = -1;
        private bool isFlipped = true; // Auto flip by default
        private HttpClient? httpClient;
        private string compreFaceBaseUrl = "http://localhost:8000";
        private string recognitionApiKey = "80bea556-2d8b-43de-b0b3-efdc7d9caa2e";

        public MainWindow()
        {
            InitializeComponent();
            InitializeWebcam();
            InitializeCompreFace();
            AutoStartWebcam();
        }

        private void InitializeWebcam()
        {
            try
            {
                // Get available video devices
                videoDevices = new FilterInfoCollection(FilterCategory.VideoInputDevice);

                if (videoDevices.Count == 0)
                {
                    StatusText.Text = "No webcam devices found!";
                }
                else
                {
                    // Populate ComboBox with available devices
                    DeviceComboBox.Items.Clear();
                    for (int i = 0; i < videoDevices.Count; i++)
                    {
                        DeviceComboBox.Items.Add($"Device {i}: {videoDevices[i].Name}");
                    }

                    StatusText.Text = $"Found {videoDevices.Count} webcam device(s).";

                    // Auto-select device 1 (USB2.0 HD UVC Webcam) if available
                    if (videoDevices.Count > 1)
                    {
                        selectedDeviceIndex = 1; // Select device 1
                        DeviceComboBox.SelectedIndex = selectedDeviceIndex;
                        StatusText.Text = $"Auto-selected: {videoDevices[1].Name}";
                    }
                    else
                    {
                        selectedDeviceIndex = 0; // Select first device
                        DeviceComboBox.SelectedIndex = selectedDeviceIndex;
                        StatusText.Text = $"Auto-selected: {videoDevices[0].Name}";
                    }
                }
            }
            catch (Exception ex)
            {
                StatusText.Text = $"Error initializing webcam: {ex.Message}";
            }
        }

        private void InitializeCompreFace()
        {
            try
            {
                // Initialize HTTP client for CompreFace API
                httpClient = new HttpClient();
                httpClient.BaseAddress = new Uri(compreFaceBaseUrl);
                httpClient.DefaultRequestHeaders.Add("x-api-key", recognitionApiKey);

                StatusText.Text += "\nCompreFace HTTP client initialized successfully!";
            }
            catch (Exception ex)
            {
                StatusText.Text += $"\nError initializing CompreFace: {ex.Message}";
            }
        }

        private void AutoStartWebcam()
        {
            // Auto-start webcam after a short delay
            var timer = new DispatcherTimer();
            timer.Interval = TimeSpan.FromMilliseconds(500);
            timer.Tick += (s, args) =>
            {
                timer.Stop();
                StartWebcam();
            };
            timer.Start();
        }

        private void ExitButton_Click(object sender, RoutedEventArgs e)
        {
            // Stop webcam before closing
            if (videoSource != null && videoSource.IsRunning)
            {
                videoSource.SignalToStop();
                videoSource.WaitForStop();
            }

            // Close the application
            Application.Current.Shutdown();
        }

        private void StartWebcam()
        {
            try
            {
                if (videoDevices != null && videoDevices.Count > 0 && selectedDeviceIndex >= 0)
                {
                    StatusText.Text = "Initializing webcam...";

                    try
                    {
                        StatusText.Text =
                            $"Starting device {selectedDeviceIndex}: {videoDevices[selectedDeviceIndex].Name}";

                        // Create new video source with selected device
                        videoSource = new VideoCaptureDevice(
                            videoDevices[selectedDeviceIndex].MonikerString
                        );
                        videoSource.NewFrame += VideoSource_NewFrame;

                        // Try to start the device
                        videoSource.Start();

                        // Wait a bit to see if it works
                        System.Threading.Thread.Sleep(1000);

                        if (videoSource.IsRunning)
                        {
                            isWebcamRunning = true;
                            CaptureButton.IsEnabled = true;
                            StatusText.Text =
                                $"Webcam started successfully with device: {videoDevices[selectedDeviceIndex].Name}";
                        }
                        else
                        {
                            StatusText.Text =
                                $"Failed to start device: {videoDevices[selectedDeviceIndex].Name}";
                        }
                    }
                    catch (Exception deviceEx)
                    {
                        StatusText.Text = $"Device failed: {deviceEx.Message}";
                        if (videoSource != null)
                        {
                            try
                            {
                                videoSource.SignalToStop();
                                videoSource.WaitForStop();
                            }
                            catch { }
                        }
                    }
                }
                else
                {
                    StatusText.Text = "No webcam devices available!";
                }
            }
            catch (Exception ex)
            {
                StatusText.Text = $"Error starting webcam: {ex.Message}";
            }
        }

        private async void CaptureButton_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                if (WebcamImage.Source != null && httpClient != null)
                {
                    StatusText.Text = "Recognizing face...";

                    // Create a bitmap from the current image source
                    BitmapSource bitmapSource = (BitmapSource)WebcamImage.Source;

                    // Convert to byte array
                    byte[] imageBytes = ConvertBitmapSourceToByteArray(bitmapSource);

                    // Create multipart form data
                    using (var content = new MultipartFormDataContent())
                    {
                        content.Add(new ByteArrayContent(imageBytes), "file", "face.jpg");
                        content.Add(new StringContent("0.81"), "det_prob_threshold");
                        content.Add(
                            new StringContent("landmarks,gender,age,detector,calculator"),
                            "face_plugins"
                        );
                        content.Add(new StringContent("1"), "prediction_count");
                        content.Add(new StringContent("true"), "status");

                        // Call CompreFace recognition API
                        var response = await httpClient.PostAsync(
                            "/api/v1/recognition/recognize",
                            content
                        );

                        var jsonResponse = await response.Content.ReadAsStringAsync();

                        if (response.IsSuccessStatusCode)
                        {
                            DisplayRecognitionResults(jsonResponse);
                        }
                        else
                        {
                            StatusText.Text = $"Recognition failed: {response.StatusCode}";

                            // Clear info tab and show error
                            RecognitionInfoText.Text =
                                $"❌ API ERROR\n\n"
                                + $"Status Code: {response.StatusCode}\n"
                                + $"Error Details: {jsonResponse}\n\n"
                                + $"Please check:\n"
                                + $"• CompreFace server is running\n"
                                + $"• API key is correct\n"
                                + $"• Network connection is stable";
                        }
                    }
                }
                else
                {
                    StatusText.Text = "Webcam not ready or CompreFace not initialized!";

                    // Clear info tab and show error
                    RecognitionInfoText.Text =
                        $"❌ INITIALIZATION ERROR\n\n"
                        + $"Webcam or CompreFace not ready!\n\n"
                        + $"Please check:\n"
                        + $"• Webcam is connected and working\n"
                        + $"• CompreFace server is running\n"
                        + $"• API key is configured correctly";
                }
            }
            catch (Exception ex)
            {
                StatusText.Text = $"Error recognizing face: {ex.Message}";

                // Clear info tab and show error
                RecognitionInfoText.Text =
                    $"❌ EXCEPTION ERROR\n\n"
                    + $"Error: {ex.Message}\n\n"
                    + $"Please check:\n"
                    + $"• Application logs for details\n"
                    + $"• Network connectivity\n"
                    + $"• CompreFace server status";
            }
        }

        private void VideoSource_NewFrame(object sender, NewFrameEventArgs eventArgs)
        {
            try
            {
                // Convert Bitmap to BitmapSource for WPF
                Bitmap bitmap = (Bitmap)eventArgs.Frame.Clone();

                // Flip the bitmap horizontally if needed
                if (isFlipped)
                {
                    bitmap.RotateFlip(RotateFlipType.RotateNoneFlipX);
                }

                BitmapSource bitmapSource = ConvertBitmapToBitmapSource(bitmap);

                // Update UI on the UI thread
                Dispatcher.BeginInvoke(
                    new Action(() =>
                    {
                        try
                        {
                            WebcamImage.Source = bitmapSource;
                            StatusText.Text = $"Webcam streaming...";
                        }
                        catch (Exception uiEx)
                        {
                            StatusText.Text = $"UI Error: {uiEx.Message}";
                        }
                    })
                );
            }
            catch (Exception ex)
            {
                Dispatcher.BeginInvoke(
                    new Action(() =>
                    {
                        StatusText.Text = $"Frame processing error: {ex.Message}";
                    })
                );
            }
        }

        private BitmapSource ConvertBitmapToBitmapSource(Bitmap bitmap)
        {
            try
            {
                // Convert System.Drawing.Bitmap to WPF BitmapSource
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
                    PixelFormats.Bgr24,
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
                // Fallback method using MemoryStream
                using (MemoryStream memory = new MemoryStream())
                {
                    bitmap.Save(memory, ImageFormat.Bmp);
                    memory.Position = 0;
                    BitmapImage bitmapImage = new BitmapImage();
                    bitmapImage.BeginInit();
                    bitmapImage.StreamSource = memory;
                    bitmapImage.CacheOption = BitmapCacheOption.OnLoad;
                    bitmapImage.EndInit();
                    bitmapImage.Freeze();
                    return bitmapImage;
                }
            }
        }

        private byte[] ConvertBitmapSourceToByteArray(BitmapSource bitmapSource)
        {
            using (MemoryStream memory = new MemoryStream())
            {
                BitmapEncoder encoder = new PngBitmapEncoder();
                encoder.Frames.Add(BitmapFrame.Create(bitmapSource));
                encoder.Save(memory);
                return memory.ToArray();
            }
        }

        private void DisplayRecognitionResults(string jsonResponse)
        {
            try
            {
                // Parse JSON response
                using (JsonDocument doc = JsonDocument.Parse(jsonResponse))
                {
                    if (
                        doc.RootElement.TryGetProperty("result", out JsonElement resultArray)
                        && resultArray.ValueKind == JsonValueKind.Array
                    )
                    {
                        if (resultArray.GetArrayLength() > 0)
                        {
                            var firstResult = resultArray[0];

                            // Update status text
                            StatusText.Text = "Face recognition completed!";

                            // Display detailed information in the info panel
                            DisplayDetailedInfo(firstResult);
                        }
                        else
                        {
                            StatusText.Text = "No recognition results found.";

                            // Clear info tab and show no results
                            RecognitionInfoText.Text =
                                $"❌ NO RESULTS FOUND\n\n"
                                + $"No faces detected in the image.\n\n"
                                + $"Please try:\n"
                                + $"• Ensure face is clearly visible\n"
                                + $"• Check lighting conditions\n"
                                + $"• Try a different angle";
                        }
                    }
                    else
                    {
                        StatusText.Text = "Invalid response format.";

                        // Clear info tab and show invalid format
                        RecognitionInfoText.Text =
                            $"❌ INVALID RESPONSE FORMAT\n\n"
                            + $"The API returned an unexpected format.\n\n"
                            + $"Please check:\n"
                            + $"• CompreFace server version\n"
                            + $"• API endpoint configuration\n"
                            + $"• Server logs for details";
                    }
                }
            }
            catch (Exception ex)
            {
                StatusText.Text = $"Error displaying results: {ex.Message}";

                // Clear info tab and show parsing error
                RecognitionInfoText.Text =
                    $"❌ JSON PARSING ERROR\n\n"
                    + $"Error: {ex.Message}\n\n"
                    + $"Please check:\n"
                    + $"• API response format\n"
                    + $"• CompreFace server status\n"
                    + $"• Network connectivity";
            }
        }

        private void DisplayDetailedInfo(JsonElement result)
        {
            try
            {
                var infoText = "=== FACE RECOGNITION RESULTS ===\n\n";

                // Age information
                if (result.TryGetProperty("age", out JsonElement age))
                {
                    if (
                        age.TryGetProperty("probability", out JsonElement ageProb)
                        && age.TryGetProperty("low", out JsonElement ageLow)
                        && age.TryGetProperty("high", out JsonElement ageHigh)
                    )
                    {
                        infoText += $"👤 AGE: {ageLow.GetInt32()}-{ageHigh.GetInt32()} years\n";
                        infoText += $"   Confidence: {ageProb.GetDouble():P1}\n\n";
                    }
                }

                // Gender information
                if (result.TryGetProperty("gender", out JsonElement gender))
                {
                    if (
                        gender.TryGetProperty("value", out JsonElement genderValue)
                        && gender.TryGetProperty("probability", out JsonElement genderProb)
                    )
                    {
                        infoText += $"⚧ GENDER: {genderValue.GetString()}\n";
                        infoText += $"   Confidence: {genderProb.GetDouble():P1}\n\n";
                    }
                }

                // Mask information
                if (result.TryGetProperty("mask", out JsonElement mask))
                {
                    if (
                        mask.TryGetProperty("value", out JsonElement maskValue)
                        && mask.TryGetProperty("probability", out JsonElement maskProb)
                    )
                    {
                        infoText += $"😷 MASK: {maskValue.GetString()}\n";
                        infoText += $"   Confidence: {maskProb.GetDouble():P1}\n\n";
                    }
                }

                // Face detection box
                if (result.TryGetProperty("box", out JsonElement box))
                {
                    if (
                        box.TryGetProperty("probability", out JsonElement boxProb)
                        && box.TryGetProperty("x_min", out JsonElement xMin)
                        && box.TryGetProperty("y_min", out JsonElement yMin)
                        && box.TryGetProperty("x_max", out JsonElement xMax)
                        && box.TryGetProperty("y_max", out JsonElement yMax)
                    )
                    {
                        infoText += $"📦 FACE BOX:\n";
                        infoText +=
                            $"   Position: ({xMin.GetInt32()}, {yMin.GetInt32()}) to ({xMax.GetInt32()}, {yMax.GetInt32()})\n";
                        infoText +=
                            $"   Size: {xMax.GetInt32() - xMin.GetInt32()} x {yMax.GetInt32() - yMin.GetInt32()}\n";
                        infoText += $"   Confidence: {boxProb.GetDouble():P1}\n\n";
                    }
                }

                // Subjects (face matches)
                if (
                    result.TryGetProperty("subjects", out JsonElement subjects)
                    && subjects.ValueKind == JsonValueKind.Array
                )
                {
                    if (subjects.GetArrayLength() > 0)
                    {
                        infoText += "🎯 RECOGNIZED SUBJECTS:\n";
                        for (int i = 0; i < subjects.GetArrayLength(); i++)
                        {
                            var subject = subjects[i];
                            if (
                                subject.TryGetProperty("subject", out JsonElement subjectName)
                                && subject.TryGetProperty("similarity", out JsonElement similarity)
                            )
                            {
                                infoText +=
                                    $"   • {subjectName.GetString()}: {similarity.GetDouble():P2}\n";
                            }
                        }
                        infoText += "\n";
                    }
                    else
                    {
                        infoText += "❌ No matching subjects found\n\n";
                    }
                }

                // Execution time
                if (result.TryGetProperty("execution_time", out JsonElement execTime))
                {
                    infoText += "⏱️ EXECUTION TIME:\n";
                    if (execTime.TryGetProperty("detector", out JsonElement detectorTime))
                        infoText += $"   Face Detection: {detectorTime.GetDouble()}ms\n";
                    if (execTime.TryGetProperty("calculator", out JsonElement calcTime))
                        infoText += $"   Face Calculation: {calcTime.GetDouble()}ms\n";
                    if (execTime.TryGetProperty("age", out JsonElement ageTime))
                        infoText += $"   Age Detection: {ageTime.GetDouble()}ms\n";
                    if (execTime.TryGetProperty("gender", out JsonElement genderTime))
                        infoText += $"   Gender Detection: {genderTime.GetDouble()}ms\n";
                    if (execTime.TryGetProperty("mask", out JsonElement maskTime))
                        infoText += $"   Mask Detection: {maskTime.GetDouble()}ms\n";
                }

                // Update the information panel
                RecognitionInfoText.Text = infoText;
            }
            catch (Exception ex)
            {
                StatusText.Text = $"Error displaying detailed info: {ex.Message}";
            }
        }

        private void StopWebcam()
        {
            try
            {
                if (videoSource != null && videoSource.IsRunning)
                {
                    videoSource.SignalToStop();
                    videoSource.WaitForStop();
                    isWebcamRunning = false;
                    StatusText.Text = "Webcam stopped.";
                }
            }
            catch (Exception ex)
            {
                StatusText.Text = $"Error stopping webcam: {ex.Message}";
            }
        }

        private void DeviceComboBox_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            try
            {
                if (DeviceComboBox.SelectedIndex >= 0 && videoDevices != null)
                {
                    selectedDeviceIndex = DeviceComboBox.SelectedIndex;
                    StatusText.Text = $"Selected: {videoDevices[selectedDeviceIndex].Name}";

                    // Restart webcam with new device if currently running
                    if (isWebcamRunning)
                    {
                        StopWebcam();
                        StartWebcam();
                    }
                }
            }
            catch (Exception ex)
            {
                StatusText.Text = $"Error changing device: {ex.Message}";
            }
        }

        protected override void OnClosed(EventArgs e)
        {
            // Clean up webcam resources when window is closed
            if (videoSource != null && videoSource.IsRunning)
            {
                videoSource.SignalToStop();
                videoSource.WaitForStop();
            }
            base.OnClosed(e);
        }
    }
}
