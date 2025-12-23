using System;
using System.Drawing;
using System.Drawing.Imaging;
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
        private byte[]?[] _imageBytes = new byte[]?[5]; // Store image bytes instead of paths

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
            // When user clicks an image slot, open file dialog to choose an image for that slot
            if (sender is System.Windows.Controls.Image img && img.Tag != null)
            {
                if (int.TryParse(img.Tag.ToString(), out var idx))
                {
                    var dialog = new OpenFileDialog();
                    dialog.Filter = "Image Files|*.jpg;*.jpeg;*.png;*.bmp";
                    if (dialog.ShowDialog() == true)
                    {
                        SetImageForIndex(idx, dialog.FileName);
                        currentFaceIndex = Math.Min(4, idx + 1);
                        UpdateActionButtons();
                    }
                }
            }
        }

        private void RemoveImage_Click(object sender, RoutedEventArgs e)
        {
            if (sender is System.Windows.Controls.Button btn && btn.Tag != null)
            {
                if (int.TryParse(btn.Tag.ToString(), out var idx))
                {
                    // clear image and path
                    switch (idx)
                    {
                        case 0:
                            FaceImage1.Source = null;
                            break;
                        case 1:
                            FaceImage2.Source = null;
                            break;
                        case 2:
                            FaceImage3.Source = null;
                            break;
                        case 3:
                            FaceImage4.Source = null;
                            break;
                        case 4:
                            FaceImage5.Source = null;
                            break;
                    }

                    if (idx >= 0 && idx < _imageBytes.Length)
                        _imageBytes[idx] = null;

                    // hide the remove button
                    try
                    {
                        btn.Visibility = Visibility.Collapsed;
                    }
                    catch { }
                    UpdateActionButtons();
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
                // Load and fix EXIF orientation, then save bytes
                var (bitmap, bytes) = LoadImageWithCorrectOrientationAndBytes(filePath);

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

                // Store corrected image bytes
                if (idx >= 0 && idx < _imageBytes.Length)
                    _imageBytes[idx] = bytes;

                // show the corresponding remove button
                try
                {
                    switch (idx)
                    {
                        case 0:
                            RemoveImage1.Visibility = Visibility.Visible;
                            break;
                        case 1:
                            RemoveImage2.Visibility = Visibility.Visible;
                            break;
                        case 2:
                            RemoveImage3.Visibility = Visibility.Visible;
                            break;
                        case 3:
                            RemoveImage4.Visibility = Visibility.Visible;
                            break;
                        case 4:
                            RemoveImage5.Visibility = Visibility.Visible;
                            break;
                    }
                }
                catch { }
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
            bool allPresent = _imageBytes.All(b => b != null && b.Length > 0);
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
                for (int i = 0; i < _imageBytes.Length; i++)
                {
                    var bytes = _imageBytes[i];
                    if (bytes == null || bytes.Length == 0)
                        continue;
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

        /// <summary>
        /// Load image, fix EXIF orientation, and return both BitmapSource and bytes
        /// </summary>
        private (BitmapSource bitmap, byte[] bytes) LoadImageWithCorrectOrientationAndBytes(string filePath)
        {
            using (var originalBitmap = new Bitmap(filePath))
            {
                // Fix EXIF orientation
                if (originalBitmap.PropertyIdList.Contains(0x0112)) // PropertyTagOrientation
                {
                    var prop = originalBitmap.GetPropertyItem(0x0112);
                    int orientation = prop.Value[0];

                    switch (orientation)
                    {
                        case 2:
                            originalBitmap.RotateFlip(RotateFlipType.RotateNoneFlipX);
                            break;
                        case 3:
                            originalBitmap.RotateFlip(RotateFlipType.Rotate180FlipNone);
                            break;
                        case 4:
                            originalBitmap.RotateFlip(RotateFlipType.Rotate180FlipX);
                            break;
                        case 5:
                            originalBitmap.RotateFlip(RotateFlipType.Rotate90FlipX);
                            break;
                        case 6:
                            originalBitmap.RotateFlip(RotateFlipType.Rotate90FlipNone);
                            break;
                        case 7:
                            originalBitmap.RotateFlip(RotateFlipType.Rotate270FlipX);
                            break;
                        case 8:
                            originalBitmap.RotateFlip(RotateFlipType.Rotate270FlipNone);
                            break;
                    }

                    // Remove EXIF orientation tag
                    originalBitmap.RemovePropertyItem(0x0112);
                }

                // Convert to bytes and BitmapSource
                using (var memory = new MemoryStream())
                {
                    originalBitmap.Save(memory, ImageFormat.Jpeg);
                    var imageBytes = memory.ToArray();

                    // Create BitmapSource from bytes
                    memory.Position = 0;
                    var bitmapImage = new BitmapImage();
                    bitmapImage.BeginInit();
                    bitmapImage.CacheOption = BitmapCacheOption.OnLoad;
                    bitmapImage.StreamSource = memory;
                    bitmapImage.EndInit();
                    bitmapImage.Freeze();

                    return (bitmapImage, imageBytes);
                }
            }
        }
    }
}