using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class AddRoleSystemForBCMS : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: new Guid("66dddd1c-bf05-4032-b8a5-6adbf73dc09e"),
                columns: new[] { "Name", "NormalizedName" },
                values: new object[] { "Customer", "CUSTOMER" });

            migrationBuilder.InsertData(
                table: "AspNetRoles",
                columns: new[] { "Id", "ConcurrencyStamp", "Name", "NormalizedName" },
                values: new object[,]
                {
                    { new Guid("2a1c4e8f-9b3d-4f6e-a7c2-8d5e1f3b9a4c"), null, "BranchAdministrator", "BRANCHADMINISTRATOR" },
                    { new Guid("3b2d5f9a-1c4e-5a7f-b8d3-9e6f2a4c1b5d"), null, "Staff", "STAFF" },
                    { new Guid("4c3e6a1b-2d5f-6b8a-c9e4-1f7a3b5d2c6e"), null, "WarehouseStaff", "WAREHOUSESTAFF" },
                    { new Guid("5d4f7b2c-3e6a-7c9b-d1f5-2a8b4c6e3d7f"), null, "Receptionist", "RECEPTIONIST" }
                });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 12, 7, 16, 9, 45, 632, DateTimeKind.Utc).AddTicks(5475), new DateTime(2025, 12, 7, 16, 9, 45, 632, DateTimeKind.Utc).AddTicks(5476) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 12, 7, 16, 9, 45, 632, DateTimeKind.Utc).AddTicks(5477), new DateTime(2025, 12, 7, 16, 9, 45, 632, DateTimeKind.Utc).AddTicks(5478) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: new Guid("2a1c4e8f-9b3d-4f6e-a7c2-8d5e1f3b9a4c"));

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: new Guid("3b2d5f9a-1c4e-5a7f-b8d3-9e6f2a4c1b5d"));

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: new Guid("4c3e6a1b-2d5f-6b8a-c9e4-1f7a3b5d2c6e"));

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: new Guid("5d4f7b2c-3e6a-7c9b-d1f5-2a8b4c6e3d7f"));

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: new Guid("66dddd1c-bf05-4032-b8a5-6adbf73dc09e"),
                columns: new[] { "Name", "NormalizedName" },
                values: new object[] { "User", "USER" });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 12, 6, 6, 57, 2, 755, DateTimeKind.Utc).AddTicks(8447), new DateTime(2025, 12, 6, 6, 57, 2, 755, DateTimeKind.Utc).AddTicks(8447) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 12, 6, 6, 57, 2, 755, DateTimeKind.Utc).AddTicks(8449), new DateTime(2025, 12, 6, 6, 57, 2, 755, DateTimeKind.Utc).AddTicks(8449) });
        }
    }
}
