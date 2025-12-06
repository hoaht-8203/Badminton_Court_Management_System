using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class UpdateVoucherUserRule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UserType",
                table: "VoucherUserRules");

            migrationBuilder.AddColumn<int>(
                name: "MembershipId",
                table: "VoucherUserRules",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<List<int>>(
                name: "SpecificCustomerIds",
                table: "VoucherUserRules",
                type: "integer[]",
                nullable: true);

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

            migrationBuilder.CreateIndex(
                name: "IX_VoucherUserRules_MembershipId",
                table: "VoucherUserRules",
                column: "MembershipId");

            migrationBuilder.AddForeignKey(
                name: "FK_VoucherUserRules_Memberships_MembershipId",
                table: "VoucherUserRules",
                column: "MembershipId",
                principalTable: "Memberships",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_VoucherUserRules_Memberships_MembershipId",
                table: "VoucherUserRules");

            migrationBuilder.DropIndex(
                name: "IX_VoucherUserRules_MembershipId",
                table: "VoucherUserRules");

            migrationBuilder.DropColumn(
                name: "MembershipId",
                table: "VoucherUserRules");

            migrationBuilder.DropColumn(
                name: "SpecificCustomerIds",
                table: "VoucherUserRules");

            migrationBuilder.AddColumn<string>(
                name: "UserType",
                table: "VoucherUserRules",
                type: "text",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 12, 1, 13, 26, 12, 732, DateTimeKind.Utc).AddTicks(7053), new DateTime(2025, 12, 1, 13, 26, 12, 732, DateTimeKind.Utc).AddTicks(7053) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 12, 1, 13, 26, 12, 732, DateTimeKind.Utc).AddTicks(7055), new DateTime(2025, 12, 1, 13, 26, 12, 732, DateTimeKind.Utc).AddTicks(7055) });
        }
    }
}
