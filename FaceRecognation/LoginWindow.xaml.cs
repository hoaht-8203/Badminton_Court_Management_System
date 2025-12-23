using System;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.Windows;
using FaceRecognation.Services.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace FaceRecognation
{
    public partial class LoginWindow : Window
    {
        private readonly IAuthService _authService;

        public LoginWindow(IAuthService authService)
        {
            _authService = authService ?? throw new ArgumentNullException(nameof(authService));
            InitializeComponent();
        }

        private void CancelButton_Click(object sender, RoutedEventArgs e)
        {
            DialogResult = false;
            Close();
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
                    app?.ShowWindowAndCloseOthers(landing);
                    return;
                }
            }
            catch { }

            // fallback
            try
            {
                var landing = new LandingWindow();
                var app = Application.Current as App;
                app?.ShowWindowAndCloseOthers(landing);
            }
            catch { }
        }

        private async void LoginButton_Click(object sender, RoutedEventArgs e)
        {
            await DoLoginAsync();
        }

        private async Task DoLoginAsync()
        {
            StatusText.Text = "Đang đăng nhập...";
            LoginButton.IsEnabled = false;

            var email = EmailTextBox.Text?.Trim();
            var password = PasswordBox.Password ?? string.Empty;

            if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(password))
            {
                StatusText.Text = "Vui lòng nhập email và mật khẩu.";
                LoginButton.IsEnabled = true;
                return;
            }

            try
            {
                var result = await _authService.LoginAsync(email, password);
                if (result.Success)
                {
                    // Cho phép Admin hoặc Chủ sân đăng nhập
                    bool isAdmin = _authService.HasRole("Admin");
                    bool isOwner = _authService.HasRole("BranchAdministrator");
                    if (!isAdmin && !isOwner)
                    {
                        StatusText.Text =
                            "Bạn không có quyền truy cập. Yêu cầu role 'Admin' hoặc 'Chủ sân'.";
                        LoginButton.IsEnabled = true;
                        return;
                    }

                    StatusText.Text = "Đăng nhập thành công.";
                    if (result.Data != null)
                        Application.Current.Properties["CurrentUser"] = result.Data;

                    // AuthService shares the CookieContainer via DI; no need to store cookies here.
                    // Navigate to StaffSelectWindow next. Show it modally and only set DialogResult = true
                    // when the staff selection completes successfully. This prevents LandingWindow
                    // from opening MainWindow before staff selection is done.
                    try
                    {
                        var app = Application.Current as App;
                        var sp = app?.ServiceProvider;
                        if (sp != null)
                        {
                            var staffSelect = sp.GetRequiredService<StaffSelectWindow>();
                            var sel = staffSelect.ShowDialog();
                            if (sel == true)
                            {
                                DialogResult = true;
                                this.Close();
                                return;
                            }

                            // If staff selection was cancelled, keep the login window open
                            StatusText.Text = "Đã hủy chọn nhân viên.";
                            LoginButton.IsEnabled = true;
                            return;
                        }
                    }
                    catch { }

                    // If DI is not available we cannot construct StaffSelectWindow (it requires services).
                    // Inform the user and keep the login window open so the app can be started through
                    // the normal bootstrap (where the ServiceProvider is available).
                    StatusText.Text =
                        "Đăng nhập thành công, nhưng không thể mở trang chọn nhân viên (ServiceProvider không sẵn có).";
                    LoginButton.IsEnabled = true;
                    return;
                }

                StatusText.Text = result.Message ?? "Đăng nhập thất bại";
            }
            catch (Exception ex)
            {
                StatusText.Text = "Lỗi khi gọi API: " + ex.Message;
            }
            finally
            {
                LoginButton.IsEnabled = true;
            }
        }
    }
}
