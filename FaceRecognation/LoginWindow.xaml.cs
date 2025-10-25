using System;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Linq;
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
                    landing.Show();
                    this.Close();
                    return;
                }
            }
            catch { }

            // fallback
            try
            {
                var landing = new LandingWindow();
                landing.Show();
                this.Close();
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
                    // Parse roles from the returned JSON payload and require Admin role
                    bool isAdmin = false;
                    try
                    {
                        if (!string.IsNullOrEmpty(result.RawData))
                        {
                            using var doc = JsonDocument.Parse(result.RawData);
                            if (doc.RootElement.TryGetProperty("data", out var dataProp) &&
                                dataProp.ValueKind == JsonValueKind.Object &&
                                dataProp.TryGetProperty("roles", out var rolesProp) &&
                                rolesProp.ValueKind == JsonValueKind.Array)
                            {
                                isAdmin = rolesProp.EnumerateArray()
                                    .Select(e => e.GetString())
                                    .Any(r => string.Equals(r, "Admin", StringComparison.OrdinalIgnoreCase));
                            }
                        }
                    }
                    catch
                    {
                        // If parsing fails, treat as not authorized
                        isAdmin = false;
                    }

                    if (!isAdmin)
                    {
                        StatusText.Text = "Bạn không có quyền truy cập. Yêu cầu role 'Admin'.";
                        LoginButton.IsEnabled = true;
                        return;
                    }

                    StatusText.Text = "Đăng nhập thành công.";
                    if (!string.IsNullOrEmpty(result.RawData))
                        Application.Current.Properties["CurrentUser"] = result.RawData;

                    // AuthService shares the CookieContainer via DI; no need to store cookies here.
                    // Navigate to StaffSelectWindow next
                    try
                    {
                        var app = Application.Current as App;
                        var sp = app?.ServiceProvider;
                        if (sp != null)
                        {
                            var staffSelect = sp.GetRequiredService<StaffSelectWindow>();
                            staffSelect.Show();
                            DialogResult = true;
                            this.Close();
                            return;
                        }
                    }
                    catch { }

                    // If DI is not available we cannot construct StaffSelectWindow (it requires services).
                    // Inform the user and keep the login window open so the app can be started through
                    // the normal bootstrap (where the ServiceProvider is available).
                    StatusText.Text = "Đăng nhập thành công, nhưng không thể mở trang chọn nhân viên (ServiceProvider không sẵn có).";
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
