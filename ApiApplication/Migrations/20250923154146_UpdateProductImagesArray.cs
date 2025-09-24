using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class UpdateProductImagesArray : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: new Guid("ba8008d3-6f25-4ca3-be62-21c2af0e4f97"),
                column: "PasswordHash",
                value: "AQAAAAIAAYagAAAAEK7vDIn60BHp6+hL9E5+ormdN951Ug+jKZpqFFAIcUc33gW5GSO6O5XYOIPSBaBUNg==");

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 23, 15, 41, 46, 766, DateTimeKind.Utc).AddTicks(1720), new DateTime(2025, 9, 23, 15, 41, 46, 766, DateTimeKind.Utc).AddTicks(1720) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 23, 15, 41, 46, 766, DateTimeKind.Utc).AddTicks(1730), new DateTime(2025, 9, 23, 15, 41, 46, 766, DateTimeKind.Utc).AddTicks(1730) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 23, 15, 41, 46, 766, DateTimeKind.Utc).AddTicks(1740), new DateTime(2025, 9, 23, 15, 41, 46, 766, DateTimeKind.Utc).AddTicks(1740) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: new Guid("ba8008d3-6f25-4ca3-be62-21c2af0e4f97"),
                column: "PasswordHash",
                value: "AQAAAAIAAYagAAAAEIrR/xQdu+CdHszVLfbrkQXXsvnLdnFTQQQAhHu4+lLzCw/3voSStqltY6SUcE5ARQ==");

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 23, 11, 46, 41, 681, DateTimeKind.Utc).AddTicks(7970), new DateTime(2025, 9, 23, 11, 46, 41, 681, DateTimeKind.Utc).AddTicks(7970) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 23, 11, 46, 41, 681, DateTimeKind.Utc).AddTicks(7980), new DateTime(2025, 9, 23, 11, 46, 41, 681, DateTimeKind.Utc).AddTicks(7980) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 23, 11, 46, 41, 681, DateTimeKind.Utc).AddTicks(7980), new DateTime(2025, 9, 23, 11, 46, 41, 681, DateTimeKind.Utc).AddTicks(7980) });
        }
    }
}
