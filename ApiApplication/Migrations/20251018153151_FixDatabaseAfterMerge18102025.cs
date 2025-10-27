using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class FixDatabaseAfterMerge18102025 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "NotificationByType",
                table: "Notifications",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100,
                oldNullable: true);

            migrationBuilder.CreateTable(
                name: "CashflowTypes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    IsPayment = table.Column<bool>(type: "boolean", nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CashflowTypes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RelatedPeople",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Phone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Address = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Company = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Note = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RelatedPeople", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Cashflows",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsPayment = table.Column<bool>(type: "boolean", nullable: false),
                    CashflowTypeId = table.Column<int>(type: "integer", nullable: false),
                    RelatedId = table.Column<int>(type: "integer", nullable: true),
                    RelatedPerson = table.Column<string>(type: "text", nullable: true),
                    Value = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    PaymentMethod = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    ReferenceNumber = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    AccountInBusinessResults = table.Column<bool>(type: "boolean", nullable: false),
                    RelatedPersonId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Cashflows", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Cashflows_CashflowTypes_CashflowTypeId",
                        column: x => x.CashflowTypeId,
                        principalTable: "CashflowTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Cashflows_RelatedPeople_RelatedPersonId",
                        column: x => x.RelatedPersonId,
                        principalTable: "RelatedPeople",
                        principalColumn: "Id");
                });

            migrationBuilder.InsertData(
                table: "CashflowTypes",
                columns: new[] { "Id", "Code", "CreatedAt", "CreatedBy", "Description", "IsActive", "IsPayment", "Name", "UpdatedAt", "UpdatedBy" },
                values: new object[,]
                {
                    { 1, "TTM", new DateTime(2025, 10, 17, 9, 0, 0, 0, DateTimeKind.Utc), "System", "Thu nhập khác", true, false, "Thu nhập khác", new DateTime(2025, 10, 17, 9, 0, 0, 0, DateTimeKind.Utc), "System" },
                    { 2, "CTM", new DateTime(2025, 10, 17, 9, 0, 0, 0, DateTimeKind.Utc), "System", "Chi phí khác", true, true, "Chi phí khác", new DateTime(2025, 10, 17, 9, 0, 0, 0, DateTimeKind.Utc), "System" },
                    { 3, "TTTS", new DateTime(2025, 10, 17, 9, 0, 0, 0, DateTimeKind.Utc), "System", "Thu từ khách hàng thuê sân cầu lông", true, false, "Thu tiền thuê sân", new DateTime(2025, 10, 17, 9, 0, 0, 0, DateTimeKind.Utc), "System" },
                    { 4, "TTBH", new DateTime(2025, 10, 17, 9, 0, 0, 0, DateTimeKind.Utc), "System", "Thu tiền từ việc bán hàng hóa, đồ uống", true, false, "Thu tiền bán hàng", new DateTime(2025, 10, 17, 9, 0, 0, 0, DateTimeKind.Utc), "System" },
                    { 5, "CMHH", new DateTime(2025, 10, 17, 9, 0, 0, 0, DateTimeKind.Utc), "System", "Chi để nhập hàng hóa, vật tư", true, true, "Chi mua hàng hóa", new DateTime(2025, 10, 17, 9, 0, 0, 0, DateTimeKind.Utc), "System" },
                    { 6, "CLNV", new DateTime(2025, 10, 17, 9, 0, 0, 0, DateTimeKind.Utc), "System", "Chi trả lương cho nhân viên", true, true, "Chi lương nhân viên", new DateTime(2025, 10, 17, 9, 0, 0, 0, DateTimeKind.Utc), "System" }
                });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 18, 15, 31, 50, 808, DateTimeKind.Utc).AddTicks(5170), new DateTime(2025, 10, 18, 15, 31, 50, 808, DateTimeKind.Utc).AddTicks(5170) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 18, 15, 31, 50, 808, DateTimeKind.Utc).AddTicks(5170), new DateTime(2025, 10, 18, 15, 31, 50, 808, DateTimeKind.Utc).AddTicks(5170) });

            migrationBuilder.CreateIndex(
                name: "IX_Cashflows_CashflowTypeId",
                table: "Cashflows",
                column: "CashflowTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_Cashflows_RelatedPersonId",
                table: "Cashflows",
                column: "RelatedPersonId");

            migrationBuilder.CreateIndex(
                name: "IX_Cashflows_Status",
                table: "Cashflows",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Cashflows_Time",
                table: "Cashflows",
                column: "Time");

            migrationBuilder.CreateIndex(
                name: "IX_CashflowTypes_Code",
                table: "CashflowTypes",
                column: "Code",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Cashflows");

            migrationBuilder.DropTable(
                name: "CashflowTypes");

            migrationBuilder.DropTable(
                name: "RelatedPeople");

            migrationBuilder.AlterColumn<string>(
                name: "NotificationByType",
                table: "Notifications",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 17, 10, 51, 38, 134, DateTimeKind.Utc).AddTicks(2270), new DateTime(2025, 10, 17, 10, 51, 38, 134, DateTimeKind.Utc).AddTicks(2270) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 17, 10, 51, 38, 134, DateTimeKind.Utc).AddTicks(2270), new DateTime(2025, 10, 17, 10, 51, 38, 134, DateTimeKind.Utc).AddTicks(2270) });
        }
    }
}
