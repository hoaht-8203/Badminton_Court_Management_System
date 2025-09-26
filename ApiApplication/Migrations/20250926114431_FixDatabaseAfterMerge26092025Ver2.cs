using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class FixDatabaseAfterMerge26092025Ver2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: new Guid("ba8008d3-6f25-4ca3-be62-21c2af0e4f97"),
                column: "PasswordHash",
                value: "AQAAAAIAAYagAAAAEK/A8DYDhZFyHP2Ldn/uDLPE2bXeti56+2SnKt/n1emkZJj6G12AUg90roOde9xH7w==");

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 26, 8, 30, 18, 664, DateTimeKind.Utc).AddTicks(300), new DateTime(2025, 9, 26, 8, 30, 18, 664, DateTimeKind.Utc).AddTicks(300) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 26, 8, 30, 18, 664, DateTimeKind.Utc).AddTicks(310), new DateTime(2025, 9, 26, 8, 30, 18, 664, DateTimeKind.Utc).AddTicks(310) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 26, 8, 30, 18, 664, DateTimeKind.Utc).AddTicks(310), new DateTime(2025, 9, 26, 8, 30, 18, 664, DateTimeKind.Utc).AddTicks(310) });
        }
    }
}
