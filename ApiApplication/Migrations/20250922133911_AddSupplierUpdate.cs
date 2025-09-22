using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class AddSupplierUpdate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: new Guid("ba8008d3-6f25-4ca3-be62-21c2af0e4f97"),
                column: "PasswordHash",
                value: "AQAAAAIAAYagAAAAED5gud4IS3jOPtYSZ6Fwq7G7eeDgTUlyS3r6Bu4RUW3XBhZuCCVU3JyCUVZqGpfbQw==");

            migrationBuilder.InsertData(
                table: "Suppliers",
                columns: new[] { "SupplierId", "Address", "Company", "CreatedAt", "CreatedBy", "CurrentDebt", "Email", "Notes", "Phone", "Status", "SupplierGroup", "SupplierName", "TotalPurchase", "TotalPurchaseAfterReturn", "UpdatedAt", "UpdatedBy" },
                values: new object[,]
                {
                    { 1, "Số 10 Nguyễn Trãi, Thanh Xuân, Hà Nội", "An Phát Sports", new DateTime(2025, 9, 22, 13, 39, 9, 912, DateTimeKind.Utc).AddTicks(9967), "System", 1500000m, "anphat@sports.com", "Nhà cung cấp chính thức vợt cầu lông và bóng đá", "0901234567", "Active", "Thiết bị thể thao", "Công ty TNHH Thiết Bị Thể Thao An Phát", 50000000m, 48000000m, new DateTime(2025, 9, 22, 13, 39, 9, 912, DateTimeKind.Utc).AddTicks(9970), "System" },
                    { 2, "Số 25 Lê Lợi, Quận 1, TP. Hồ Chí Minh", "Vietnam Sports JSC", new DateTime(2025, 9, 22, 13, 39, 9, 912, DateTimeKind.Utc).AddTicks(9983), "System", 0m, "contact@vietnamsports.vn", "Cung cấp bóng chuyền và thiết bị tập gym", "0987654321", "Active", "Dụng cụ thể thao", "Công ty CP Dụng Cụ Thể Thao Việt Nam", 30000000m, 30000000m, new DateTime(2025, 9, 22, 13, 39, 9, 912, DateTimeKind.Utc).AddTicks(9984), "System" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Suppliers",
                keyColumn: "SupplierId",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Suppliers",
                keyColumn: "SupplierId",
                keyValue: 2);

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: new Guid("ba8008d3-6f25-4ca3-be62-21c2af0e4f97"),
                column: "PasswordHash",
                value: "AQAAAAIAAYagAAAAEAMgdOUwss4UXIsRvQe6wVxLtaQrLUxDmPFhzUk4tLJIt5duBM8VOUjTjZ1yIehq3Q==");
        }
    }
}
