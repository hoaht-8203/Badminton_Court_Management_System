using ClosedXML.Excel;
using Microsoft.AspNetCore.Mvc;

namespace ApiApplication.Services.Impl;

public class ExportService(IBookingCourtService bookingCourtService) : IExportService
{
    private readonly IBookingCourtService _bookingCourtService = bookingCourtService;

    public async Task<FileContentResult> ExportBookingHistoryAsync()
    {
        var bookingHistory = await _bookingCourtService.GetUserBookingHistoryAsync();
        using (var workbook = new XLWorkbook())
        {
            var ws = workbook.Worksheets.Add("Booking History");

            ws.Cell(1, 1).Value = "Booking ID";
            ws.Cell(1, 2).Value = "Payment ID";
            ws.Cell(1, 3).Value = "Customer ID";
            ws.Cell(1, 4).Value = "Customer Name";
            ws.Cell(1, 5).Value = "Court Name";
            ws.Cell(1, 6).Value = "Start Date";
            ws.Cell(1, 7).Value = "End Date";
            ws.Cell(1, 8).Value = "Start Time";
            ws.Cell(1, 9).Value = "End Time";
            ws.Cell(1, 10).Value = "Total Hours";
            ws.Cell(1, 11).Value = "Total Amount";
            ws.Cell(1, 12).Value = "Paid Amount";
            ws.Cell(1, 13).Value = "Remaining Amount";
            ws.Cell(1, 14).Value = "Status";

            var headerRange = ws.Range("A1:N1");
            headerRange.Style.Font.Bold = true;
            headerRange.Style.Fill.BackgroundColor = XLColor.LightGray;
            headerRange.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

            for (int i = 0; i < bookingHistory.Count; i++)
            {
                var row = i + 2;
                var b = bookingHistory[i];

                ws.Cell(row, 1).Value = b.Id.ToString();
                ws.Cell(row, 2).Value = b.PaymentId;
                ws.Cell(row, 3).Value = b.CustomerId;
                ws.Cell(row, 4).Value = b.CustomerName;
                ws.Cell(row, 5).Value = b.CourtName;
                ws.Cell(row, 6).Value = b.StartDate.ToString("yyyy-MM-dd");
                ws.Cell(row, 7).Value = b.EndDate.ToString("yyyy-MM-dd");
                ws.Cell(row, 8).Value = b.StartTime.ToString("HH:mm");
                ws.Cell(row, 9).Value = b.EndTime.ToString("HH:mm");
                ws.Cell(row, 10).Value = b.TotalHours;
                ws.Cell(row, 11).Value = b.TotalAmount;
                ws.Cell(row, 12).Value = b.PaidAmount;
                ws.Cell(row, 13).Value = b.RemainingAmount;
                ws.Cell(row, 14).Value = b.Status;
            }

            ws.Columns().AdjustToContents();

            using (var stream = new MemoryStream())
            {
                workbook.SaveAs(stream);
                var content = stream.ToArray();

                var result = new FileContentResult(
                    content,
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                )
                {
                    FileDownloadName = $"booking_history_{DateTime.Now:yyyyMMddHHmmss}.xlsx",
                };
                return result;
            }
        }
    }
}
