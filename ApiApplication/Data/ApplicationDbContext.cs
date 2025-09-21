using System;
using ApiApplication.Constants;
using ApiApplication.Entities;
using ApiApplication.Entities.Shared;
using ApiApplication.Sessions;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Internal;

namespace ApiApplication.Data;

public class ApplicationDbContext(
    DbContextOptions<ApplicationDbContext> options,
    ICurrentUser currentUser
) : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>(options)
{
    private readonly ICurrentUser _currentUser = currentUser;

    public DbSet<ApplicationUser> ApplicationUsers { get; set; }
    public DbSet<Staff> Staffs { get; set; }
    public DbSet<ApplicationUserToken> ApplicationUserTokens { get; set; }
    public DbSet<SystemConfig> SystemConfigs { get; set; }
    public DbSet<Shift> Shifts { get; set; }
    public DbSet<Branch> Branches { get; set; }
    public DbSet<Department> Departments { get; set; }
    public DbSet<Payroll> Payrolls { get; set; }
    public DbSet<PayrollItem> PayrollItems { get; set; }
    public DbSet<SalaryForm> SalaryForms { get; set; }
    public DbSet<Schedule> Schedules { get; set; }
    

    protected override void OnModelCreating(ModelBuilder builder)
    {

        base.OnModelCreating(builder);


        // Store Staff.SalarySettings as jsonb
        builder.Entity<Staff>()
            .Property(s => s.SalarySettings)
            .HasColumnType("jsonb");

        // Store SalaryForm.SalarySettings as jsonb
        builder.Entity<SalaryForm>()
            .Property(s => s.SalarySettings)
            .HasColumnType("jsonb");

        // Store Schedule.ByDay as array of string
        builder.Entity<Schedule>()
            .Property(s => s.ByDay)
            .HasColumnType("text[]");

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
