using System.Windows;
using System.Windows.Media.Imaging;
using Microsoft.Win32;

namespace FaceApp
{
    public partial class FaceRegisterWindow : Window
    {
        private int currentFaceIndex = 0;

        public FaceRegisterWindow()
        {
            InitializeComponent();
        }

        // Native window chrome is used; minimize/maximize handlers removed.

        // Capture face: chọn ảnh từ file để demo
        private void CaptureButton_Click(object sender, RoutedEventArgs e)
        {
            if (currentFaceIndex > 3)
            {
                MessageBox.Show("You have already registered 4 faces.");
                return;
            }

            var dialog = new OpenFileDialog();
            dialog.Filter = "Image Files|*.jpg;*.jpeg;*.png;*.bmp";
            if (dialog.ShowDialog() == true)
            {
                var bitmap = new BitmapImage(new System.Uri(dialog.FileName));
                switch (currentFaceIndex)
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
                }
                currentFaceIndex++;
            }
        }

        // Save: xử lý lưu thông tin khuôn mặt
        private void SaveButton_Click(object sender, RoutedEventArgs e)
        {
            // TODO: Lưu dữ liệu khuôn mặt
            MessageBox.Show("Faces registered successfully!");
        }

        // Exit handled by system window close button.

        private void SelectButton_Click(object sender, RoutedEventArgs e) { }
    }
}
