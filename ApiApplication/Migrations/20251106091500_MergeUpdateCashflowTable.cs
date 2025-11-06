using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class MergeUpdateCashflowTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Ensure RelatedId is text and not nullable with default empty string
            migrationBuilder.AlterColumn<string>(
                name: "RelatedId",
                table: "Cashflows",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            // Drop RelatedPersonId FK/index/column if present (previous schema variations)
            try
            {
                migrationBuilder.DropForeignKey(
                    name: "FK_Cashflows_RelatedPeople_RelatedPersonId",
                    table: "Cashflows");
            }
            catch { }

            try
            {
                migrationBuilder.DropIndex(
                    name: "IX_Cashflows_RelatedPersonId",
                    table: "Cashflows");
            }
            catch { }

            try
            {
                migrationBuilder.DropColumn(
                    name: "RelatedPersonId",
                    table: "Cashflows");
            }
            catch { }

            // Update seed timestamps to reflect this migration
            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 6, 9, 15, 0, DateTimeKind.Utc), new DateTime(2025, 11, 6, 9, 15, 0, DateTimeKind.Utc) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 6, 9, 15, 0, DateTimeKind.Utc), new DateTime(2025, 11, 6, 9, 15, 0, DateTimeKind.Utc) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Revert seed timestamps to an earlier value
            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 6, 8, 50, 44, DateTimeKind.Utc), new DateTime(2025, 11, 6, 8, 50, 44, DateTimeKind.Utc) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 6, 8, 50, 44, DateTimeKind.Utc), new DateTime(2025, 11, 6, 8, 50, 44, DateTimeKind.Utc) });

            // Add RelatedPersonId column back as nullable integer, recreate index and FK
            migrationBuilder.AddColumn<int>(
                name: "RelatedPersonId",
                table: "Cashflows",
                type: "integer",
                nullable: true);

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

            // Change RelatedId back to integer nullable
            migrationBuilder.AlterColumn<int>(
                name: "RelatedId",
                table: "Cashflows",
                type: "integer",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");
        }
    }
}
