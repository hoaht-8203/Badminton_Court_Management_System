using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class FixDatabase : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsDirectSale",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "MenuType",
                table: "Products");

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 12, 8, 1, 28, 57, 487, DateTimeKind.Utc).AddTicks(6230), new DateTime(2025, 12, 8, 1, 28, 57, 487, DateTimeKind.Utc).AddTicks(6230) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 12, 8, 1, 28, 57, 487, DateTimeKind.Utc).AddTicks(6230), new DateTime(2025, 12, 8, 1, 28, 57, 487, DateTimeKind.Utc).AddTicks(6230) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsDirectSale",
                table: "Products",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "MenuType",
                table: "Products",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

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
