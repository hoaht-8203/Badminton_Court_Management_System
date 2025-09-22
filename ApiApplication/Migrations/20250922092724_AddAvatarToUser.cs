using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class AddAvatarToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AvatarUrl",
                table: "Customers",
                type: "text",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: new Guid("ba8008d3-6f25-4ca3-be62-21c2af0e4f97"),
                column: "PasswordHash",
                value: "AQAAAAIAAYagAAAAEMCVp86HhrwJ20yd3tn53RUdnCIVDJrR4cV5Bnk0SBmQGjNBK6/8BIrS8Zs1kdbwuQ==");

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "AvatarUrl", "CreatedAt", "UpdatedAt" },
                values: new object[] { null, new DateTime(2025, 9, 22, 9, 27, 22, 729, DateTimeKind.Utc).AddTicks(5299), new DateTime(2025, 9, 22, 9, 27, 22, 729, DateTimeKind.Utc).AddTicks(5301) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "AvatarUrl", "CreatedAt", "UpdatedAt" },
                values: new object[] { null, new DateTime(2025, 9, 22, 9, 27, 22, 729, DateTimeKind.Utc).AddTicks(5307), new DateTime(2025, 9, 22, 9, 27, 22, 729, DateTimeKind.Utc).AddTicks(5308) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "AvatarUrl", "CreatedAt", "UpdatedAt" },
                values: new object[] { null, new DateTime(2025, 9, 22, 9, 27, 22, 729, DateTimeKind.Utc).AddTicks(5311), new DateTime(2025, 9, 22, 9, 27, 22, 729, DateTimeKind.Utc).AddTicks(5311) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AvatarUrl",
                table: "Customers");

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: new Guid("ba8008d3-6f25-4ca3-be62-21c2af0e4f97"),
                column: "PasswordHash",
                value: "AQAAAAIAAYagAAAAEGqi7OTii9G/NeNn4o08sFKhqIZaUDYRtntCFcoTMf1eag2a0/Kw3kDFNalMnXS9Rw==");

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 21, 13, 56, 48, 844, DateTimeKind.Utc).AddTicks(6504), new DateTime(2025, 9, 21, 13, 56, 48, 844, DateTimeKind.Utc).AddTicks(6512) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 21, 13, 56, 48, 844, DateTimeKind.Utc).AddTicks(6549), new DateTime(2025, 9, 21, 13, 56, 48, 844, DateTimeKind.Utc).AddTicks(6549) });

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 9, 21, 13, 56, 48, 844, DateTimeKind.Utc).AddTicks(6556), new DateTime(2025, 9, 21, 13, 56, 48, 844, DateTimeKind.Utc).AddTicks(6557) });
        }
    }
}
