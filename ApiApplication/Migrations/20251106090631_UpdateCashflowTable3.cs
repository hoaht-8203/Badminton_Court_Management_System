using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class UpdateCashflowTable3 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Cashflows_RelatedPeople_RelatedPersonId",
                table: "Cashflows");

            migrationBuilder.DropIndex(
                name: "IX_Cashflows_RelatedPersonId",
                table: "Cashflows");

            migrationBuilder.DropColumn(
                name: "RelatedPersonId",
                table: "Cashflows");

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 6, 9, 6, 31, 184, DateTimeKind.Utc).AddTicks(978), new DateTime(2025, 11, 6, 9, 6, 31, 184, DateTimeKind.Utc).AddTicks(979) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 6, 9, 6, 31, 184, DateTimeKind.Utc).AddTicks(981), new DateTime(2025, 11, 6, 9, 6, 31, 184, DateTimeKind.Utc).AddTicks(981) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "RelatedPersonId",
                table: "Cashflows",
                type: "integer",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 6, 8, 56, 8, 458, DateTimeKind.Utc).AddTicks(7582), new DateTime(2025, 11, 6, 8, 56, 8, 458, DateTimeKind.Utc).AddTicks(7583) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 6, 8, 56, 8, 458, DateTimeKind.Utc).AddTicks(7584), new DateTime(2025, 11, 6, 8, 56, 8, 458, DateTimeKind.Utc).AddTicks(7585) });

            migrationBuilder.CreateIndex(
                name: "IX_Cashflows_RelatedPersonId",
                table: "Cashflows",
                column: "RelatedPersonId");

            migrationBuilder.AddForeignKey(
                name: "FK_Cashflows_RelatedPeople_RelatedPersonId",
                table: "Cashflows",
                column: "RelatedPersonId",
                principalTable: "RelatedPeople",
                principalColumn: "Id");
        }
    }
}
