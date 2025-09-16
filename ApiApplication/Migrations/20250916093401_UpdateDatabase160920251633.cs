using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class UpdateDatabase160920251633 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "AspNetUsers",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "AspNetUsers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "AspNetUsers",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "AspNetUsers",
                type: "text",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: new Guid("ba8008d3-6f25-4ca3-be62-21c2af0e4f97"),
                columns: new[] { "CreatedAt", "CreatedBy", "PasswordHash", "UpdatedAt", "UpdatedBy" },
                values: new object[] { new DateTime(2025, 9, 16, 9, 34, 1, 800, DateTimeKind.Utc).AddTicks(7670), null, "AQAAAAIAAYagAAAAEGfOIs9gIMlk0fRfSYAvG4XIy+HZ3RYl0Lzzvkk6iOmm4Jq1mpY7Aj73iqusb1oZQg==", null, null });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "AspNetUsers");

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: new Guid("ba8008d3-6f25-4ca3-be62-21c2af0e4f97"),
                column: "PasswordHash",
                value: "AQAAAAIAAYagAAAAEI5Nm/LVng+0RrCxxc83Wqm/3Y1kIdoIcGxOQefsr2zW0XUitWkTWm4EnGgacqKX+w==");
        }
    }
}
