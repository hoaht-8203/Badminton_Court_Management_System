using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class FixDatabaseAfterMerge26092025Ver : Migration
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
                values: new object[] { null, "AQAAAAIAAYagAAAAELIGXPThp//GOkg54mqOBzOcOpp0qLH5GC0TT6OUHiDC+nUZNesAEXc4BRk4Shs0KQ==" });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 26, 15, 35, 42, 946, DateTimeKind.Utc).AddTicks(2550), new DateTime(2025, 9, 26, 15, 35, 42, 946, DateTimeKind.Utc).AddTicks(2550) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 26, 15, 35, 42, 946, DateTimeKind.Utc).AddTicks(2550), new DateTime(2025, 9, 26, 15, 35, 42, 946, DateTimeKind.Utc).AddTicks(2560) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 26, 15, 35, 42, 946, DateTimeKind.Utc).AddTicks(2560), new DateTime(2025, 9, 26, 15, 35, 42, 946, DateTimeKind.Utc).AddTicks(2560) });
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
                value: "AQAAAAIAAYagAAAAEF/WWUNVCI9Ogb2n7zCczp6wC0s0dyU1P+Q0v+bL3B6mTaEzcZEm8Arn5btaos8b7w==");

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 26, 11, 44, 31, 251, DateTimeKind.Utc).AddTicks(2600), new DateTime(2025, 9, 26, 11, 44, 31, 251, DateTimeKind.Utc).AddTicks(2600) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 26, 11, 44, 31, 251, DateTimeKind.Utc).AddTicks(2610), new DateTime(2025, 9, 26, 11, 44, 31, 251, DateTimeKind.Utc).AddTicks(2610) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 26, 11, 44, 31, 251, DateTimeKind.Utc).AddTicks(2610), new DateTime(2025, 9, 26, 11, 44, 31, 251, DateTimeKind.Utc).AddTicks(2610) });
        }
    }
}
