using System;
using ApiApplication.Constants;
using ApiApplication.Entities;
using ApiApplication.Entities.Shared;
using ApiApplication.Sessions;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Data;

public class ApplicationDbContext(
    DbContextOptions<ApplicationDbContext> options,
    ICurrentUser currentUser
) : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>(options)
{
    private readonly ICurrentUser _currentUser = currentUser;

    public DbSet<ApplicationUser> ApplicationUsers { get; set; }
    public DbSet<ApplicationUserToken> ApplicationUserTokens { get; set; }
    public DbSet<Supplier> Suppliers { get; set; }

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
        SeedSupplierData(builder);
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
            CreatedAt = new DateTime(2025, 9, 16, 9, 34, 1, 800, DateTimeKind.Utc).AddTicks(7670),
            CreatedBy = null,
            UpdatedAt = null,
            UpdatedBy = null,
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

    private static void SeedSupplierData(ModelBuilder builder)
    {
        builder
            .Entity<Supplier>()
            .HasData(
                new Supplier
                {
                    Id = 1,
                    Name = "Công ty TNHH Thiết Bị Thể Thao An Phát",
                    Phone = "0901234567",
                    Email = "anphat@sports.com",
                    Address = "Số 10 Nguyễn Trãi, Thanh Xuân, Hà Nội",
                    City = "",
                    District = "",
                    Ward = "",
                    Notes = "Nhà cung cấp chính thức vợt cầu lông và bóng đá",
                    Status = "Active",
                    CreatedAt = new DateTime(2025, 9, 16, 9, 34, 1, 800, DateTimeKind.Utc).AddTicks(
                        7670
                    ),
                    CreatedBy = null,
                    UpdatedAt = null,
                    UpdatedBy = null,
                },
                new Supplier
                {
                    Id = 2,
                    Name = "Công ty CP Dụng Cụ Thể Thao Việt Nam",
                    Phone = "0987654321",
                    Email = "contact@vietnamsports.vn",
                    Address = "Số 25 Lê Lợi, Quận 1, TP. Hồ Chí Minh",
                    City = "",
                    District = "",
                    Ward = "",
                    Notes = "Cung cấp bóng chuyền và thiết bị tập gym",
                    Status = "Active",
                    CreatedAt = new DateTime(2025, 9, 16, 9, 34, 1, 800, DateTimeKind.Utc).AddTicks(
                        7670
                    ),
                    CreatedBy = null,
                    UpdatedAt = null,
                    UpdatedBy = null,
                }
            );
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var entries = ChangeTracker
            .Entries()
            .Where(e =>
                e.Entity is IAuditableEntity
                && (e.State == EntityState.Added || e.State == EntityState.Modified)
            );

        foreach (var entityEntry in entries)
        {
            var entity = (IAuditableEntity)entityEntry.Entity;

            if (entityEntry.State == EntityState.Added)
            {
                entity.CreatedAt = DateTime.UtcNow;
                entity.CreatedBy = _currentUser.Username;
                entity.UpdatedAt = DateTime.UtcNow;
                entity.UpdatedBy = _currentUser.Username;
            }

            if (entityEntry.State == EntityState.Modified)
            {
                entity.UpdatedAt = DateTime.UtcNow;
                entity.UpdatedBy = _currentUser.Username;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
