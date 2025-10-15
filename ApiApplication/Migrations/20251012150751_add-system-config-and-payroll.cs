using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class AddSystemConfigAndPayroll : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Code",
                table: "Payrolls");

            migrationBuilder.DropColumn(
                name: "Code",
                table: "PayrollItems");

            migrationBuilder.AddColumn<decimal>(
                name: "TotalNetSalary",
                table: "Payrolls",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "TotalPaidAmount",
                table: "Payrolls",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.InsertData(
                table: "SystemConfigs",
                columns: new[] { "Id", "CreatedAt", "CreatedBy", "Description", "Group", "Key", "UpdatedAt", "UpdatedBy", "Value" },
                values: new object[,]
                {
                    { 1, new DateTime(2025, 10, 12, 15, 7, 49, 436, DateTimeKind.Utc).AddTicks(8445), "System", "Ngày tạo bảng lương hàng tháng", null, "MonthlyPayrollGeneration", new DateTime(2025, 10, 12, 15, 7, 49, 436, DateTimeKind.Utc).AddTicks(8445), "System", "1" },
                    { 2, new DateTime(2025, 10, 12, 15, 7, 49, 436, DateTimeKind.Utc).AddTicks(8447), "System", "Chế độ nghỉ lễ của hệ thống", null, "Holidays", new DateTime(2025, 10, 12, 15, 7, 49, 436, DateTimeKind.Utc).AddTicks(8447), "System", "" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DropColumn(
                name: "TotalNetSalary",
                table: "Payrolls");

            migrationBuilder.DropColumn(
                name: "TotalPaidAmount",
                table: "Payrolls");

            migrationBuilder.AddColumn<string>(
                name: "Code",
                table: "Payrolls",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Code",
                table: "PayrollItems",
                type: "text",
                nullable: false,
                defaultValue: "");
        }
    }
}
