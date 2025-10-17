using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class AddDataCashflow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "CashflowTypes",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "Code", "Description", "Name" },
                values: new object[] { "TTM", "Thu nhập khác", "Thu nhập khác" });

            migrationBuilder.UpdateData(
                table: "CashflowTypes",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "Code", "Description", "IsPayment", "Name" },
                values: new object[] { "CTM", "Chi phí khác", true, "Chi phí khác" });

            migrationBuilder.UpdateData(
                table: "CashflowTypes",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "Code", "Description", "IsPayment", "Name" },
                values: new object[] { "TTTS", "Thu từ khách hàng thuê sân cầu lông", false, "Thu tiền thuê sân" });

            migrationBuilder.UpdateData(
                table: "CashflowTypes",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "Code", "Description", "IsPayment", "Name" },
                values: new object[] { "TTBH", "Thu tiền từ việc bán hàng hóa, đồ uống", false, "Thu tiền bán hàng" });

            migrationBuilder.InsertData(
                table: "CashflowTypes",
                columns: new[] { "Id", "Code", "CreatedAt", "CreatedBy", "Description", "IsActive", "IsPayment", "Name", "UpdatedAt", "UpdatedBy" },
                values: new object[,]
                {
                    { 5, "CMHH", new DateTime(2025, 10, 17, 9, 0, 0, 0, DateTimeKind.Utc), "System", "Chi để nhập hàng hóa, vật tư", true, true, "Chi mua hàng hóa", new DateTime(2025, 10, 17, 9, 0, 0, 0, DateTimeKind.Utc), "System" },
                    { 6, "CLNV", new DateTime(2025, 10, 17, 9, 0, 0, 0, DateTimeKind.Utc), "System", "Chi trả lương cho nhân viên", true, true, "Chi lương nhân viên", new DateTime(2025, 10, 17, 9, 0, 0, 0, DateTimeKind.Utc), "System" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "CashflowTypes",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "CashflowTypes",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.UpdateData(
                table: "CashflowTypes",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "Code", "Description", "Name" },
                values: new object[] { "TTTS", "Thu từ khách hàng thuê sân cầu lông", "Thu tiền thuê sân" });

            migrationBuilder.UpdateData(
                table: "CashflowTypes",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "Code", "Description", "IsPayment", "Name" },
                values: new object[] { "TTBH", "Thu tiền từ việc bán hàng hóa, đồ uống", false, "Thu tiền bán hàng" });

            migrationBuilder.UpdateData(
                table: "CashflowTypes",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "Code", "Description", "IsPayment", "Name" },
                values: new object[] { "CMHH", "Chi để nhập hàng hóa, vật tư", true, "Chi mua hàng hóa" });

            migrationBuilder.UpdateData(
                table: "CashflowTypes",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "Code", "Description", "IsPayment", "Name" },
                values: new object[] { "CLNV", "Chi trả lương cho nhân viên", true, "Chi lương nhân viên" });
        }
    }
}
