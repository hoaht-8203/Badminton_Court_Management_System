using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class BookingOrderItem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BookingOrderItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BookingId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductId = table.Column<int>(type: "integer", nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    UnitPrice = table.Column<decimal>(type: "numeric", nullable: false),
                    TotalPrice = table.Column<decimal>(type: "numeric", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BookingOrderItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BookingOrderItems_BookingCourts_BookingId",
                        column: x => x.BookingId,
                        principalTable: "BookingCourts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BookingOrderItems_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 16, 9, 27, 40, 208, DateTimeKind.Utc).AddTicks(1970), new DateTime(2025, 10, 16, 9, 27, 40, 208, DateTimeKind.Utc).AddTicks(1970) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 16, 9, 27, 40, 208, DateTimeKind.Utc).AddTicks(1980), new DateTime(2025, 10, 16, 9, 27, 40, 208, DateTimeKind.Utc).AddTicks(1980) });

            migrationBuilder.CreateIndex(
                name: "IX_BookingOrderItems_BookingId",
                table: "BookingOrderItems",
                column: "BookingId");

            migrationBuilder.CreateIndex(
                name: "IX_BookingOrderItems_ProductId",
                table: "BookingOrderItems",
                column: "ProductId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BookingOrderItems");

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 14, 15, 49, 48, 389, DateTimeKind.Utc).AddTicks(1146), new DateTime(2025, 10, 14, 15, 49, 48, 389, DateTimeKind.Utc).AddTicks(1147) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 14, 15, 49, 48, 389, DateTimeKind.Utc).AddTicks(1148), new DateTime(2025, 10, 14, 15, 49, 48, 389, DateTimeKind.Utc).AddTicks(1149) });
        }
    }
}
