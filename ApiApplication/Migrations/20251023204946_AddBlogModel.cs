using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class AddBlogModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 23, 20, 49, 45, 736, DateTimeKind.Utc).AddTicks(7390), new DateTime(2025, 10, 23, 20, 49, 45, 736, DateTimeKind.Utc).AddTicks(7390) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 23, 20, 49, 45, 736, DateTimeKind.Utc).AddTicks(7390), new DateTime(2025, 10, 23, 20, 49, 45, 736, DateTimeKind.Utc).AddTicks(7390) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 23, 16, 25, 17, 688, DateTimeKind.Utc).AddTicks(5500), new DateTime(2025, 10, 23, 16, 25, 17, 688, DateTimeKind.Utc).AddTicks(5510) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 23, 16, 25, 17, 688, DateTimeKind.Utc).AddTicks(5510), new DateTime(2025, 10, 23, 16, 25, 17, 688, DateTimeKind.Utc).AddTicks(5510) });
        }
    }
}
