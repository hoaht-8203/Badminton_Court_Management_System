using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderCodeToOrder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "OrderCode",
                table: "Orders",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 23, 16, 25, 17, 688, DateTimeKind.Utc).AddTicks(5500), new DateTime(2025, 10, 23, 16, 25, 17, 688, DateTimeKind.Utc).AddTicks(5510) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 23, 16, 25, 17, 688, DateTimeKind.Utc).AddTicks(5510), new DateTime(2025, 10, 23, 16, 25, 17, 688, DateTimeKind.Utc).AddTicks(5510) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OrderCode",
                table: "Orders");

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 23, 4, 32, 52, 160, DateTimeKind.Utc).AddTicks(7830), new DateTime(2025, 10, 23, 4, 32, 52, 160, DateTimeKind.Utc).AddTicks(7830) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 23, 4, 32, 52, 160, DateTimeKind.Utc).AddTicks(7830), new DateTime(2025, 10, 23, 4, 32, 52, 160, DateTimeKind.Utc).AddTicks(7830) });
        }
    }
}
