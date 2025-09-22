using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class AddSupplierUpdate1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Address",
                table: "Suppliers",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<string>(
                name: "City",
                table: "Suppliers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "District",
                table: "Suppliers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Ward",
                table: "Suppliers",
                type: "text",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: new Guid("ba8008d3-6f25-4ca3-be62-21c2af0e4f97"),
                column: "PasswordHash",
                value: "AQAAAAIAAYagAAAAEPyb5hKWs7mmhfJEzsLRwOIjqMvl5rsACzKdKBuhvcKzbCAhgAdAQOAgswIro3bavg==");

            migrationBuilder.UpdateData(
                table: "Suppliers",
                keyColumn: "SupplierId",
                keyValue: 1,
                columns: new[] { "City", "CreatedAt", "District", "UpdatedAt", "Ward" },
                values: new object[] { "", new DateTime(2025, 9, 22, 14, 35, 15, 621, DateTimeKind.Utc).AddTicks(8918), "", new DateTime(2025, 9, 22, 14, 35, 15, 621, DateTimeKind.Utc).AddTicks(8921), "" });

            migrationBuilder.UpdateData(
                table: "Suppliers",
                keyColumn: "SupplierId",
                keyValue: 2,
                columns: new[] { "City", "CreatedAt", "District", "UpdatedAt", "Ward" },
                values: new object[] { "", new DateTime(2025, 9, 22, 14, 35, 15, 621, DateTimeKind.Utc).AddTicks(8936), "", new DateTime(2025, 9, 22, 14, 35, 15, 621, DateTimeKind.Utc).AddTicks(8938), "" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "City",
                table: "Suppliers");

            migrationBuilder.DropColumn(
                name: "District",
                table: "Suppliers");

            migrationBuilder.DropColumn(
                name: "Ward",
                table: "Suppliers");

            migrationBuilder.AlterColumn<string>(
                name: "Address",
                table: "Suppliers",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: new Guid("ba8008d3-6f25-4ca3-be62-21c2af0e4f97"),
                column: "PasswordHash",
                value: "AQAAAAIAAYagAAAAED5gud4IS3jOPtYSZ6Fwq7G7eeDgTUlyS3r6Bu4RUW3XBhZuCCVU3JyCUVZqGpfbQw==");

            migrationBuilder.UpdateData(
                table: "Suppliers",
                keyColumn: "SupplierId",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 22, 13, 39, 9, 912, DateTimeKind.Utc).AddTicks(9967), new DateTime(2025, 9, 22, 13, 39, 9, 912, DateTimeKind.Utc).AddTicks(9970) });

            migrationBuilder.UpdateData(
                table: "Suppliers",
                keyColumn: "SupplierId",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 22, 13, 39, 9, 912, DateTimeKind.Utc).AddTicks(9983), new DateTime(2025, 9, 22, 13, 39, 9, 912, DateTimeKind.Utc).AddTicks(9984) });
        }
    }
}
