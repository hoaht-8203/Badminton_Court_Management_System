using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class UpdateReceiptBankAccountRelation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SupplierBankAccountName",
                table: "Receipts");

            migrationBuilder.DropColumn(
                name: "SupplierBankAccountNumber",
                table: "Receipts");

            migrationBuilder.DropColumn(
                name: "SupplierBankName",
                table: "Receipts");

            migrationBuilder.AddColumn<int>(
                name: "SupplierBankAccountId",
                table: "Receipts",
                type: "integer",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 25, 17, 12, 50, 808, DateTimeKind.Utc).AddTicks(1660), new DateTime(2025, 10, 25, 17, 12, 50, 808, DateTimeKind.Utc).AddTicks(1660) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 25, 17, 12, 50, 808, DateTimeKind.Utc).AddTicks(1660), new DateTime(2025, 10, 25, 17, 12, 50, 808, DateTimeKind.Utc).AddTicks(1660) });

            migrationBuilder.CreateIndex(
                name: "IX_Receipts_SupplierBankAccountId",
                table: "Receipts",
                column: "SupplierBankAccountId");

            migrationBuilder.AddForeignKey(
                name: "FK_Receipts_SupplierBankAccounts_SupplierBankAccountId",
                table: "Receipts",
                column: "SupplierBankAccountId",
                principalTable: "SupplierBankAccounts",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Receipts_SupplierBankAccounts_SupplierBankAccountId",
                table: "Receipts");

            migrationBuilder.DropIndex(
                name: "IX_Receipts_SupplierBankAccountId",
                table: "Receipts");

            migrationBuilder.DropColumn(
                name: "SupplierBankAccountId",
                table: "Receipts");

            migrationBuilder.AddColumn<string>(
                name: "SupplierBankAccountName",
                table: "Receipts",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SupplierBankAccountNumber",
                table: "Receipts",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SupplierBankName",
                table: "Receipts",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 25, 17, 10, 18, 557, DateTimeKind.Utc).AddTicks(9570), new DateTime(2025, 10, 25, 17, 10, 18, 557, DateTimeKind.Utc).AddTicks(9570) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 25, 17, 10, 18, 557, DateTimeKind.Utc).AddTicks(9570), new DateTime(2025, 10, 25, 17, 10, 18, 557, DateTimeKind.Utc).AddTicks(9570) });
        }
    }
}
