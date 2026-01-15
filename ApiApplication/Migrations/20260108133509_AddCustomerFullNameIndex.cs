using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomerFullNameIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 1, 8, 13, 35, 9, 9, DateTimeKind.Utc).AddTicks(470), new DateTime(2026, 1, 8, 13, 35, 9, 9, DateTimeKind.Utc).AddTicks(470) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 1, 8, 13, 35, 9, 9, DateTimeKind.Utc).AddTicks(470), new DateTime(2026, 1, 8, 13, 35, 9, 9, DateTimeKind.Utc).AddTicks(470) });

            migrationBuilder.CreateIndex(
                name: "IX_Customers_FullName",
                table: "Customers",
                column: "FullName");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Customers_FullName",
                table: "Customers");

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 12, 6, 6, 57, 2, 755, DateTimeKind.Utc).AddTicks(8447), new DateTime(2025, 12, 6, 6, 57, 2, 755, DateTimeKind.Utc).AddTicks(8447) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 12, 6, 6, 57, 2, 755, DateTimeKind.Utc).AddTicks(8449), new DateTime(2025, 12, 6, 6, 57, 2, 755, DateTimeKind.Utc).AddTicks(8449) });
        }
    }
}
