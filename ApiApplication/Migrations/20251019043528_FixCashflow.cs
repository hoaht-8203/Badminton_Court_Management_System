using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class FixCashflow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AccountInBusinessResults",
                table: "Cashflows");

            migrationBuilder.DropColumn(
                name: "PaymentMethod",
                table: "Cashflows");

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 19, 4, 35, 26, 312, DateTimeKind.Utc).AddTicks(2911), new DateTime(2025, 10, 19, 4, 35, 26, 312, DateTimeKind.Utc).AddTicks(2911) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 19, 4, 35, 26, 312, DateTimeKind.Utc).AddTicks(2913), new DateTime(2025, 10, 19, 4, 35, 26, 312, DateTimeKind.Utc).AddTicks(2913) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "AccountInBusinessResults",
                table: "Cashflows",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "PaymentMethod",
                table: "Cashflows",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 18, 15, 31, 50, 808, DateTimeKind.Utc).AddTicks(5170), new DateTime(2025, 10, 18, 15, 31, 50, 808, DateTimeKind.Utc).AddTicks(5170) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 18, 15, 31, 50, 808, DateTimeKind.Utc).AddTicks(5170), new DateTime(2025, 10, 18, 15, 31, 50, 808, DateTimeKind.Utc).AddTicks(5170) });
        }
    }
}
