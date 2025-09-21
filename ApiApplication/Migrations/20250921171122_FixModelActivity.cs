using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class FixModelActivity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Activities_OrderType",
                table: "Activities");

            migrationBuilder.DropColumn(
                name: "OrderType",
                table: "Activities");

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: new Guid("ba8008d3-6f25-4ca3-be62-21c2af0e4f97"),
                column: "PasswordHash",
                value: "AQAAAAIAAYagAAAAEGqi7OTii9G/NeNn4o08sFKhqIZaUDYRtntCFcoTMf1eag2a0/Kw3kDFNalMnXS9Rw==");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "OrderType",
                table: "Activities",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: new Guid("ba8008d3-6f25-4ca3-be62-21c2af0e4f97"),
                column: "PasswordHash",
                value: "AQAAAAIAAYagAAAAEEf43z2Rk9UKMYlU1SidOSq3281DwdRof74s2z1g/HSA/xBH1vVnqsVRCUopshKazg==");

            migrationBuilder.CreateIndex(
                name: "IX_Activities_OrderType",
                table: "Activities",
                column: "OrderType");
        }
    }
}
