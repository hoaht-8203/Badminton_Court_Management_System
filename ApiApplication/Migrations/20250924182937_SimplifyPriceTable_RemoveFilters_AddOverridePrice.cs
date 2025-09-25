using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class SimplifyPriceTable_RemoveFilters_AddOverridePrice : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PriceTimeRanges");

            migrationBuilder.DropColumn(
                name: "DaysOfMonth",
                table: "PriceTables");

            migrationBuilder.DropColumn(
                name: "Months",
                table: "PriceTables");

            migrationBuilder.DropColumn(
                name: "Weekdays",
                table: "PriceTables");

            migrationBuilder.AddColumn<decimal>(
                name: "OverrideSalePrice",
                table: "PriceTableProducts",
                type: "numeric(18,2)",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: new Guid("ba8008d3-6f25-4ca3-be62-21c2af0e4f97"),
                column: "PasswordHash",
                value: "AQAAAAIAAYagAAAAEAXX3YMIf0YPC1mdmZ1nlCphSS3ulEEU8bQ4xTz6j7TJkPfKokwWXjRIgoZby1iUAQ==");

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 24, 18, 29, 36, 961, DateTimeKind.Utc).AddTicks(3700), new DateTime(2025, 9, 24, 18, 29, 36, 961, DateTimeKind.Utc).AddTicks(3700) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 24, 18, 29, 36, 961, DateTimeKind.Utc).AddTicks(3700), new DateTime(2025, 9, 24, 18, 29, 36, 961, DateTimeKind.Utc).AddTicks(3700) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 24, 18, 29, 36, 961, DateTimeKind.Utc).AddTicks(3710), new DateTime(2025, 9, 24, 18, 29, 36, 961, DateTimeKind.Utc).AddTicks(3710) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OverrideSalePrice",
                table: "PriceTableProducts");

            migrationBuilder.AddColumn<int[]>(
                name: "DaysOfMonth",
                table: "PriceTables",
                type: "integer[]",
                nullable: true);

            migrationBuilder.AddColumn<int[]>(
                name: "Months",
                table: "PriceTables",
                type: "integer[]",
                nullable: true);

            migrationBuilder.AddColumn<int[]>(
                name: "Weekdays",
                table: "PriceTables",
                type: "integer[]",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "PriceTimeRanges",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PriceTableId = table.Column<int>(type: "integer", nullable: false),
                    EndTime = table.Column<TimeSpan>(type: "interval", nullable: false),
                    Price = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    StartTime = table.Column<TimeSpan>(type: "interval", nullable: false)
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
                name: "IX_PriceTimeRanges_PriceTableId",
                table: "PriceTimeRanges",
                column: "PriceTableId");
        }
    }
}
