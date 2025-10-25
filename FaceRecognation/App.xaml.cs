using System;
using System.IO;
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

            var services = new ServiceCollection();

            services.AddSingleton<IConfiguration>(config);

            // Register services and configure named/typed HttpClients for them
            services.AddHttpClient<ICompreFaceService, CompreFaceService>(client =>
            {
                client.BaseAddress = new Uri(compreFaceBaseUrl);
                if (!string.IsNullOrWhiteSpace(recognitionApiKey))
                    client.DefaultRequestHeaders.Add("x-api-key", recognitionApiKey);
            });

            services.AddHttpClient<IAntiSnoofingService, AntiSnoofingService>(client =>
            {
                client.BaseAddress = new Uri(antiSpoofingUrl);
            });

            // Register MainWindow so it can be resolved from DI (it currently has a parameterless ctor)
            services.AddTransient<MainWindow>();

            ServiceProvider = services.BuildServiceProvider();

            // Resolve and show MainWindow through DI
            var mainWindow = ServiceProvider.GetRequiredService<MainWindow>();
            mainWindow.Show();
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
