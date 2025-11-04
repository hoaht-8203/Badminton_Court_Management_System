using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class MembershipBenefitsIntAndDescriptions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Memberships",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Price = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    DurationDays = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Benefits = table.Column<Dictionary<string, int>>(type: "jsonb", nullable: false),
                    BenefitsDescription = table.Column<string[]>(type: "text[]", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Memberships", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserMemberships",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CustomerId = table.Column<int>(type: "integer", nullable: false),
                    MembershipId = table.Column<int>(type: "integer", nullable: false),
                    StartDate = table.Column<DateOnly>(type: "date", nullable: false),
                    EndDate = table.Column<DateOnly>(type: "date", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserMemberships", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserMemberships_Customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserMemberships_Memberships_MembershipId",
                        column: x => x.MembershipId,
                        principalTable: "Memberships",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "Memberships",
                columns: new[] { "Id", "Benefits", "BenefitsDescription", "CreatedAt", "CreatedBy", "Description", "DurationDays", "Name", "Price", "Status", "UpdatedAt", "UpdatedBy" },
                values: new object[,]
                {
                    { 1, new Dictionary<string, int> { ["discount_court"] = 5, ["discount_service"] = 10, ["discount_product"] = 15 }, new[] { "Ưu đãi 5% khi đặt sân", "Ưu đãi 10% khi sử dụng dịch vụ", "Ưu đãi 15% khi mua sản phẩm" }, new DateTime(2025, 11, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Gói Silver: ưu đãi cơ bản khi đặt sân", 30, "Silver", 199000m, "Active", new DateTime(2025, 11, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System" },
                    { 2, new Dictionary<string, int> { ["discount_court"] = 10, ["discount_service"] = 20, ["discount_product"] = 25 }, new[] { "Ưu đãi 10% khi đặt sân", "Ưu đãi 20% khi sử dụng dịch vụ", "Ưu đãi 25% khi mua sản phẩm" }, new DateTime(2025, 11, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Gói Gold: ưu đãi tốt hơn, thời hạn 60 ngày", 60, "Gold", 399000m, "Active", new DateTime(2025, 11, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System" },
                    { 3, new Dictionary<string, int> { ["discount_court"] = 15, ["discount_product"] = 25 }, new[] { "Ưu đãi 15% khi đặt sân", "Miễn phí sử dụng dịch vụ", "Miễn phí nước giải khát", "Ưu đãi 25% khi mua sản phẩm" }, new DateTime(2025, 11, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", "Gói Platinum: ưu đãi cao nhất, 90 ngày", 90, "Platinum", 699000m, "Active", new DateTime(2025, 11, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System" }
                });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 3, 11, 22, 22, 640, DateTimeKind.Utc).AddTicks(7160), new DateTime(2025, 11, 3, 11, 22, 22, 640, DateTimeKind.Utc).AddTicks(7160) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 3, 11, 22, 22, 640, DateTimeKind.Utc).AddTicks(7170), new DateTime(2025, 11, 3, 11, 22, 22, 640, DateTimeKind.Utc).AddTicks(7170) });

            migrationBuilder.CreateIndex(
                name: "IX_UserMemberships_CustomerId_MembershipId_StartDate",
                table: "UserMemberships",
                columns: new[] { "CustomerId", "MembershipId", "StartDate" });

            migrationBuilder.CreateIndex(
                name: "IX_UserMemberships_MembershipId",
                table: "UserMemberships",
                column: "MembershipId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserMemberships");

            migrationBuilder.DropTable(
                name: "Memberships");

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 27, 4, 43, 48, 429, DateTimeKind.Utc).AddTicks(9410), new DateTime(2025, 10, 27, 4, 43, 48, 429, DateTimeKind.Utc).AddTicks(9410) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 27, 4, 43, 48, 429, DateTimeKind.Utc).AddTicks(9410), new DateTime(2025, 10, 27, 4, 43, 48, 429, DateTimeKind.Utc).AddTicks(9410) });
        }
    }
}
