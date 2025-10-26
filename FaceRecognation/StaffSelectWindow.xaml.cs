using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using FaceRecognation.Dtos;
using FaceRecognation.Services.Interfaces;
using Microsoft.Extensions.DependencyInjection;

namespace FaceRecognation
{
    public partial class StaffSelectWindow : Window
    {
        private readonly IStaffService _staffService;
        private List<StaffResponse> _allStaff = new List<StaffResponse>();
        private int _currentPage = 1;
        private int _pageSize = 10;

        public StaffSelectWindow(IStaffService staffService)
        {
            _staffService = staffService ?? throw new ArgumentNullException(nameof(staffService));
            try
            {
                InitializeComponent();
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    $"Lỗi khi khởi tạo XAML: {ex.Message}\n\n{ex.StackTrace}",
                    "Lỗi XAML",
                    MessageBoxButton.OK,
                    MessageBoxImage.Error
                );
                throw;
            }

            // Defensive: if generated field bindings are missing for some reason (x:Class mismatch / build action),
            // use FindName at runtime or show a diagnostic message.
            if (FindName("PageSizeComboBox") is ComboBox pageSizeCombo)
            {
                pageSizeCombo.Loaded += (s, e) => SetPageSizeFromCombo();
            }
            else
            {
                // We'll still attempt to continue; SetPageSizeFromCombo will be called from Loaded when available.
            }
            Loaded += StaffSelectWindow_Loaded;
        }

        private async void StaffSelectWindow_Loaded(object? sender, RoutedEventArgs e)
        {
            await LoadDataAsync();
        }

        // Native window chrome is used; action handlers removed.

        private async Task LoadDataAsync(string? keyword = null)
        {
            try
            {
                if (_staffService == null)
                {
                    MessageBox.Show(
                        "IStaffService is not available (null). Ensure it is registered in DI and the window is constructed via the ServiceProvider.",
                        "Lỗi cấu hình",
                        MessageBoxButton.OK,
                        MessageBoxImage.Error
                    );
                    return;
                }

                var req = new ListStaffRequest { Keyword = keyword };

                var list = await _staffService.GetAllAsync(req);
                _allStaff = list ?? new List<StaffResponse>();
                _currentPage = 1;
                UpdateGrid();
            }
            catch (Exception ex)
            {
                // Show full details to aid debugging (message + stack)
                MessageBox.Show(
                    $"Lỗi khi tải danh sách nhân viên: {ex.Message}\n\n{ex.StackTrace}",
                    "Lỗi",
                    MessageBoxButton.OK,
                    MessageBoxImage.Error
                );
            }
        }

        private void UpdateGrid()
        {
            if (_pageSize <= 0)
                _pageSize = 10;
            var total = _allStaff.Count;
            var totalPages = (int)Math.Ceiling(total / (double)_pageSize);
            if (_currentPage < 1)
                _currentPage = 1;
            if (_currentPage > totalPages)
                _currentPage = Math.Max(1, totalPages);

            var items = _allStaff.Skip((_currentPage - 1) * _pageSize).Take(_pageSize).ToList();
            // Use generated fields when available; otherwise try FindName to retrieve the control from XAML namescope.
            var dg = StaffDataGrid ?? FindName("StaffDataGrid") as System.Windows.Controls.DataGrid;
            if (dg != null)
                dg.ItemsSource = items;
            else
            {
                //MessageBox.Show("Không tìm thấy control 'StaffDataGrid' trong XAML. Kiểm tra x:Name và x:Class của StaffSelectWindow.", "Lỗi giao diện", MessageBoxButton.OK, MessageBoxImage.Error);
                return;
            }

            var pageInfo =
                PageInfoText ?? FindName("PageInfoText") as System.Windows.Controls.TextBlock;
            if (pageInfo != null)
                pageInfo.Text = $"Trang {_currentPage} / {Math.Max(1, totalPages)} (Tổng: {total})";

            var prevBtn =
                PrevPageButton ?? FindName("PrevPageButton") as System.Windows.Controls.Button;
            var nextBtn =
                NextPageButton ?? FindName("NextPageButton") as System.Windows.Controls.Button;
            if (prevBtn != null)
                prevBtn.IsEnabled = _currentPage > 1;
            if (nextBtn != null)
                nextBtn.IsEnabled = _currentPage < totalPages;
        }

        private void StaffDataGrid_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            ContinueButton.IsEnabled = StaffDataGrid.SelectedItem != null;
        }

        private async void SearchButton_Click(object sender, RoutedEventArgs e)
        {
            await LoadDataAsync(SearchTextBox.Text?.Trim());
        }

        private void PageSizeComboBox_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            SetPageSizeFromCombo();
            UpdateGrid();
        }

        private void SetPageSizeFromCombo()
        {
            if (
                PageSizeComboBox.SelectedItem is ComboBoxItem it
                && int.TryParse(it.Content?.ToString(), out var v)
            )
            {
                _pageSize = v;
            }
            else
            {
                _pageSize = 10;
            }
        }

        private void PrevPageButton_Click(object sender, RoutedEventArgs e)
        {
            _currentPage = Math.Max(1, _currentPage - 1);
            UpdateGrid();
        }

        private void NextPageButton_Click(object sender, RoutedEventArgs e)
        {
            _currentPage++;
            UpdateGrid();
        }

        private void ContinueButton_Click(object sender, RoutedEventArgs e)
        {
            if (StaffDataGrid.SelectedItem is StaffResponse s)
            {
                try
                {
                    // Prefer resolving FaceRegisterWindow from DI so the ICompreFaceService is injected.
                    var app = Application.Current as App;
                    var sp = app?.ServiceProvider;
                    Window? faceWnd = null;

                    if (sp != null)
                    {
                        faceWnd = sp.GetRequiredService<FaceRegisterWindow>();
                        // call InitForStaff if available
                        try
                        {
                            var mi = faceWnd.GetType().GetMethod("InitForStaff");
                            if (mi != null) mi.Invoke(faceWnd, new object[] { s });
                            else faceWnd.Title = $"Thêm dữ liệu khuôn mặt cho {s.FullName}";
                        }
                        catch
                        {
                            faceWnd.Title = $"Thêm dữ liệu khuôn mặt cho {s.FullName}";
                        }
                    }
                    else
                    {
                        // Fallback to parameterless construction in correct namespace
                        faceWnd = new FaceRegisterWindow();
                        try
                        {
                            var mi = faceWnd.GetType().GetMethod("InitForStaff");
                            if (mi != null) mi.Invoke(faceWnd, new object[] { s });
                            else faceWnd.Title = $"Thêm dữ liệu khuôn mặt cho {s.FullName}";
                        }
                        catch
                        {
                            faceWnd.Title = $"Thêm dữ liệu khuôn mặt cho {s.FullName}";
                        }
                    }

                    var res = faceWnd.ShowDialog();

                    // After face registration dialog closes, store selected staff and close this window
                    Application.Current.Properties["SelectedStaff"] = JsonSerializer.Serialize(s);
                    DialogResult = true;
                    Close();
                }
                catch (Exception ex)
                {
                    MessageBox.Show(
                        $"Không thể mở cửa sổ đăng ký khuôn mặt: {ex.Message}",
                        "Lỗi",
                        MessageBoxButton.OK,
                        MessageBoxImage.Error
                    );
                }
            }
        }
    }
}
