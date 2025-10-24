using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class FixDatabaseAfterMerge24102025 : Migration
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
                values: new object[] { new DateTime(2025, 10, 24, 15, 37, 57, 530, DateTimeKind.Utc).AddTicks(9480), new DateTime(2025, 10, 24, 15, 37, 57, 530, DateTimeKind.Utc).AddTicks(9480) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 24, 15, 37, 57, 530, DateTimeKind.Utc).AddTicks(9480), new DateTime(2025, 10, 24, 15, 37, 57, 530, DateTimeKind.Utc).AddTicks(9480) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PersonType",
                table: "Cashflows");

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
                values: new object[] { new DateTime(2025, 10, 23, 20, 55, 47, 87, DateTimeKind.Utc).AddTicks(6570), new DateTime(2025, 10, 23, 20, 55, 47, 87, DateTimeKind.Utc).AddTicks(6570) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 23, 20, 55, 47, 87, DateTimeKind.Utc).AddTicks(6570), new DateTime(2025, 10, 23, 20, 55, 47, 87, DateTimeKind.Utc).AddTicks(6570) });
        }
    }
}
