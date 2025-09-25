using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class RemoveProductIsExtraTopping : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsExtraTopping",
                table: "Products");

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: new Guid("ba8008d3-6f25-4ca3-be62-21c2af0e4f97"),
                column: "PasswordHash",
                value: "AQAAAAIAAYagAAAAEFYnhaKbImUsdoa/B7awovP4V62+ngJXv8cGyC6Wuu3SNmygyFe4E2ctiGd3/RkTfw==");

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 24, 10, 44, 14, 993, DateTimeKind.Utc).AddTicks(2470), new DateTime(2025, 9, 24, 10, 44, 14, 993, DateTimeKind.Utc).AddTicks(2470) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 24, 10, 44, 14, 993, DateTimeKind.Utc).AddTicks(2480), new DateTime(2025, 9, 24, 10, 44, 14, 993, DateTimeKind.Utc).AddTicks(2480) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 24, 10, 44, 14, 993, DateTimeKind.Utc).AddTicks(2490), new DateTime(2025, 9, 24, 10, 44, 14, 993, DateTimeKind.Utc).AddTicks(2490) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsExtraTopping",
                table: "Products",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: new Guid("ba8008d3-6f25-4ca3-be62-21c2af0e4f97"),
                column: "PasswordHash",
                value: "AQAAAAIAAYagAAAAELHtSp+6sHzB0ExJfmuSQvkkyo+PEpBMGfOUwi2UMXhtBGo0tEui8sEQiFVaQF1CDw==");

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 24, 10, 32, 32, 901, DateTimeKind.Utc).AddTicks(4740), new DateTime(2025, 9, 24, 10, 32, 32, 901, DateTimeKind.Utc).AddTicks(4740) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 24, 10, 32, 32, 901, DateTimeKind.Utc).AddTicks(4750), new DateTime(2025, 9, 24, 10, 32, 32, 901, DateTimeKind.Utc).AddTicks(4750) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 24, 10, 32, 32, 901, DateTimeKind.Utc).AddTicks(4750), new DateTime(2025, 9, 24, 10, 32, 32, 901, DateTimeKind.Utc).AddTicks(4750) });
        }
    }
}
