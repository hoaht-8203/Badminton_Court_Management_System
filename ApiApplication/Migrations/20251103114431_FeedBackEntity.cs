using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class FeedBackEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Feedbacks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CustomerId = table.Column<int>(type: "integer", nullable: false),
                    BookingCourtOccurrenceId = table.Column<Guid>(type: "uuid", nullable: false),
                    Rating = table.Column<int>(type: "integer", nullable: false),
                    Comment = table.Column<string>(type: "text", nullable: true),
                    CourtQuality = table.Column<int>(type: "integer", nullable: false),
                    StaffService = table.Column<int>(type: "integer", nullable: false),
                    Cleanliness = table.Column<int>(type: "integer", nullable: false),
                    Lighting = table.Column<int>(type: "integer", nullable: false),
                    ValueForMoney = table.Column<int>(type: "integer", nullable: false),
                    MediaUrl = table.Column<string[]>(type: "text[]", nullable: true),
                    AdminReply = table.Column<string>(type: "text", nullable: true),
                    AdminReplyAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Feedbacks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Feedbacks_BookingCourtOccurrences_BookingCourtOccurrenceId",
                        column: x => x.BookingCourtOccurrenceId,
                        principalTable: "BookingCourtOccurrences",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Feedbacks_Customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 3, 11, 44, 28, 830, DateTimeKind.Utc).AddTicks(5499), new DateTime(2025, 11, 3, 11, 44, 28, 830, DateTimeKind.Utc).AddTicks(5500) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 3, 11, 44, 28, 830, DateTimeKind.Utc).AddTicks(5502), new DateTime(2025, 11, 3, 11, 44, 28, 830, DateTimeKind.Utc).AddTicks(5503) });

            migrationBuilder.CreateIndex(
                name: "IX_Feedbacks_BookingCourtOccurrenceId",
                table: "Feedbacks",
                column: "BookingCourtOccurrenceId");

            migrationBuilder.CreateIndex(
                name: "IX_Feedbacks_CustomerId",
                table: "Feedbacks",
                column: "CustomerId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Feedbacks");

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 27, 4, 43, 48, 429, DateTimeKind.Utc).AddTicks(9410), new DateTime(2025, 10, 27, 4, 43, 48, 429, DateTimeKind.Utc).AddTicks(9410) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 27, 4, 43, 48, 429, DateTimeKind.Utc).AddTicks(9410), new DateTime(2025, 10, 27, 4, 43, 48, 429, DateTimeKind.Utc).AddTicks(9410) });
        }
    }
}
