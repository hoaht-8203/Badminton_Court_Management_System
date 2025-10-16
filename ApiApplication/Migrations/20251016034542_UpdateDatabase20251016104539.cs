using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class UpdateDatabase20251016104539 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "StoreBankAccounts");

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "StoreBankAccounts",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "StoreBankAccounts",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "StoreBankAccounts");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "StoreBankAccounts");

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "StoreBankAccounts",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }
    }
}
