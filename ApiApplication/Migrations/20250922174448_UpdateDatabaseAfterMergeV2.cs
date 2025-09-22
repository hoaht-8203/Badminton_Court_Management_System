using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class UpdateDatabaseAfterMergeV2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Suppliers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Phone = table.Column<string>(type: "text", nullable: false),
                    Email = table.Column<string>(type: "text", nullable: false),
                    Address = table.Column<string>(type: "text", nullable: true),
                    City = table.Column<string>(type: "text", nullable: true),
                    District = table.Column<string>(type: "text", nullable: true),
                    Ward = table.Column<string>(type: "text", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Suppliers", x => x.Id);
                });

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: new Guid("ba8008d3-6f25-4ca3-be62-21c2af0e4f97"),
                column: "PasswordHash",
                value: "AQAAAAIAAYagAAAAEBIeq+ShnwaQRc6Dtq33pRbkH0q38lb9OpjtwbNpIOVhN9hgZZfdtTzTVR012IORPg==");

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 22, 17, 44, 48, 185, DateTimeKind.Utc).AddTicks(5590), new DateTime(2025, 9, 22, 17, 44, 48, 185, DateTimeKind.Utc).AddTicks(5590) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 22, 17, 44, 48, 185, DateTimeKind.Utc).AddTicks(5590), new DateTime(2025, 9, 22, 17, 44, 48, 185, DateTimeKind.Utc).AddTicks(5590) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 22, 17, 44, 48, 185, DateTimeKind.Utc).AddTicks(5600), new DateTime(2025, 9, 22, 17, 44, 48, 185, DateTimeKind.Utc).AddTicks(5600) });

            migrationBuilder.InsertData(
                table: "Suppliers",
                columns: new[] { "Id", "Address", "City", "CreatedAt", "CreatedBy", "District", "Email", "Name", "Notes", "Phone", "Status", "UpdatedAt", "UpdatedBy", "Ward" },
                values: new object[,]
                {
                    { 1, "Số 10 Nguyễn Trãi, Thanh Xuân, Hà Nội", "", new DateTime(2025, 9, 16, 9, 34, 1, 800, DateTimeKind.Utc).AddTicks(7670), null, "", "anphat@sports.com", "Công ty TNHH Thiết Bị Thể Thao An Phát", "Nhà cung cấp chính thức vợt cầu lông và bóng đá", "0901234567", "Active", null, null, "" },
                    { 2, "Số 25 Lê Lợi, Quận 1, TP. Hồ Chí Minh", "", new DateTime(2025, 9, 16, 9, 34, 1, 800, DateTimeKind.Utc).AddTicks(7670), null, "", "contact@vietnamsports.vn", "Công ty CP Dụng Cụ Thể Thao Việt Nam", "Cung cấp bóng chuyền và thiết bị tập gym", "0987654321", "Active", null, null, "" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Suppliers");

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: new Guid("ba8008d3-6f25-4ca3-be62-21c2af0e4f97"),
                column: "PasswordHash",
                value: "AQAAAAIAAYagAAAAEI/agnBylLDrsrBgZBAngefYhxKAunGbCsnloDBWWNgzCOaYA/7cOucaX/A2NF1T9A==");

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 22, 16, 47, 26, 287, DateTimeKind.Utc).AddTicks(8750), new DateTime(2025, 9, 22, 16, 47, 26, 287, DateTimeKind.Utc).AddTicks(8750) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 22, 16, 47, 26, 287, DateTimeKind.Utc).AddTicks(8760), new DateTime(2025, 9, 22, 16, 47, 26, 287, DateTimeKind.Utc).AddTicks(8760) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 22, 16, 47, 26, 287, DateTimeKind.Utc).AddTicks(8760), new DateTime(2025, 9, 22, 16, 47, 26, 287, DateTimeKind.Utc).AddTicks(8760) });
        }
    }
}
