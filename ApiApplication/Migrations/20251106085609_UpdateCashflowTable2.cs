using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class UpdateCashflowTable2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "RelatedId",
                table: "Cashflows",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 6, 8, 56, 8, 458, DateTimeKind.Utc).AddTicks(7582), new DateTime(2025, 11, 6, 8, 56, 8, 458, DateTimeKind.Utc).AddTicks(7583) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 6, 8, 56, 8, 458, DateTimeKind.Utc).AddTicks(7584), new DateTime(2025, 11, 6, 8, 56, 8, 458, DateTimeKind.Utc).AddTicks(7585) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "RelatedId",
                table: "Cashflows",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

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
    }
}
