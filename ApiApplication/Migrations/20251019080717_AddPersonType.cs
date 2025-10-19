using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class AddPersonType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PersonType",
                table: "Cashflows",
                type: "text",
                nullable: true);

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PersonType",
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
    }
}
