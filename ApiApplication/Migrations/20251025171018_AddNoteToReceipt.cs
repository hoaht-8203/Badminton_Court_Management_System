using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class AddNoteToReceipt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Note",
                table: "Receipts",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 25, 17, 10, 18, 557, DateTimeKind.Utc).AddTicks(9570), new DateTime(2025, 10, 25, 17, 10, 18, 557, DateTimeKind.Utc).AddTicks(9570) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 25, 17, 10, 18, 557, DateTimeKind.Utc).AddTicks(9570), new DateTime(2025, 10, 25, 17, 10, 18, 557, DateTimeKind.Utc).AddTicks(9570) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Note",
                table: "Receipts");

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 19, 3, 24, 55, 285, DateTimeKind.Utc).AddTicks(9740), new DateTime(2025, 10, 19, 3, 24, 55, 285, DateTimeKind.Utc).AddTicks(9740) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 19, 3, 24, 55, 285, DateTimeKind.Utc).AddTicks(9740), new DateTime(2025, 10, 19, 3, 24, 55, 285, DateTimeKind.Utc).AddTicks(9740) });
        }
    }
}
