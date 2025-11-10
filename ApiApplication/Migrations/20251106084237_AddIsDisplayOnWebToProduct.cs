using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class AddIsDisplayOnWebToProduct : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsDisplayOnWeb",
                table: "Products",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 6, 8, 42, 37, 16, DateTimeKind.Utc).AddTicks(4210), new DateTime(2025, 11, 6, 8, 42, 37, 16, DateTimeKind.Utc).AddTicks(4210) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 6, 8, 42, 37, 16, DateTimeKind.Utc).AddTicks(4210), new DateTime(2025, 11, 6, 8, 42, 37, 16, DateTimeKind.Utc).AddTicks(4210) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsDisplayOnWeb",
                table: "Products");

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 3, 14, 11, 57, 924, DateTimeKind.Utc).AddTicks(9330), new DateTime(2025, 11, 3, 14, 11, 57, 924, DateTimeKind.Utc).AddTicks(9340) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 3, 14, 11, 57, 924, DateTimeKind.Utc).AddTicks(9340), new DateTime(2025, 11, 3, 14, 11, 57, 924, DateTimeKind.Utc).AddTicks(9340) });
        }
    }
}
