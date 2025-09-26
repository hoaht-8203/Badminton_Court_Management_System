using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class NewDatabase : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: new Guid("ba8008d3-6f25-4ca3-be62-21c2af0e4f97"),
                column: "PasswordHash",
                value: "AQAAAAIAAYagAAAAEBq+6ILSkRI27eRk3LEX6d+nQSjrTIhNLMCP5KsHmJVslBDe2Stlz3ZwQ2WrgpiEHA==");

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 25, 9, 43, 1, 566, DateTimeKind.Utc).AddTicks(3301), new DateTime(2025, 9, 25, 9, 43, 1, 566, DateTimeKind.Utc).AddTicks(3305) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 25, 9, 43, 1, 566, DateTimeKind.Utc).AddTicks(3321), new DateTime(2025, 9, 25, 9, 43, 1, 566, DateTimeKind.Utc).AddTicks(3322) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 25, 9, 43, 1, 566, DateTimeKind.Utc).AddTicks(3329), new DateTime(2025, 9, 25, 9, 43, 1, 566, DateTimeKind.Utc).AddTicks(3330) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: new Guid("ba8008d3-6f25-4ca3-be62-21c2af0e4f97"),
                column: "PasswordHash",
                value: "AQAAAAIAAYagAAAAEITkGgo0SyS55lhahLi+nD8d0hgDx1ZyFmbfI1CXEsW73FLY4pZr3TMPl08oa0wJAA==");

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 23, 11, 37, 9, 117, DateTimeKind.Utc).AddTicks(9731), new DateTime(2025, 9, 23, 11, 37, 9, 117, DateTimeKind.Utc).AddTicks(9733) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 23, 11, 37, 9, 117, DateTimeKind.Utc).AddTicks(9740), new DateTime(2025, 9, 23, 11, 37, 9, 117, DateTimeKind.Utc).AddTicks(9741) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 23, 11, 37, 9, 117, DateTimeKind.Utc).AddTicks(9744), new DateTime(2025, 9, 23, 11, 37, 9, 117, DateTimeKind.Utc).AddTicks(9744) });
        }
    }
}
