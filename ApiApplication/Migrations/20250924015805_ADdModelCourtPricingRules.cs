using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class ADdModelCourtPricingRules : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Courts_PriceUnits_PriceUnitId",
                table: "Courts");

            migrationBuilder.DropIndex(
                name: "IX_Courts_PriceUnitId",
                table: "Courts");

            migrationBuilder.DropColumn(
                name: "Price",
                table: "Courts");

            migrationBuilder.DropColumn(
                name: "PriceUnitId",
                table: "Courts");

            migrationBuilder.CreateTable(
                name: "CourtPricingRules",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CourtId = table.Column<Guid>(type: "uuid", nullable: false),
                    DaysOfWeek = table.Column<int[]>(type: "integer[]", nullable: false),
                    StartTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PricePerHour = table.Column<decimal>(type: "numeric", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CourtPricingRules", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CourtPricingRules_Courts_CourtId",
                        column: x => x.CourtId,
                        principalTable: "Courts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: new Guid("ba8008d3-6f25-4ca3-be62-21c2af0e4f97"),
                column: "PasswordHash",
                value: "AQAAAAIAAYagAAAAEEHOie3XxCOWpZip80WYWG8yIGFEN6nkye73XDbSntEfyUlN0o7TIWyMoE1a8Anlyg==");

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 24, 1, 58, 3, 820, DateTimeKind.Utc).AddTicks(8660), new DateTime(2025, 9, 24, 1, 58, 3, 820, DateTimeKind.Utc).AddTicks(8662) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 24, 1, 58, 3, 820, DateTimeKind.Utc).AddTicks(8669), new DateTime(2025, 9, 24, 1, 58, 3, 820, DateTimeKind.Utc).AddTicks(8669) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 24, 1, 58, 3, 820, DateTimeKind.Utc).AddTicks(8671), new DateTime(2025, 9, 24, 1, 58, 3, 820, DateTimeKind.Utc).AddTicks(8672) });

            migrationBuilder.CreateIndex(
                name: "IX_CourtPricingRules_CourtId",
                table: "CourtPricingRules",
                column: "CourtId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CourtPricingRules");

            migrationBuilder.AddColumn<decimal>(
                name: "Price",
                table: "Courts",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "PriceUnitId",
                table: "Courts",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: new Guid("ba8008d3-6f25-4ca3-be62-21c2af0e4f97"),
                column: "PasswordHash",
                value: "AQAAAAIAAYagAAAAEITkGgo0SyS55lhahLi+nD8d0hgDx1ZyFmbfI1CXEsW73FLY4pZr3TMPl08oa0wJAA==");

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 23, 11, 37, 9, 117, DateTimeKind.Utc).AddTicks(9731), new DateTime(2025, 9, 23, 11, 37, 9, 117, DateTimeKind.Utc).AddTicks(9733) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 23, 11, 37, 9, 117, DateTimeKind.Utc).AddTicks(9740), new DateTime(2025, 9, 23, 11, 37, 9, 117, DateTimeKind.Utc).AddTicks(9741) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 23, 11, 37, 9, 117, DateTimeKind.Utc).AddTicks(9744), new DateTime(2025, 9, 23, 11, 37, 9, 117, DateTimeKind.Utc).AddTicks(9744) });

            migrationBuilder.CreateIndex(
                name: "IX_Courts_PriceUnitId",
                table: "Courts",
                column: "PriceUnitId");

            migrationBuilder.AddForeignKey(
                name: "FK_Courts_PriceUnits_PriceUnitId",
                table: "Courts",
                column: "PriceUnitId",
                principalTable: "PriceUnits",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
