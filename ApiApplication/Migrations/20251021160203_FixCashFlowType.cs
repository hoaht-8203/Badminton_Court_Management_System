using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class FixCashFlowType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 21, 16, 2, 1, 614, DateTimeKind.Utc).AddTicks(224), new DateTime(2025, 10, 21, 16, 2, 1, 614, DateTimeKind.Utc).AddTicks(225) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 21, 16, 2, 1, 614, DateTimeKind.Utc).AddTicks(226), new DateTime(2025, 10, 21, 16, 2, 1, 614, DateTimeKind.Utc).AddTicks(227) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 19, 8, 7, 15, 35, DateTimeKind.Utc).AddTicks(1467), new DateTime(2025, 10, 19, 8, 7, 15, 35, DateTimeKind.Utc).AddTicks(1467) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 19, 8, 7, 15, 35, DateTimeKind.Utc).AddTicks(1469), new DateTime(2025, 10, 19, 8, 7, 15, 35, DateTimeKind.Utc).AddTicks(1469) });
        }
    }
}
