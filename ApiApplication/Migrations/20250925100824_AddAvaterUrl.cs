using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class AddAvaterUrl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AvatarUrl",
                table: "AspNetUsers",
                type: "text",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: new Guid("ba8008d3-6f25-4ca3-be62-21c2af0e4f97"),
                columns: new[] { "AvatarUrl", "PasswordHash" },
                values: new object[] { null, "AQAAAAIAAYagAAAAEFUhkOvHNIyZdMPw1fnMfk0VboXjCLxi7l+LWxR0K0O+4y5yHG1d8SiDlBcKRDcEYw==" });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 25, 10, 8, 23, 738, DateTimeKind.Utc).AddTicks(8536), new DateTime(2025, 9, 25, 10, 8, 23, 738, DateTimeKind.Utc).AddTicks(8539) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 25, 10, 8, 23, 738, DateTimeKind.Utc).AddTicks(8550), new DateTime(2025, 9, 25, 10, 8, 23, 738, DateTimeKind.Utc).AddTicks(8551) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 25, 10, 8, 23, 738, DateTimeKind.Utc).AddTicks(8555), new DateTime(2025, 9, 25, 10, 8, 23, 738, DateTimeKind.Utc).AddTicks(8556) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AvatarUrl",
                table: "AspNetUsers");

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
    }
}
