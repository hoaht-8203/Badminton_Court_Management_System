using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderPaymentMethodAndOccurrenceId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "BookingCourtOccurrenceId",
                table: "Orders",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentMethod",
                table: "Orders",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 23, 4, 32, 52, 160, DateTimeKind.Utc).AddTicks(7830), new DateTime(2025, 10, 23, 4, 32, 52, 160, DateTimeKind.Utc).AddTicks(7830) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 23, 4, 32, 52, 160, DateTimeKind.Utc).AddTicks(7830), new DateTime(2025, 10, 23, 4, 32, 52, 160, DateTimeKind.Utc).AddTicks(7830) });

            migrationBuilder.CreateIndex(
                name: "IX_Orders_BookingCourtOccurrenceId",
                table: "Orders",
                column: "BookingCourtOccurrenceId");

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_BookingCourtOccurrences_BookingCourtOccurrenceId",
                table: "Orders",
                column: "BookingCourtOccurrenceId",
                principalTable: "BookingCourtOccurrences",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Orders_BookingCourtOccurrences_BookingCourtOccurrenceId",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Orders_BookingCourtOccurrenceId",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "BookingCourtOccurrenceId",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "PaymentMethod",
                table: "Orders");

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 22, 10, 21, 18, 280, DateTimeKind.Utc).AddTicks(380), new DateTime(2025, 10, 22, 10, 21, 18, 280, DateTimeKind.Utc).AddTicks(380) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 22, 10, 21, 18, 280, DateTimeKind.Utc).AddTicks(380), new DateTime(2025, 10, 22, 10, 21, 18, 280, DateTimeKind.Utc).AddTicks(380) });
        }
    }
}
