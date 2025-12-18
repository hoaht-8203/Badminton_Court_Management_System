using System.Windows;
using System.Windows.Media.Animation;
using Microsoft.Extensions.DependencyInjection;

namespace FaceRecognation
{
    public partial class LandingWindow : Window
    {
        // SelectedAction: "time" | "admin" | null
        public string? SelectedAction { get; private set; }

        public LandingWindow()
        {
            InitializeComponent();
        }

        private void Window_Loaded(object sender, RoutedEventArgs e)
        {
            // Play fade-in
            if (FindResource("FadeInStoryboard") is Storyboard sb)
            {
                sb.Begin(this);
            }
        }

        private void TimekeepingButton_Click(object sender, RoutedEventArgs e)
        {
            StartCloseWithAction("time");
        }

        private void DataButton_Click(object sender, RoutedEventArgs e)
        {
            StartCloseWithAction("admin");
        }

        private void StartCloseWithAction(string? action)
        {
            // Run fade-out animation, then set result and close
            if (FindResource("FadeOutStoryboard") is Storyboard sb)
            {
                // remove previous handlers to avoid multiple triggers
                sb.Completed -= FadeOut_Completed;
                sb.Completed += FadeOut_Completed;

                // store action temporarily in Tag so we can pick it up in Completed
                this.Tag = action;

                sb.Begin(this, true);
                return;
            }

            // Fallback: immediate
            if (action == null)
                DialogResult = false;
            else
                DialogResult = true;

            SelectedAction = action;
            Close();
        }

        private void FadeOut_Completed(object? sender, System.EventArgs e)
        {
            // retrieve action stored in Tag
            var action = this.Tag as string;

            SelectedAction = action;

            // Resolve windows/services from the App's ServiceProvider and navigate accordingly
            try
            {
                var app = Application.Current as App;
                var sp = app?.ServiceProvider;
                if (sp != null)
                {
                    if (string.Equals(action, "time", System.StringComparison.OrdinalIgnoreCase))
                    {
                        // Open AttendanceWindow (face-based timekeeping)
                        var attendance = sp.GetRequiredService<AttendanceWindow>();
                        var appObj = Application.Current as App;
                        appObj?.ShowWindowAndCloseOthers(attendance);
                    }
                    else if (
                        string.Equals(action, "admin", System.StringComparison.OrdinalIgnoreCase)
                    )
                    {
                        var login = sp.GetRequiredService<LoginWindow>();
                        // Close LandingWindow before showing login dialog to prevent multiple windows
                        this.Hide(); // Hide instead of Close to keep the window alive during dialog
                        var result = login.ShowDialog();
                        if (result == true)
                        {
                            var main = sp.GetRequiredService<MainWindow>();
                            var appObj = Application.Current as App;
                            appObj?.ShowWindowAndCloseOthers(main);
                            this.Close(); // Now properly close LandingWindow
                        }
                        else
                        {
                            // login canceled or failed - shutdown app
                            Application.Current.Shutdown();
                        }
                        return; // Exit early, don't call Close() again
                    }
                }
            }
            catch
            {
                // If resolution fails, fall back to closing the landing window.
            }

            Close();
        }
    }
}
