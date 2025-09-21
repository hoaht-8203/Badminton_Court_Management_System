using System;
using System.Text.Json;
using ApiApplication.Constants;
using ApiApplication.Entities;
using ApiApplication.Entities.Shared;
using ApiApplication.Sessions;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace ApiApplication.Data;

public class ApplicationDbContext(
    DbContextOptions<ApplicationDbContext> options,
    ICurrentUser currentUser
) : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>(options)
{
    private readonly ICurrentUser _currentUser = currentUser;

    public DbSet<ApplicationUser> ApplicationUsers { get; set; }
    public DbSet<ApplicationUserToken> ApplicationUserTokens { get; set; }
    public DbSet<Activity> Activities { get; set; }
    public DbSet<Customer> Customers { get; set; }

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

        // Configure Activity entity
        builder.Entity<Activity>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Action).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Value).IsRequired().HasColumnType("decimal(18,2)");
            entity.Property(e => e.ValueFormatted).IsRequired().HasMaxLength(50);
            entity.Property(e => e.OrderId).HasMaxLength(50);
            entity.Property(e => e.AdditionalInfo).HasMaxLength(1000);
            entity.Property(e => e.ActivityTime).IsRequired();

            entity.HasIndex(e => e.UserName);
            entity.HasIndex(e => e.Action);
            entity.HasIndex(e => e.ActivityTime);
        });

        SeedAdministratorUser(builder);
        SeedCustomerData(builder);
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

    private static void SeedCustomerData(ModelBuilder builder)
    {
        builder
            .Entity<Customer>()
            .HasData(
                new Customer
                {
                    Id = 1,
                    FullName = "Nguyễn Văn An",
                    PhoneNumber = "0123456789",
                    Email = "nguyenvanan@gmail.com",
                    Status = CustomerStatus.Active,
                    Gender = "Nam",
                    Address = "123 Đường ABC, Phường Dịch Vọng",
                    City = "Hà Nội",
                    District = "Cầu Giấy",
                    Ward = "Dịch Vọng",
                    IDCard = "123456789",
                    Note = "Khách hàng VIP - Thường xuyên đặt sân",
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "System",
                    UpdatedAt = DateTime.UtcNow,
                },
                new Customer
                {
                    Id = 2,
                    FullName = "Trần Thị Bình",
                    PhoneNumber = "0987654321",
                    Email = "tranthibinh@gmail.com",
                    Status = CustomerStatus.Active,
                    Gender = "Nữ",
                    Address = "456 Đường XYZ, Phường Bến Nghé",
                    City = "TP. Hồ Chí Minh",
                    District = "Quận 1",
                    Ward = "Phường Bến Nghé",
                    IDCard = "987654321",
                    Note = "Khách hàng thường xuyên - Đặt sân cuối tuần",
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "System",
                    UpdatedAt = DateTime.UtcNow,
                },
                new Customer
                {
                    Id = 3,
                    FullName = "Lê Văn Cường",
                    PhoneNumber = "0369852147",
                    Email = "levancuong@gmail.com",
                    Status = CustomerStatus.Active,
                    Gender = "Nam",
                    Address = "789 Đường DEF, Phường Láng Thượng",
                    City = "Hà Nội",
                    District = "Đống Đa",
                    Ward = "Láng Thượng",
                    IDCard = "456789123",
                    Note = "Khách hàng mới - Quan tâm đến sân cầu lông",
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "System",
                    UpdatedAt = DateTime.UtcNow,
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
