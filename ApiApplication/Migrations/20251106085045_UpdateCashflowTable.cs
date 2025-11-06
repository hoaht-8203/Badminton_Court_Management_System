using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class UpdateCashflowTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "RelatedId",
                table: "Cashflows",
                type: "text",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 6, 8, 50, 44, 226, DateTimeKind.Utc).AddTicks(9423), new DateTime(2025, 11, 6, 8, 50, 44, 226, DateTimeKind.Utc).AddTicks(9425) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 6, 8, 50, 44, 226, DateTimeKind.Utc).AddTicks(9430), new DateTime(2025, 11, 6, 8, 50, 44, 226, DateTimeKind.Utc).AddTicks(9431) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "RelatedId",
                table: "Cashflows",
                type: "integer",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

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
