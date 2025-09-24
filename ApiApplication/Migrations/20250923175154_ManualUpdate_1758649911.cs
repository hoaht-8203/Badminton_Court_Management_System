using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class ManualUpdate_1758649911 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: new Guid("ba8008d3-6f25-4ca3-be62-21c2af0e4f97"),
                column: "PasswordHash",
                value: "AQAAAAIAAYagAAAAEPsGBwqCEJ+3vaczBlaG16xDJlDLVCTJNwa/jqxJdSJrA9+BU0Ys476q90DjRTk87Q==");

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 23, 16, 21, 8, 350, DateTimeKind.Utc).AddTicks(8100), new DateTime(2025, 9, 23, 16, 21, 8, 350, DateTimeKind.Utc).AddTicks(8100) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 23, 16, 21, 8, 350, DateTimeKind.Utc).AddTicks(8110), new DateTime(2025, 9, 23, 16, 21, 8, 350, DateTimeKind.Utc).AddTicks(8110) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 23, 16, 21, 8, 350, DateTimeKind.Utc).AddTicks(8110), new DateTime(2025, 9, 23, 16, 21, 8, 350, DateTimeKind.Utc).AddTicks(8110) });
        }
    }
}
