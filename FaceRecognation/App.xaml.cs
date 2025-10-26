using System;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Windows;
using FaceRecognation.Services;
using FaceRecognation.Services.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace FaceRecognation
{
    /// <summary>
    /// Interaction logic for App.xaml
    /// </summary>
    public partial class App : Application
    {
        public IServiceProvider? ServiceProvider { get; private set; }

        /// <summary>
        /// Show the specified window and close all other top-level windows in the application.
        /// The specified window will be set as Application.Current.MainWindow.
        /// </summary>
        public void ShowWindowAndCloseOthers(Window window)
        {
            if (window == null)
                return;

            // copy current windows to avoid modifying collection while iterating
            var existing = this.Windows.Cast<Window>().ToList();

            // Show the new window first (but don't set as main yet) so it appears before others close
            window.Show();

            foreach (var w in existing)
            {
                try
                {
                    if (w != window)
                        w.Close();
                }
                catch { }
            }

            this.MainWindow = window;
        }

        protected override void OnStartup(StartupEventArgs e)
        {
            base.OnStartup(e);

            // Build configuration from appsettings.json (optional)
            var config = new ConfigurationBuilder()
                .SetBasePath(AppContext.BaseDirectory)
                .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
                .AddEnvironmentVariables()
                .Build();

            var compreFaceBaseUrl = config["CompreFaceBaseUrl"] ?? "http://localhost:8000";
            var recognitionApiKey = config["RecognitionApiKey"] ?? string.Empty;
            var antiSpoofingUrl = config["AntiSpoofingUrl"] ?? "http://localhost:5001";
            var apiBaseUrl = config["ApiBaseUrl"] ?? "http://localhost:5039";

            var services = new ServiceCollection();

            services.AddSingleton<IConfiguration>(config);

            // Register services and configure named/typed HttpClients for them
            // Shared CookieContainer so authenticated cookies set by ApiApplication are sent with other requests
            services.AddSingleton<CookieContainer>();

            // Auth client: handles login and holds the cookie container on its HttpClient handler
            services
                .AddHttpClient<Services.Interfaces.IAuthService, Services.AuthService>(client =>
                {
                    client.BaseAddress = new Uri(apiBaseUrl);
                })
                .ConfigurePrimaryHttpMessageHandler(sp => new HttpClientHandler
                {
                    CookieContainer = sp.GetRequiredService<CookieContainer>(),
                });

            // CompreFace client (may use same cookie container if server uses cookies for auth)
            services
                .AddHttpClient<ICompreFaceService, CompreFaceService>(client =>
                {
                    client.BaseAddress = new Uri(compreFaceBaseUrl);
                    if (!string.IsNullOrWhiteSpace(recognitionApiKey))
                        client.DefaultRequestHeaders.Add("x-api-key", recognitionApiKey);
                })
                .ConfigurePrimaryHttpMessageHandler(sp => new HttpClientHandler
                {
                    CookieContainer = sp.GetRequiredService<CookieContainer>(),
                });

            services
                .AddHttpClient<IAntiSnoofingService, AntiSnoofingService>(client =>
                {
                    client.BaseAddress = new Uri(antiSpoofingUrl);
                })
                .ConfigurePrimaryHttpMessageHandler(sp => new HttpClientHandler
                {
                    CookieContainer = sp.GetRequiredService<CookieContainer>(),
                });

            // Attendance client (calls ApiApplication attendance endpoints)
            services
                .AddHttpClient<Services.Interfaces.IAttendanceClient, Services.AttendanceClient>(client =>
                {
                    client.BaseAddress = new Uri(apiBaseUrl);
                })
                .ConfigurePrimaryHttpMessageHandler(sp => new HttpClientHandler
                {
                    CookieContainer = sp.GetRequiredService<CookieContainer>(),
                });

            // Register staff client
            services
                .AddHttpClient<Services.Interfaces.IStaffService, Services.StaffService>(client =>
                {
                    client.BaseAddress = new Uri(apiBaseUrl);
                })
                .ConfigurePrimaryHttpMessageHandler(sp => new HttpClientHandler
                {
                    CookieContainer = sp.GetRequiredService<CookieContainer>(),
                });

            // Register windows so they can be resolved from DI
            services.AddTransient<LoginWindow>();
            services.AddTransient<FaceRegisterWindow>();
            services.AddTransient<MainWindow>();
            services.AddTransient<AttendanceWindow>();
            services.AddTransient<StaffSelectWindow>();
            services.AddTransient<LandingWindow>();

            ServiceProvider = services.BuildServiceProvider();

            // Resolve and show LandingWindow first. LandingWindow will handle navigation itself.
            var landing = ServiceProvider.GetRequiredService<LandingWindow>();
            landing.Show();
        }

        protected override void OnExit(ExitEventArgs e)
        {
            if (ServiceProvider is IDisposable d)
            {
                d.Dispose();
            }

            base.OnExit(e);
        }
    }
}
