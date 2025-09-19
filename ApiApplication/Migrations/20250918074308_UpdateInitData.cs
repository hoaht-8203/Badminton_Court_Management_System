using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class UpdateInitData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: new Guid("ba8008d3-6f25-4ca3-be62-21c2af0e4f97"),
                column: "PasswordHash",
                value: "AQAAAAIAAYagAAAAEG/uVq/GvtJ6ERoYGOQrK6e7vFn3X6IFP+Kh5AWuTkYhOMII3Uc7hhDHbD4HJA5X3g==");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: new Guid("ba8008d3-6f25-4ca3-be62-21c2af0e4f97"),
                column: "PasswordHash",
                value: "AQAAAAIAAYagAAAAEGfOIs9gIMlk0fRfSYAvG4XIy+HZ3RYl0Lzzvkk6iOmm4Jq1mpY7Aj73iqusb1oZQg==");
        }
    }
}
