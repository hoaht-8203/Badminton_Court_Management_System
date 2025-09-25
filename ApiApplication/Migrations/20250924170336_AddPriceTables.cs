using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class AddPriceTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PriceTables",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    EffectiveFrom = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    EffectiveTo = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Months = table.Column<int[]>(type: "integer[]", nullable: true),
                    DaysOfMonth = table.Column<int[]>(type: "integer[]", nullable: true),
                    Weekdays = table.Column<int[]>(type: "integer[]", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PriceTables", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PriceTimeRanges",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PriceTableId = table.Column<int>(type: "integer", nullable: false),
                    StartTime = table.Column<TimeSpan>(type: "interval", nullable: false),
                    EndTime = table.Column<TimeSpan>(type: "interval", nullable: false),
                    Price = table.Column<decimal>(type: "numeric(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PriceTimeRanges", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PriceTimeRanges_PriceTables_PriceTableId",
                        column: x => x.PriceTableId,
                        principalTable: "PriceTables",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

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

            migrationBuilder.CreateIndex(
                name: "IX_PriceTimeRanges_PriceTableId",
                table: "PriceTimeRanges",
                column: "PriceTableId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PriceTimeRanges");

            migrationBuilder.DropTable(
                name: "PriceTables");

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: new Guid("ba8008d3-6f25-4ca3-be62-21c2af0e4f97"),
                column: "PasswordHash",
                value: "AQAAAAIAAYagAAAAEFYnhaKbImUsdoa/B7awovP4V62+ngJXv8cGyC6Wuu3SNmygyFe4E2ctiGd3/RkTfw==");

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 24, 10, 44, 14, 993, DateTimeKind.Utc).AddTicks(2470), new DateTime(2025, 9, 24, 10, 44, 14, 993, DateTimeKind.Utc).AddTicks(2470) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 24, 10, 44, 14, 993, DateTimeKind.Utc).AddTicks(2480), new DateTime(2025, 9, 24, 10, 44, 14, 993, DateTimeKind.Utc).AddTicks(2480) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 24, 10, 44, 14, 993, DateTimeKind.Utc).AddTicks(2490), new DateTime(2025, 9, 24, 10, 44, 14, 993, DateTimeKind.Utc).AddTicks(2490) });
        }
    }
}
