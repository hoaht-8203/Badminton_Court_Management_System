using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using FaceRecognation.Dtos;
using FaceRecognation.Services.Interfaces;

namespace FaceRecognation
{
    public partial class StaffSelectWindow : Window
    {
        private readonly IStaffService _staffService;
        private List<StaffResponseDto> _allStaff = new List<StaffResponseDto>();
        private int _currentPage = 1;
        private int _pageSize = 10;

        public StaffSelectWindow(IStaffService staffService)
        {
            _staffService = staffService ?? throw new ArgumentNullException(nameof(staffService));
            InitializeComponent();
            PageSizeComboBox.Loaded += (s, e) =>
            {
                SetPageSizeFromCombo();
            };
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
                var req = new ListStaffRequestDto { Keyword = keyword };
                _allStaff = await _staffService.GetAllAsync(req);
                _currentPage = 1;
                UpdateGrid();
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    $"Lỗi khi tải danh sách nhân viên: {ex.Message}",
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
            StaffDataGrid.ItemsSource = items;
            PageInfoText.Text = $"Trang {_currentPage} / {Math.Max(1, totalPages)} (Tổng: {total})";

            PrevPageButton.IsEnabled = _currentPage > 1;
            NextPageButton.IsEnabled = _currentPage < totalPages;
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
            if (StaffDataGrid.SelectedItem is StaffResponseDto s)
            {
                Application.Current.Properties["SelectedStaff"] = JsonSerializer.Serialize(s);
                DialogResult = true;
                Close();
            }
        }
    }
}
