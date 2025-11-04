using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class FixDatabase03112025V3 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Payments_BookingCourts_BookingId",
                table: "Payments");

            migrationBuilder.DropForeignKey(
                name: "FK_Payments_UserMemberships_UserMembershipId",
                table: "Payments");

            migrationBuilder.DropForeignKey(
                name: "FK_Payments_UserMemberships_UserMembershipId1",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_Payments_UserMembershipId1",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "UserMembershipId1",
                table: "Payments");

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 3, 14, 11, 57, 924, DateTimeKind.Utc).AddTicks(9330), new DateTime(2025, 11, 3, 14, 11, 57, 924, DateTimeKind.Utc).AddTicks(9340) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 3, 14, 11, 57, 924, DateTimeKind.Utc).AddTicks(9340), new DateTime(2025, 11, 3, 14, 11, 57, 924, DateTimeKind.Utc).AddTicks(9340) });

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_BookingCourts_BookingId",
                table: "Payments",
                column: "BookingId",
                principalTable: "BookingCourts",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_UserMemberships_UserMembershipId",
                table: "Payments",
                column: "UserMembershipId",
                principalTable: "UserMemberships",
                principalColumn: "Id");
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

            migrationBuilder.AddColumn<int>(
                name: "UserMembershipId1",
                table: "Payments",
                type: "integer",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 3, 14, 10, 55, 207, DateTimeKind.Utc).AddTicks(5970), new DateTime(2025, 11, 3, 14, 10, 55, 207, DateTimeKind.Utc).AddTicks(5970) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 3, 14, 10, 55, 207, DateTimeKind.Utc).AddTicks(5980), new DateTime(2025, 11, 3, 14, 10, 55, 207, DateTimeKind.Utc).AddTicks(5980) });

            migrationBuilder.CreateIndex(
                name: "IX_Payments_UserMembershipId1",
                table: "Payments",
                column: "UserMembershipId1");

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

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_UserMemberships_UserMembershipId1",
                table: "Payments",
                column: "UserMembershipId1",
                principalTable: "UserMemberships",
                principalColumn: "Id");
        }
    }
}
