using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class FixDatabaseForCourtModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PriceUnits");

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: new Guid("ba8008d3-6f25-4ca3-be62-21c2af0e4f97"),
                column: "PasswordHash",
                value: "AQAAAAIAAYagAAAAEOe7lXobBSYwpUXOwvFXM8eMl3fWcMS4C2u4+P2aD3mBUijtevBA6sQUknz7yUbHeA==");

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 24, 9, 29, 9, 967, DateTimeKind.Utc).AddTicks(8500), new DateTime(2025, 9, 24, 9, 29, 9, 967, DateTimeKind.Utc).AddTicks(8500) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 24, 9, 29, 9, 967, DateTimeKind.Utc).AddTicks(8500), new DateTime(2025, 9, 24, 9, 29, 9, 967, DateTimeKind.Utc).AddTicks(8500) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 24, 9, 29, 9, 967, DateTimeKind.Utc).AddTicks(8500), new DateTime(2025, 9, 24, 9, 29, 9, 967, DateTimeKind.Utc).AddTicks(8500) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PriceUnits",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    Name = table.Column<string>(type: "text", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PriceUnits", x => x.Id);
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
        }
    }
}
