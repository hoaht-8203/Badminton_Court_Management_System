using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class AddPriceTableProducts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PriceTableProducts",
                columns: table => new
                {
                    PriceTableId = table.Column<int>(type: "integer", nullable: false),
                    ProductId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PriceTableProducts", x => new { x.PriceTableId, x.ProductId });
                    table.ForeignKey(
                        name: "FK_PriceTableProducts_PriceTables_PriceTableId",
                        column: x => x.PriceTableId,
                        principalTable: "PriceTables",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PriceTableProducts_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: new Guid("ba8008d3-6f25-4ca3-be62-21c2af0e4f97"),
                column: "PasswordHash",
                value: "AQAAAAIAAYagAAAAELV8Ok2qvkRv4NoxCROj0gmy5p/RCcFIrVUpwKCZ5VP90MBRO/mX2/yenzq8hhp8UA==");

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 24, 17, 14, 20, 697, DateTimeKind.Utc).AddTicks(8590), new DateTime(2025, 9, 24, 17, 14, 20, 697, DateTimeKind.Utc).AddTicks(8590) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 24, 17, 14, 20, 697, DateTimeKind.Utc).AddTicks(8600), new DateTime(2025, 9, 24, 17, 14, 20, 697, DateTimeKind.Utc).AddTicks(8600) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 24, 17, 14, 20, 697, DateTimeKind.Utc).AddTicks(8600), new DateTime(2025, 9, 24, 17, 14, 20, 697, DateTimeKind.Utc).AddTicks(8600) });

            migrationBuilder.CreateIndex(
                name: "IX_PriceTableProducts_ProductId",
                table: "PriceTableProducts",
                column: "ProductId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PriceTableProducts");

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: new Guid("ba8008d3-6f25-4ca3-be62-21c2af0e4f97"),
                column: "PasswordHash",
                value: "AQAAAAIAAYagAAAAEDiok+g7kGQgiOZdI1ziD9Rxjcq4WyiMSo3o3SyBe3qdvzHMVfdgkFIOnOQyhXkqOA==");

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 24, 17, 3, 36, 268, DateTimeKind.Utc).AddTicks(7050), new DateTime(2025, 9, 24, 17, 3, 36, 268, DateTimeKind.Utc).AddTicks(7050) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 24, 17, 3, 36, 268, DateTimeKind.Utc).AddTicks(7050), new DateTime(2025, 9, 24, 17, 3, 36, 268, DateTimeKind.Utc).AddTicks(7050) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 24, 17, 3, 36, 268, DateTimeKind.Utc).AddTicks(7050), new DateTime(2025, 9, 24, 17, 3, 36, 268, DateTimeKind.Utc).AddTicks(7050) });
        }
    }
}
