using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class AddProductIsActive : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Products");

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: new Guid("ba8008d3-6f25-4ca3-be62-21c2af0e4f97"),
                column: "PasswordHash",
                value: "AQAAAAIAAYagAAAAEM9JfwF4jZMZOsED65BjdxWtBMp28J3//cwUmXWCKyDnaRF/T8XlfRLOnsMRbPHt7w==");

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 23, 17, 51, 54, 361, DateTimeKind.Utc).AddTicks(2660), new DateTime(2025, 9, 23, 17, 51, 54, 361, DateTimeKind.Utc).AddTicks(2660) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 23, 17, 51, 54, 361, DateTimeKind.Utc).AddTicks(2670), new DateTime(2025, 9, 23, 17, 51, 54, 361, DateTimeKind.Utc).AddTicks(2670) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 23, 17, 51, 54, 361, DateTimeKind.Utc).AddTicks(2670), new DateTime(2025, 9, 23, 17, 51, 54, 361, DateTimeKind.Utc).AddTicks(2670) });
        }
    }
}
