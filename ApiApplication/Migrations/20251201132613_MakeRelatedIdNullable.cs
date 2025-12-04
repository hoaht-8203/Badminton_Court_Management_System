using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class MakeRelatedIdNullable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Change RelatedId from NOT NULL to nullable
            migrationBuilder.AlterColumn<string>(
                name: "RelatedId",
                table: "Cashflows",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: false,
                oldDefaultValue: "");

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 12, 1, 13, 22, 32, 87, DateTimeKind.Utc).AddTicks(9532), new DateTime(2025, 12, 1, 13, 22, 32, 87, DateTimeKind.Utc).AddTicks(9533) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 12, 1, 13, 22, 32, 87, DateTimeKind.Utc).AddTicks(9534), new DateTime(2025, 12, 1, 13, 22, 32, 87, DateTimeKind.Utc).AddTicks(9535) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Revert RelatedId back to NOT NULL with default empty string
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
                values: new object[] { new DateTime(2025, 11, 7, 23, 8, 58, 304, DateTimeKind.Utc).AddTicks(683), new DateTime(2025, 11, 7, 23, 8, 58, 304, DateTimeKind.Utc).AddTicks(684) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 7, 23, 8, 58, 304, DateTimeKind.Utc).AddTicks(685), new DateTime(2025, 11, 7, 23, 8, 58, 304, DateTimeKind.Utc).AddTicks(686) });
        }
    }
}

