using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class AddServicesSubtotalToOrder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "ServicesSubtotal",
                table: "Orders",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 22, 10, 21, 18, 280, DateTimeKind.Utc).AddTicks(380), new DateTime(2025, 10, 22, 10, 21, 18, 280, DateTimeKind.Utc).AddTicks(380) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 22, 10, 21, 18, 280, DateTimeKind.Utc).AddTicks(380), new DateTime(2025, 10, 22, 10, 21, 18, 280, DateTimeKind.Utc).AddTicks(380) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ServicesSubtotal",
                table: "Orders");

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 22, 7, 30, 13, 155, DateTimeKind.Utc).AddTicks(7010), new DateTime(2025, 10, 22, 7, 30, 13, 155, DateTimeKind.Utc).AddTicks(7010) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 22, 7, 30, 13, 155, DateTimeKind.Utc).AddTicks(7010), new DateTime(2025, 10, 22, 7, 30, 13, 155, DateTimeKind.Utc).AddTicks(7010) });
        }
    }
}
