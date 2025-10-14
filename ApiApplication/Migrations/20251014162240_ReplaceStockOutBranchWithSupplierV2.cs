using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class ReplaceStockOutBranchWithSupplierV2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Delete existing StockOuts data to avoid foreign key constraint issues
            migrationBuilder.Sql("DELETE FROM \"StockOutItems\"");
            migrationBuilder.Sql("DELETE FROM \"StockOuts\"");

            migrationBuilder.DropColumn(
                name: "Branch",
                table: "StockOuts");

            migrationBuilder.AddColumn<int>(
                name: "SupplierId",
                table: "StockOuts",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_StockOuts_SupplierId",
                table: "StockOuts",
                column: "SupplierId");

            migrationBuilder.AddForeignKey(
                name: "FK_StockOuts_Suppliers_SupplierId",
                table: "StockOuts",
                column: "SupplierId",
                principalTable: "Suppliers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StockOuts_Suppliers_SupplierId",
                table: "StockOuts");

            migrationBuilder.DropIndex(
                name: "IX_StockOuts_SupplierId",
                table: "StockOuts");

            migrationBuilder.DropColumn(
                name: "SupplierId",
                table: "StockOuts");

            migrationBuilder.AddColumn<string>(
                name: "Branch",
                table: "StockOuts",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);
        }
    }
}
