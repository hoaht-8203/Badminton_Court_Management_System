using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class FixAttendance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AttendanceRecords_Shifts_ShiftId",
                table: "AttendanceRecords");

            migrationBuilder.DropIndex(
                name: "IX_AttendanceRecords_ShiftId",
                table: "AttendanceRecords");

            migrationBuilder.DropColumn(
                name: "ShiftId",
                table: "AttendanceRecords");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "AttendanceRecords");

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 14, 15, 49, 48, 389, DateTimeKind.Utc).AddTicks(1146), new DateTime(2025, 10, 14, 15, 49, 48, 389, DateTimeKind.Utc).AddTicks(1147) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 14, 15, 49, 48, 389, DateTimeKind.Utc).AddTicks(1148), new DateTime(2025, 10, 14, 15, 49, 48, 389, DateTimeKind.Utc).AddTicks(1149) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ShiftId",
                table: "AttendanceRecords",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "AttendanceRecords",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 12, 15, 7, 49, 436, DateTimeKind.Utc).AddTicks(8445), new DateTime(2025, 10, 12, 15, 7, 49, 436, DateTimeKind.Utc).AddTicks(8445) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 12, 15, 7, 49, 436, DateTimeKind.Utc).AddTicks(8447), new DateTime(2025, 10, 12, 15, 7, 49, 436, DateTimeKind.Utc).AddTicks(8447) });

            migrationBuilder.CreateIndex(
                name: "IX_AttendanceRecords_ShiftId",
                table: "AttendanceRecords",
                column: "ShiftId");

            migrationBuilder.AddForeignKey(
                name: "FK_AttendanceRecords_Shifts_ShiftId",
                table: "AttendanceRecords",
                column: "ShiftId",
                principalTable: "Shifts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
