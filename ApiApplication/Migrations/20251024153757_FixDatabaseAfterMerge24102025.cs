using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class FixDatabaseAfterMerge24102025 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // use idempotent raw SQL so the migration can be applied safely when the DB
            // already has/doesn't have the columns (avoids "column already exists" errors)
            migrationBuilder.Sql("ALTER TABLE \"Cashflows\" DROP COLUMN IF EXISTS \"AccountInBusinessResults\";");
            migrationBuilder.Sql("ALTER TABLE \"Cashflows\" DROP COLUMN IF EXISTS \"PaymentMethod\";");
            migrationBuilder.Sql("ALTER TABLE \"Cashflows\" ADD COLUMN IF NOT EXISTS \"PersonType\" text;");

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 24, 15, 37, 57, 530, DateTimeKind.Utc).AddTicks(9480), new DateTime(2025, 10, 24, 15, 37, 57, 530, DateTimeKind.Utc).AddTicks(9480) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 24, 15, 37, 57, 530, DateTimeKind.Utc).AddTicks(9480), new DateTime(2025, 10, 24, 15, 37, 57, 530, DateTimeKind.Utc).AddTicks(9480) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // reverse operations using IF EXISTS/IF NOT EXISTS to be safe on rollback
            migrationBuilder.Sql("ALTER TABLE \"Cashflows\" DROP COLUMN IF EXISTS \"PersonType\";");
            migrationBuilder.Sql("ALTER TABLE \"Cashflows\" ADD COLUMN IF NOT EXISTS \"AccountInBusinessResults\" boolean NOT NULL DEFAULT false;");
            migrationBuilder.Sql("ALTER TABLE \"Cashflows\" ADD COLUMN IF NOT EXISTS \"PaymentMethod\" integer NOT NULL DEFAULT 0;");

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 23, 20, 55, 47, 87, DateTimeKind.Utc).AddTicks(6570), new DateTime(2025, 10, 23, 20, 55, 47, 87, DateTimeKind.Utc).AddTicks(6570) });

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 10, 23, 20, 55, 47, 87, DateTimeKind.Utc).AddTicks(6570), new DateTime(2025, 10, 23, 20, 55, 47, 87, DateTimeKind.Utc).AddTicks(6570) });
        }
    }
}
