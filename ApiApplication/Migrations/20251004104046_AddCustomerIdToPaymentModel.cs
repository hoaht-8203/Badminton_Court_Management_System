using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomerIdToPaymentModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // First, add the column as nullable
            migrationBuilder.AddColumn<int>(
                name: "CustomerId",
                table: "Payments",
                type: "integer",
                nullable: true);

            // Update existing records to have a valid CustomerId
            // If no customers exist, we'll need to handle this case
            migrationBuilder.Sql(@"
                UPDATE ""Payments"" 
                SET ""CustomerId"" = (
                    SELECT COALESCE(
                        (SELECT ""Id"" FROM ""Customers"" ORDER BY ""Id"" LIMIT 1),
                        1
                    )
                )
                WHERE ""CustomerId"" IS NULL;
            ");

            // Make the column non-nullable
            migrationBuilder.AlterColumn<int>(
                name: "CustomerId",
                table: "Payments",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Payments_CustomerId",
                table: "Payments",
                column: "CustomerId");

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_Customers_CustomerId",
                table: "Payments",
                column: "CustomerId",
                principalTable: "Customers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Payments_Customers_CustomerId",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_Payments_CustomerId",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "CustomerId",
                table: "Payments");
        }
    }
}
