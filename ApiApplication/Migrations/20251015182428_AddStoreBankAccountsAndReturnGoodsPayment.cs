using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class AddStoreBankAccountsAndReturnGoodsPayment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PaymentMethod",
                table: "ReturnGoods",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "StoreBankAccountId",
                table: "ReturnGoods",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "StoreBankAccounts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    BankName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    AccountNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    AccountName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    IsDefault = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StoreBankAccounts", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ReturnGoods_StoreBankAccountId",
                table: "ReturnGoods",
                column: "StoreBankAccountId");

            migrationBuilder.AddForeignKey(
                name: "FK_ReturnGoods_StoreBankAccounts_StoreBankAccountId",
                table: "ReturnGoods",
                column: "StoreBankAccountId",
                principalTable: "StoreBankAccounts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ReturnGoods_StoreBankAccounts_StoreBankAccountId",
                table: "ReturnGoods");

            migrationBuilder.DropTable(
                name: "StoreBankAccounts");

            migrationBuilder.DropIndex(
                name: "IX_ReturnGoods_StoreBankAccountId",
                table: "ReturnGoods");

            migrationBuilder.DropColumn(
                name: "PaymentMethod",
                table: "ReturnGoods");

            migrationBuilder.DropColumn(
                name: "StoreBankAccountId",
                table: "ReturnGoods");
        }
    }
}
