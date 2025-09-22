using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class AddSupplierUpdate22 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Company",
                table: "Suppliers");

            migrationBuilder.DropColumn(
                name: "CurrentDebt",
                table: "Suppliers");

            migrationBuilder.DropColumn(
                name: "SupplierGroup",
                table: "Suppliers");

            migrationBuilder.DropColumn(
                name: "TotalPurchase",
                table: "Suppliers");

            migrationBuilder.DropColumn(
                name: "TotalPurchaseAfterReturn",
                table: "Suppliers");

            migrationBuilder.RenameColumn(
                name: "SupplierName",
                table: "Suppliers",
                newName: "Name");

            migrationBuilder.RenameColumn(
                name: "SupplierId",
                table: "Suppliers",
                newName: "Id");

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: new Guid("ba8008d3-6f25-4ca3-be62-21c2af0e4f97"),
                column: "PasswordHash",
                value: "AQAAAAIAAYagAAAAEAGpM0imOIHTOTa/YnBRpIth+l9ckAnmjf2znrPJOUQ50AxSXsuRKpc4AKcrCbHCAQ==");

            migrationBuilder.UpdateData(
                table: "Suppliers",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "CreatedBy", "UpdatedAt", "UpdatedBy" },
                values: new object[] { new DateTime(2025, 9, 16, 9, 34, 1, 800, DateTimeKind.Utc).AddTicks(7670), null, null, null });

            migrationBuilder.UpdateData(
                table: "Suppliers",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "CreatedBy", "UpdatedAt", "UpdatedBy" },
                values: new object[] { new DateTime(2025, 9, 16, 9, 34, 1, 800, DateTimeKind.Utc).AddTicks(7670), null, null, null });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Name",
                table: "Suppliers",
                newName: "SupplierName");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "Suppliers",
                newName: "SupplierId");

            migrationBuilder.AddColumn<string>(
                name: "Company",
                table: "Suppliers",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "CurrentDebt",
                table: "Suppliers",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "SupplierGroup",
                table: "Suppliers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "TotalPurchase",
                table: "Suppliers",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "TotalPurchaseAfterReturn",
                table: "Suppliers",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

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
                columns: new[] { "Company", "CreatedAt", "CreatedBy", "CurrentDebt", "SupplierGroup", "TotalPurchase", "TotalPurchaseAfterReturn", "UpdatedAt", "UpdatedBy" },
                values: new object[] { "An Phát Sports", new DateTime(2025, 9, 22, 14, 35, 15, 621, DateTimeKind.Utc).AddTicks(8918), "System", 1500000m, "Thiết bị thể thao", 50000000m, 48000000m, new DateTime(2025, 9, 22, 14, 35, 15, 621, DateTimeKind.Utc).AddTicks(8921), "System" });

            migrationBuilder.UpdateData(
                table: "Suppliers",
                keyColumn: "SupplierId",
                keyValue: 2,
                columns: new[] { "Company", "CreatedAt", "CreatedBy", "CurrentDebt", "SupplierGroup", "TotalPurchase", "TotalPurchaseAfterReturn", "UpdatedAt", "UpdatedBy" },
                values: new object[] { "Vietnam Sports JSC", new DateTime(2025, 9, 22, 14, 35, 15, 621, DateTimeKind.Utc).AddTicks(8936), "System", 0m, "Dụng cụ thể thao", 30000000m, 30000000m, new DateTime(2025, 9, 22, 14, 35, 15, 621, DateTimeKind.Utc).AddTicks(8938), "System" });
        }
    }
}
