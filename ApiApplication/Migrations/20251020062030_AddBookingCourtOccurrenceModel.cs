using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class AddBookingCourtOccurrenceModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BookingOrderItems_BookingCourts_BookingId",
                table: "BookingOrderItems");

            migrationBuilder.DropForeignKey(
                name: "FK_BookingServices_BookingCourts_BookingId",
                table: "BookingServices");

            migrationBuilder.RenameColumn(
                name: "BookingId",
                table: "BookingServices",
                newName: "BookingCourtOccurrenceId");

            migrationBuilder.RenameIndex(
                name: "IX_BookingServices_BookingId",
                table: "BookingServices",
                newName: "IX_BookingServices_BookingCourtOccurrenceId");

            migrationBuilder.RenameColumn(
                name: "BookingId",
                table: "BookingOrderItems",
                newName: "BookingCourtOccurrenceId");

            migrationBuilder.RenameIndex(
                name: "IX_BookingOrderItems_BookingId",
                table: "BookingOrderItems",
                newName: "IX_BookingOrderItems_BookingCourtOccurrenceId");

            migrationBuilder.AddColumn<Guid>(
                name: "BookingCourtOccurrenceId",
                table: "Payments",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "BookingCourtOccurrences",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BookingCourtId = table.Column<Guid>(type: "uuid", nullable: false),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    StartTime = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    EndTime = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Note = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BookingCourtOccurrences", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BookingCourtOccurrences_BookingCourts_BookingCourtId",
                        column: x => x.BookingCourtId,
                        principalTable: "BookingCourts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 20, 6, 20, 29, 965, DateTimeKind.Utc).AddTicks(3490), new DateTime(2025, 10, 20, 6, 20, 29, 965, DateTimeKind.Utc).AddTicks(3490) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 20, 6, 20, 29, 965, DateTimeKind.Utc).AddTicks(3490), new DateTime(2025, 10, 20, 6, 20, 29, 965, DateTimeKind.Utc).AddTicks(3490) });

            migrationBuilder.CreateIndex(
                name: "IX_Payments_BookingCourtOccurrenceId",
                table: "Payments",
                column: "BookingCourtOccurrenceId");

            migrationBuilder.CreateIndex(
                name: "IX_BookingCourtOccurrences_BookingCourtId",
                table: "BookingCourtOccurrences",
                column: "BookingCourtId");

            migrationBuilder.AddForeignKey(
                name: "FK_BookingOrderItems_BookingCourtOccurrences_BookingCourtOccur~",
                table: "BookingOrderItems",
                column: "BookingCourtOccurrenceId",
                principalTable: "BookingCourtOccurrences",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_BookingServices_BookingCourtOccurrences_BookingCourtOccurre~",
                table: "BookingServices",
                column: "BookingCourtOccurrenceId",
                principalTable: "BookingCourtOccurrences",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_BookingCourtOccurrences_BookingCourtOccurrenceId",
                table: "Payments",
                column: "BookingCourtOccurrenceId",
                principalTable: "BookingCourtOccurrences",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BookingOrderItems_BookingCourtOccurrences_BookingCourtOccur~",
                table: "BookingOrderItems");

            migrationBuilder.DropForeignKey(
                name: "FK_BookingServices_BookingCourtOccurrences_BookingCourtOccurre~",
                table: "BookingServices");

            migrationBuilder.DropForeignKey(
                name: "FK_Payments_BookingCourtOccurrences_BookingCourtOccurrenceId",
                table: "Payments");

            migrationBuilder.DropTable(
                name: "BookingCourtOccurrences");

            migrationBuilder.DropIndex(
                name: "IX_Payments_BookingCourtOccurrenceId",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "BookingCourtOccurrenceId",
                table: "Payments");

            migrationBuilder.RenameColumn(
                name: "BookingCourtOccurrenceId",
                table: "BookingServices",
                newName: "BookingId");

            migrationBuilder.RenameIndex(
                name: "IX_BookingServices_BookingCourtOccurrenceId",
                table: "BookingServices",
                newName: "IX_BookingServices_BookingId");

            migrationBuilder.RenameColumn(
                name: "BookingCourtOccurrenceId",
                table: "BookingOrderItems",
                newName: "BookingId");

            migrationBuilder.RenameIndex(
                name: "IX_BookingOrderItems_BookingCourtOccurrenceId",
                table: "BookingOrderItems",
                newName: "IX_BookingOrderItems_BookingId");

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 20, 1, 17, 26, 108, DateTimeKind.Utc).AddTicks(6420), new DateTime(2025, 10, 20, 1, 17, 26, 108, DateTimeKind.Utc).AddTicks(6420) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 20, 1, 17, 26, 108, DateTimeKind.Utc).AddTicks(6420), new DateTime(2025, 10, 20, 1, 17, 26, 108, DateTimeKind.Utc).AddTicks(6420) });

            migrationBuilder.AddForeignKey(
                name: "FK_BookingOrderItems_BookingCourts_BookingId",
                table: "BookingOrderItems",
                column: "BookingId",
                principalTable: "BookingCourts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_BookingServices_BookingCourts_BookingId",
                table: "BookingServices",
                column: "BookingId",
                principalTable: "BookingCourts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
