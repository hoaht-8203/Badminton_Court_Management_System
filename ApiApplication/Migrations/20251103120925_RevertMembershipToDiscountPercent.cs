using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class RevertMembershipToDiscountPercent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Benefits",
                table: "Memberships");

            migrationBuilder.DropColumn(
                name: "BenefitsDescription",
                table: "Memberships");

            migrationBuilder.AddColumn<decimal>(
                name: "DiscountPercent",
                table: "Memberships",
                type: "numeric(5,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.UpdateData(
                table: "Memberships",
                keyColumn: "Id",
                keyValue: 1,
                column: "DiscountPercent",
                value: 5m);

            migrationBuilder.UpdateData(
                table: "Memberships",
                keyColumn: "Id",
                keyValue: 2,
                column: "DiscountPercent",
                value: 10m);

            migrationBuilder.UpdateData(
                table: "Memberships",
                keyColumn: "Id",
                keyValue: 3,
                column: "DiscountPercent",
                value: 15m);

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 3, 12, 9, 24, 953, DateTimeKind.Utc).AddTicks(1800), new DateTime(2025, 11, 3, 12, 9, 24, 953, DateTimeKind.Utc).AddTicks(1800) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 3, 12, 9, 24, 953, DateTimeKind.Utc).AddTicks(1800), new DateTime(2025, 11, 3, 12, 9, 24, 953, DateTimeKind.Utc).AddTicks(1800) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DiscountPercent",
                table: "Memberships");

            migrationBuilder.AddColumn<Dictionary<string, int>>(
                name: "Benefits",
                table: "Memberships",
                type: "jsonb",
                nullable: false);

            migrationBuilder.AddColumn<string[]>(
                name: "BenefitsDescription",
                table: "Memberships",
                type: "text[]",
                nullable: false,
                defaultValue: new string[0]);

            migrationBuilder.UpdateData(
                table: "Memberships",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "Benefits", "BenefitsDescription" },
                values: new object[] { new Dictionary<string, int> { ["discount_court"] = 5, ["discount_service"] = 10, ["discount_product"] = 15 }, new[] { "Ưu đãi 5% khi đặt sân", "Ưu đãi 10% khi sử dụng dịch vụ", "Ưu đãi 15% khi mua sản phẩm" } });

            migrationBuilder.UpdateData(
                table: "Memberships",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "Benefits", "BenefitsDescription" },
                values: new object[] { new Dictionary<string, int> { ["discount_court"] = 10, ["discount_service"] = 20, ["discount_product"] = 25 }, new[] { "Ưu đãi 10% khi đặt sân", "Ưu đãi 20% khi sử dụng dịch vụ", "Ưu đãi 25% khi mua sản phẩm" } });

            migrationBuilder.UpdateData(
                table: "Memberships",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "Benefits", "BenefitsDescription" },
                values: new object[] { new Dictionary<string, int> { ["discount_court"] = 15, ["discount_product"] = 25 }, new[] { "Ưu đãi 15% khi đặt sân", "Miễn phí sử dụng dịch vụ", "Miễn phí nước giải khát", "Ưu đãi 25% khi mua sản phẩm" } });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 3, 11, 22, 22, 640, DateTimeKind.Utc).AddTicks(7160), new DateTime(2025, 11, 3, 11, 22, 22, 640, DateTimeKind.Utc).AddTicks(7160) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 3, 11, 22, 22, 640, DateTimeKind.Utc).AddTicks(7170), new DateTime(2025, 11, 3, 11, 22, 22, 640, DateTimeKind.Utc).AddTicks(7170) });
        }
    }
}
