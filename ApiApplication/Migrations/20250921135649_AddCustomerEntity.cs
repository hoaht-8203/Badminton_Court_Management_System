using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomerEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Customers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    FullName = table.Column<string>(type: "text", nullable: false),
                    PhoneNumber = table.Column<string>(type: "text", nullable: false),
                    Email = table.Column<string>(type: "text", nullable: false),
                    DateOfBirth = table.Column<DateOnly>(type: "date", nullable: true),
                    Gender = table.Column<string>(type: "text", nullable: true),
                    Address = table.Column<string>(type: "text", nullable: true),
                    City = table.Column<string>(type: "text", nullable: true),
                    District = table.Column<string>(type: "text", nullable: true),
                    Ward = table.Column<string>(type: "text", nullable: true),
                    IDCard = table.Column<string>(type: "text", nullable: true),
                    Note = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Customers", x => x.Id);
                });

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: new Guid("ba8008d3-6f25-4ca3-be62-21c2af0e4f97"),
                column: "PasswordHash",
                value: "AQAAAAIAAYagAAAAEJ2hKwD3iZGNEw9I4ne7T84vX9G0xgOl9GBqq3gyI1tdvN+0zo5PMNt8JcWMjPpfYg==");

            migrationBuilder.InsertData(
                table: "Customers",
                columns: new[] { "Id", "Address", "City", "CreatedAt", "CreatedBy", "DateOfBirth", "District", "Email", "FullName", "Gender", "IDCard", "Note", "PhoneNumber", "Status", "UpdatedAt", "UpdatedBy", "Ward" },
                values: new object[,]
                {
                    { 1, "123 Đường ABC, Phường Dịch Vọng", "Hà Nội", new DateTime(2025, 9, 21, 13, 56, 48, 844, DateTimeKind.Utc).AddTicks(6504), "System", null, "Cầu Giấy", "nguyenvanan@gmail.com", "Nguyễn Văn An", "Nam", "123456789", "Khách hàng VIP - Thường xuyên đặt sân", "0123456789", "Active", new DateTime(2025, 9, 21, 13, 56, 48, 844, DateTimeKind.Utc).AddTicks(6512), null, "Dịch Vọng" },
                    { 2, "456 Đường XYZ, Phường Bến Nghé", "TP. Hồ Chí Minh", new DateTime(2025, 9, 21, 13, 56, 48, 844, DateTimeKind.Utc).AddTicks(6549), "System", null, "Quận 1", "tranthibinh@gmail.com", "Trần Thị Bình", "Nữ", "987654321", "Khách hàng thường xuyên - Đặt sân cuối tuần", "0987654321", "Active", new DateTime(2025, 9, 21, 13, 56, 48, 844, DateTimeKind.Utc).AddTicks(6549), null, "Phường Bến Nghé" },
                    { 3, "789 Đường DEF, Phường Láng Thượng", "Hà Nội", new DateTime(2025, 9, 21, 13, 56, 48, 844, DateTimeKind.Utc).AddTicks(6556), "System", null, "Đống Đa", "levancuong@gmail.com", "Lê Văn Cường", "Nam", "456789123", "Khách hàng mới - Quan tâm đến sân cầu lông", "0369852147", "Active", new DateTime(2025, 9, 21, 13, 56, 48, 844, DateTimeKind.Utc).AddTicks(6557), null, "Láng Thượng" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Customers");

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: new Guid("ba8008d3-6f25-4ca3-be62-21c2af0e4f97"),
                column: "PasswordHash",
                value: "AQAAAAIAAYagAAAAEG/uVq/GvtJ6ERoYGOQrK6e7vFn3X6IFP+Kh5AWuTkYhOMII3Uc7hhDHbD4HJA5X3g==");
        }
    }
}
