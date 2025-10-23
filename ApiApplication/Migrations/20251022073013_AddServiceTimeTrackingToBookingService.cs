using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class AddServiceTimeTrackingToBookingService : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ServiceEndTime",
                table: "BookingServices",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ServiceStartTime",
                table: "BookingServices",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 22, 7, 30, 13, 155, DateTimeKind.Utc).AddTicks(7010), new DateTime(2025, 10, 22, 7, 30, 13, 155, DateTimeKind.Utc).AddTicks(7010) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 22, 7, 30, 13, 155, DateTimeKind.Utc).AddTicks(7010), new DateTime(2025, 10, 22, 7, 30, 13, 155, DateTimeKind.Utc).AddTicks(7010) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ServiceEndTime",
                table: "BookingServices");

            migrationBuilder.DropColumn(
                name: "ServiceStartTime",
                table: "BookingServices");

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 20, 6, 20, 29, 965, DateTimeKind.Utc).AddTicks(3490), new DateTime(2025, 10, 20, 6, 20, 29, 965, DateTimeKind.Utc).AddTicks(3490) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 20, 6, 20, 29, 965, DateTimeKind.Utc).AddTicks(3490), new DateTime(2025, 10, 20, 6, 20, 29, 965, DateTimeKind.Utc).AddTicks(3490) });
        }
    }
}
