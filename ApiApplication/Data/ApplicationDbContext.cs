using System;
using ApiApplication.Constants;
using ApiApplication.Entities;
using ApiApplication.Entities.Shared;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Data;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
    : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>(options)
{
    public DbSet<ApplicationUser> ApplicationUsers { get; set; }
    public DbSet<ApplicationUserToken> ApplicationUserTokens { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder
            .Entity<IdentityRole<Guid>>()
            .HasData(
                new List<IdentityRole<Guid>>
                {
                    new()
                    {
                        Id = IdentityRoleConstants.AdminRoleGuid,
                        Name = IdentityRoleConstants.Admin,
                        NormalizedName = IdentityRoleConstants.Admin.ToUpper(),
                    },
                    new()
                    {
                        Id = IdentityRoleConstants.UserRoleGuid,
                        Name = IdentityRoleConstants.User,
                        NormalizedName = IdentityRoleConstants.User.ToUpper(),
                    },
                }
            );

        SeedAdministratorUser(builder);
    }

    private static void SeedAdministratorUser(ModelBuilder builder)
    {
        var passwordHasher = new PasswordHasher<ApplicationUser>();

        var adminUser = new ApplicationUser
        {
            Id = new("ba8008d3-6f25-4ca3-be62-21c2af0e4f97"),
            UserName = "admin",
            NormalizedUserName = "ADMIN",
            Email = "admin@email.com",
            NormalizedEmail = "ADMIN@EMAIL.COM",
            EmailConfirmed = true,
            Status = ApplicationUserStatus.Active,
            SecurityStamp = "a5fd6b0c-f96d-4c6b-b70c-95e8f4ff4423",
            ConcurrencyStamp = "d296d8e5-f257-49e7-936f-734491ebda7a",
            FullName = "Admin",
            UserTokens = [],
        };

        adminUser.PasswordHash = passwordHasher.HashPassword(adminUser, "admin123");

        builder.Entity<ApplicationUser>().HasData(adminUser);

        // Gán role Admin cho user
        builder
            .Entity<IdentityUserRole<Guid>>()
            .HasData(
                new IdentityUserRole<Guid>
                {
                    RoleId = IdentityRoleConstants.AdminRoleGuid, // Admin role
                    UserId = new("ba8008d3-6f25-4ca3-be62-21c2af0e4f97"),
                }
            );
    }
}
