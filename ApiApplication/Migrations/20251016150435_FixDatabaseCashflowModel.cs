using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApiApplication.Migrations
{
    /// <inheritdoc />
    public partial class FixDatabaseCashflowModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Cashflows_AspNetUsers_CreatedByUserId",
                table: "Cashflows");

            migrationBuilder.DropForeignKey(
                name: "FK_Cashflows_RelatedPeople_RelatedPersonId",
                table: "Cashflows");

            migrationBuilder.DropIndex(
                name: "IX_Cashflows_CreatedByUserId",
                table: "Cashflows");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "Cashflows");

            migrationBuilder.AddColumn<int>(
                name: "RelatedId",
                table: "Cashflows",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RelatedPerson",
                table: "Cashflows",
                type: "text",
                nullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Cashflows_RelatedPeople_RelatedPersonId",
                table: "Cashflows",
                column: "RelatedPersonId",
                principalTable: "RelatedPeople",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Cashflows_RelatedPeople_RelatedPersonId",
                table: "Cashflows");

            migrationBuilder.DropColumn(
                name: "RelatedId",
                table: "Cashflows");

            migrationBuilder.DropColumn(
                name: "RelatedPerson",
                table: "Cashflows");

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "Cashflows",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Cashflows_CreatedByUserId",
                table: "Cashflows",
                column: "CreatedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Cashflows_AspNetUsers_CreatedByUserId",
                table: "Cashflows",
                column: "CreatedByUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Cashflows_RelatedPeople_RelatedPersonId",
                table: "Cashflows",
                column: "RelatedPersonId",
                principalTable: "RelatedPeople",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
