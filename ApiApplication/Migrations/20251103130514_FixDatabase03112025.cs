using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class FixDatabase03112025 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Payments_BookingCourts_BookingId",
                table: "Payments");

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "UserMemberships",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<Guid>(
                name: "BookingId",
                table: "Payments",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<int>(
                name: "UserMembershipId",
                table: "Payments",
                type: "integer",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 3, 13, 5, 14, 37, DateTimeKind.Utc).AddTicks(3900), new DateTime(2025, 11, 3, 13, 5, 14, 37, DateTimeKind.Utc).AddTicks(3900) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 3, 13, 5, 14, 37, DateTimeKind.Utc).AddTicks(3900), new DateTime(2025, 11, 3, 13, 5, 14, 37, DateTimeKind.Utc).AddTicks(3900) });

            migrationBuilder.CreateIndex(
                name: "IX_Payments_UserMembershipId",
                table: "Payments",
                column: "UserMembershipId");

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_BookingCourts_BookingId",
                table: "Payments",
                column: "BookingId",
                principalTable: "BookingCourts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_UserMemberships_UserMembershipId",
                table: "Payments",
                column: "UserMembershipId",
                principalTable: "UserMemberships",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Payments_BookingCourts_BookingId",
                table: "Payments");

            migrationBuilder.DropForeignKey(
                name: "FK_Payments_UserMemberships_UserMembershipId",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_Payments_UserMembershipId",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "UserMemberships");

            migrationBuilder.DropColumn(
                name: "UserMembershipId",
                table: "Payments");

            migrationBuilder.AlterColumn<Guid>(
                name: "BookingId",
                table: "Payments",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 3, 12, 43, 47, 447, DateTimeKind.Utc).AddTicks(1420), new DateTime(2025, 11, 3, 12, 43, 47, 447, DateTimeKind.Utc).AddTicks(1420) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 3, 12, 43, 47, 447, DateTimeKind.Utc).AddTicks(1420), new DateTime(2025, 11, 3, 12, 43, 47, 447, DateTimeKind.Utc).AddTicks(1420) });

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_BookingCourts_BookingId",
                table: "Payments",
                column: "BookingId",
                principalTable: "BookingCourts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
