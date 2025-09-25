using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class ReAddTimeRanges_NoPrice : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PriceTimeRanges",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PriceTableId = table.Column<int>(type: "integer", nullable: false),
                    StartTime = table.Column<TimeSpan>(type: "interval", nullable: false),
                    EndTime = table.Column<TimeSpan>(type: "interval", nullable: false)
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
                value: "AQAAAAIAAYagAAAAEACngENqnIDwl0+xlbC0gDEtS+1CHGvwxtHW73Xcr4WEZFxuTsU+3UCY2IXOMQZW3w==");

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 24, 18, 35, 56, 968, DateTimeKind.Utc).AddTicks(2950), new DateTime(2025, 9, 24, 18, 35, 56, 968, DateTimeKind.Utc).AddTicks(2950) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 24, 18, 35, 56, 968, DateTimeKind.Utc).AddTicks(2950), new DateTime(2025, 9, 24, 18, 35, 56, 968, DateTimeKind.Utc).AddTicks(2950) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 24, 18, 35, 56, 968, DateTimeKind.Utc).AddTicks(2960), new DateTime(2025, 9, 24, 18, 35, 56, 968, DateTimeKind.Utc).AddTicks(2960) });

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
    }
}
