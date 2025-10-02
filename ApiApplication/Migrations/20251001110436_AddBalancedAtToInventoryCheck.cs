using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class AddBalancedAtToInventoryCheck : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: new Guid("ba8008d3-6f25-4ca3-be62-21c2af0e4f97"),
                column: "PasswordHash",
                value: "AQAAAAIAAYagAAAAEFqGX2kp4KdZKDMjapLakqUamDNwC0vTXnvlme/+yss14bhAg0PbRCxpq4LkX3TzyQ==");

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 16, 9, 34, 1, 800, DateTimeKind.Utc).AddTicks(7670), new DateTime(2025, 9, 16, 9, 34, 1, 800, DateTimeKind.Utc).AddTicks(7670) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 16, 9, 34, 1, 800, DateTimeKind.Utc).AddTicks(7670), new DateTime(2025, 9, 16, 9, 34, 1, 800, DateTimeKind.Utc).AddTicks(7670) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 16, 9, 34, 1, 800, DateTimeKind.Utc).AddTicks(7670), new DateTime(2025, 9, 16, 9, 34, 1, 800, DateTimeKind.Utc).AddTicks(7670) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: new Guid("ba8008d3-6f25-4ca3-be62-21c2af0e4f97"),
                column: "PasswordHash",
                value: "AQAAAAIAAYagAAAAEBFsuIcOHYCfoGLT6etbHNXmHCVF2kAb8GvooqHdvXzHqtKnxIHw41Yr/QATxTwomw==");

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 30, 13, 42, 52, 56, DateTimeKind.Utc).AddTicks(9480), new DateTime(2025, 9, 30, 13, 42, 52, 56, DateTimeKind.Utc).AddTicks(9480) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 30, 13, 42, 52, 56, DateTimeKind.Utc).AddTicks(9490), new DateTime(2025, 9, 30, 13, 42, 52, 56, DateTimeKind.Utc).AddTicks(9490) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 30, 13, 42, 52, 56, DateTimeKind.Utc).AddTicks(9490), new DateTime(2025, 9, 30, 13, 42, 52, 56, DateTimeKind.Utc).AddTicks(9490) });
        }
    }
}
