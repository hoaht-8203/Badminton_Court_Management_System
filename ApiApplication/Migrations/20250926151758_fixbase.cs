using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class fixbase : Migration
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
                values: new object[] { null, "AQAAAAIAAYagAAAAEPe03q/HkHdadu1LfusfkS9J2m1iIgFq2aWIM+5hXxK5X74ox6bK7U4lGGpHga6e8Q==" });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 26, 15, 17, 56, 829, DateTimeKind.Utc).AddTicks(285), new DateTime(2025, 9, 26, 15, 17, 56, 829, DateTimeKind.Utc).AddTicks(287) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 26, 15, 17, 56, 829, DateTimeKind.Utc).AddTicks(291), new DateTime(2025, 9, 26, 15, 17, 56, 829, DateTimeKind.Utc).AddTicks(292) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 26, 15, 17, 56, 829, DateTimeKind.Utc).AddTicks(294), new DateTime(2025, 9, 26, 15, 17, 56, 829, DateTimeKind.Utc).AddTicks(294) });
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
