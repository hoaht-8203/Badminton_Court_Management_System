using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class UpdateModel15091116 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "AspNetUsers",
                columns: new[] { "Id", "AccessFailedCount", "Address", "City", "ConcurrencyStamp", "DateOfBirth", "District", "Email", "EmailConfirmed", "FullName", "LockoutEnabled", "LockoutEnd", "NormalizedEmail", "NormalizedUserName", "Note", "PasswordHash", "PhoneNumber", "PhoneNumberConfirmed", "SecurityStamp", "Status", "TwoFactorEnabled", "UserName", "Ward" },
                values: new object[] { new Guid("ba8008d3-6f25-4ca3-be62-21c2af0e4f97"), 0, null, null, "d296d8e5-f257-49e7-936f-734491ebda7a", null, null, "admin@email.com", true, "Admin", false, null, "ADMIN@EMAIL.COM", "ADMIN", null, "AQAAAAIAAYagAAAAEI5Nm/LVng+0RrCxxc83Wqm/3Y1kIdoIcGxOQefsr2zW0XUitWkTWm4EnGgacqKX+w==", null, false, "a5fd6b0c-f96d-4c6b-b70c-95e8f4ff4423", "Active", false, "admin", null });

            migrationBuilder.InsertData(
                table: "AspNetUserRoles",
                columns: new[] { "RoleId", "UserId" },
                values: new object[] { new Guid("5d8d3cc8-4fde-4c21-a70b-deaf8ebe51a2"), new Guid("ba8008d3-6f25-4ca3-be62-21c2af0e4f97") });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "AspNetUserRoles",
                keyColumns: new[] { "RoleId", "UserId" },
                keyValues: new object[] { new Guid("5d8d3cc8-4fde-4c21-a70b-deaf8ebe51a2"), new Guid("ba8008d3-6f25-4ca3-be62-21c2af0e4f97") });

            migrationBuilder.DeleteData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: new Guid("ba8008d3-6f25-4ca3-be62-21c2af0e4f97"));
        }
    }
}
