using System;
using System.IO;
using System.Linq;
using System.Windows;
using System.Windows.Input;
using System.Windows.Media.Imaging;
using FaceRecognation.Dtos;
using FaceRecognation.Services.Interfaces;
using Microsoft.Win32;

namespace FaceRecognation
{
    public partial class FaceRegisterWindow : Window
    {
        private int currentFaceIndex = 0; // 0..4 for five images
        private StaffResponse? _staff;
        private readonly ICompreFaceService? _compreFaceService;
        private string?[] _imagePaths = new string?[5];

        // Parameterless ctor kept for XAML designer and manual instantiation
        public FaceRegisterWindow()
        {
            InitializeComponent();
        }

        // DI constructor (used when resolving from ServiceProvider)
        public FaceRegisterWindow(ICompreFaceService compreFaceService)
            : this()
        {
            _compreFaceService = compreFaceService;
        }

        private void Window_Loaded(object sender, RoutedEventArgs e)
        {
            // Ensure button visibility reflects current image slots
            UpdateActionButtons();
        }

        private void FaceSlot_Click(object sender, MouseButtonEventArgs e)
        {
            if (sender is System.Windows.Controls.Image img && img.Tag != null)
            {
                if (int.TryParse(img.Tag.ToString(), out var idx))
                {
                    currentFaceIndex = Math.Clamp(idx, 0, 4);
                    // Optionally show which slot is active - for now we'll just set index
                }
            }
        }

        /// <summary>
        /// Initialize the window for a specific staff. This will update the Title accordingly.
        /// </summary>
        public void InitForStaff(StaffResponse staff)
        {
            _staff = staff;
            this.Title = $"Thêm dữ liệu khuôn mặt cho {staff.FullName}";
        }

        // Capture face: chọn ảnh từ file để demo
        private void CaptureButton_Click(object sender, RoutedEventArgs e)
        {
            if (currentFaceIndex > 4)
            {
                MessageBox.Show(
                    "Bạn đã đăng ký đủ 5 ảnh.",
                    "Thông báo",
                    MessageBoxButton.OK,
                    MessageBoxImage.Information
                );
                return;
            }

            var dialog = new OpenFileDialog();
            dialog.Filter = "Image Files|*.jpg;*.jpeg;*.png;*.bmp";
            if (dialog.ShowDialog() == true)
            {
                SetImageForIndex(currentFaceIndex, dialog.FileName);
                currentFaceIndex = Math.Min(4, currentFaceIndex + 1);
                UpdateActionButtons();
            }
        }

        // Select image for current slot (same behavior as capture)
        private void SelectButton_Click(object sender, RoutedEventArgs e)
        {
            var dialog = new OpenFileDialog();
            dialog.Filter = "Image Files|*.jpg;*.jpeg;*.png;*.bmp";
            if (dialog.ShowDialog() == true)
            {
                // If we've already filled all slots, replace the last one
                var idx = currentFaceIndex > 4 ? 4 : currentFaceIndex;
                SetImageForIndex(idx, dialog.FileName);
                if (currentFaceIndex <= 4)
                    currentFaceIndex = Math.Min(4, currentFaceIndex + 1);
                UpdateActionButtons();
            }
        }

        private void SetImageForIndex(int idx, string filePath)
        {
            try
            {
                var bitmap = new BitmapImage();
                bitmap.BeginInit();
                bitmap.CacheOption = BitmapCacheOption.OnLoad;
                bitmap.UriSource = new Uri(filePath);
                bitmap.EndInit();

                switch (idx)
                {
                    case 0:
                        FaceImage1.Source = bitmap;
                        break;
                    case 1:
                        FaceImage2.Source = bitmap;
                        break;
                    case 2:
                        FaceImage3.Source = bitmap;
                        break;
                    case 3:
                        FaceImage4.Source = bitmap;
                        break;
                    case 4:
                        FaceImage5.Source = bitmap;
                        break;
                }

                // store path so we can upload bytes later
                if (idx >= 0 && idx < _imagePaths.Length)
                    _imagePaths[idx] = filePath;
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    "Không thể đọc file ảnh: " + ex.Message,
                    "Lỗi",
                    MessageBoxButton.OK,
                    MessageBoxImage.Error
                );
            }
        }

        private void UpdateActionButtons()
        {
            // If all five images are present, hide capture/select and show Complete
            bool allPresent =
                FaceImage1.Source != null
                && FaceImage2.Source != null
                && FaceImage3.Source != null
                && FaceImage4.Source != null
                && FaceImage5.Source != null;
            CaptureButton.Visibility = allPresent ? Visibility.Collapsed : Visibility.Visible;
            SelectButton.Visibility = allPresent ? Visibility.Collapsed : Visibility.Visible;
            CompleteButton.Visibility = allPresent ? Visibility.Visible : Visibility.Collapsed;
        }

        // Save: xử lý lưu thông tin khuôn mặt (currently demo - will upload later)
        private async void SaveButton_Click(object sender, RoutedEventArgs e)
        {
            // Validate that all five images have been provided
            bool allPresent = _imagePaths.All(p => !string.IsNullOrEmpty(p));
            if (!allPresent)
            {
                MessageBox.Show(
                    "Vui lòng chọn đủ 5 ảnh khuôn mặt trước khi hoàn tất.",
                    "Thiếu ảnh",
                    MessageBoxButton.OK,
                    MessageBoxImage.Warning
                );
                return;
            }

            if (_staff == null)
            {
                MessageBox.Show(
                    "Không xác định nhân viên.",
                    "Lỗi",
                    MessageBoxButton.OK,
                    MessageBoxImage.Error
                );
                return;
            }

            if (_compreFaceService == null)
            {
                MessageBox.Show(
                    "Dịch vụ CompreFace không sẵn có.",
                    "Lỗi",
                    MessageBoxButton.OK,
                    MessageBoxImage.Error
                );
                return;
            }

            var subjectName = $"{_staff.Id}-{_staff.FullName}";

            try
            {
                // Create subject
                var createResp = await _compreFaceService.CreateSubjectAsync(subjectName);

                // Upload each image
                for (int i = 0; i < _imagePaths.Length; i++)
                {
                    var path = _imagePaths[i];
                    if (string.IsNullOrEmpty(path) || !File.Exists(path))
                        continue;
                    var bytes = await File.ReadAllBytesAsync(path);
                    await _compreFaceService.AddFaceToSubjectAsync(subjectName, bytes);
                }

                MessageBox.Show(
                    "Đăng ký khuôn mặt thành công!",
                    "Hoàn tất",
                    MessageBoxButton.OK,
                    MessageBoxImage.Information
                );
                this.DialogResult = true;
                this.Close();
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    $"Lỗi khi đăng ký với CompreFace: {ex.Message}",
                    "Lỗi",
                    MessageBoxButton.OK,
                    MessageBoxImage.Error
                );
            }
        }
    }
}
