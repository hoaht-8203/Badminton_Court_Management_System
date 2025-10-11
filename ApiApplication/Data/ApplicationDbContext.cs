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
    public DbSet<Staff> Staffs { get; set; }
    public DbSet<ApplicationUserToken> ApplicationUserTokens { get; set; }
    public DbSet<Activity> Activities { get; set; }
    public DbSet<Customer> Customers { get; set; }
    public DbSet<SystemConfig> SystemConfigs { get; set; }
    public DbSet<Shift> Shifts { get; set; }
    public DbSet<Branch> Branches { get; set; }
    public DbSet<Department> Departments { get; set; }
    public DbSet<Payroll> Payrolls { get; set; }
    public DbSet<PayrollItem> PayrollItems { get; set; }
    public DbSet<SalaryForm> SalaryForms { get; set; }
    public DbSet<Schedule> Schedules { get; set; }
    public DbSet<Court> Courts { get; set; }
    public DbSet<CourtArea> CourtAreas { get; set; }
    public DbSet<CourtPricingRules> CourtPricingRules { get; set; }
    public DbSet<CourtPricingRuleTemplate> CourtPricingRuleTemplates { get; set; }
    public DbSet<BookingCourt> BookingCourts { get; set; }
    public DbSet<Payment> Payments { get; set; }

    // public DbSet<AttendanceRecord> AttendanceRecords { get; set; }
    public DbSet<CancelledShift> CancelledShifts { get; set; }
    public DbSet<Supplier> Suppliers { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<PriceTable> PriceTables { get; set; }
    public DbSet<PriceTimeRange> PriceTimeRanges { get; set; }
    public DbSet<PriceTableProduct> PriceTableProducts { get; set; }

    public DbSet<InventoryCheck> InventoryChecks { get; set; }
    public DbSet<InventoryCheckItem> InventoryCheckItems { get; set; }

    public DbSet<Service> Services { get; set; }
    public DbSet<ServicePricingRule> ServicePricingRules { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        // Payment mappings
        builder.Entity<Payment>(entity =>
        {
            entity.Property(p => p.Amount).HasColumnType("decimal(18,2)");
            entity.HasIndex(p => p.Id).IsUnique();
        });

        // Store Staff.SalarySettings as jsonb
        builder.Entity<Staff>().Property(s => s.SalarySettings).HasColumnType("jsonb");

        // Store SalaryForm.SalarySettings as jsonb
        builder.Entity<SalaryForm>().Property(s => s.SalarySettings).HasColumnType("jsonb");

        // Store Schedule.ByDay as array of string
        builder.Entity<Schedule>().Property(s => s.ByDay).HasColumnType("text[]");

        // Category mappings
        builder.Entity<Category>(entity =>
        {
            entity.HasIndex(c => c.Name);
        });

        // Product mappings
        builder.Entity<Product>(entity =>
        {
            entity.Property(p => p.Images).HasColumnType("text[]");
            entity.Property(p => p.CostPrice).HasColumnType("decimal(18,2)");
            entity.Property(p => p.SalePrice).HasColumnType("decimal(18,2)");
            entity.HasIndex(p => p.Code).IsUnique(false);
            entity.HasIndex(p => p.Name);

            // Category relationship
            entity
                .HasOne(p => p.Category)
                .WithMany(c => c.Products)
                .HasForeignKey(p => p.CategoryId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Price table mappings
        builder.Entity<PriceTable>(entity =>
        {
            entity
                .HasMany(p => p.TimeRanges)
                .WithOne(r => r.PriceTable)
                .HasForeignKey(r => r.PriceTableId)
                .OnDelete(DeleteBehavior.Cascade);
        });
        builder.Entity<PriceTimeRange>(entity => { });
        builder.Entity<PriceTableProduct>(entity =>
        {
            entity.HasKey(x => new { x.PriceTableId, x.ProductId });
            entity
                .HasOne(x => x.PriceTable)
                .WithMany(p => p.PriceTableProducts)
                .HasForeignKey(x => x.PriceTableId);
            entity.HasOne(x => x.Product).WithMany().HasForeignKey(x => x.ProductId);
            entity.Property(x => x.OverrideSalePrice).HasColumnType("decimal(18,2)");
        });

        // Inventory check mappings
        builder.Entity<InventoryCheck>(entity =>
        {
            entity.Property(p => p.Code).HasMaxLength(20);
            entity.Property(p => p.Note).HasMaxLength(500);
            entity
                .HasMany(p => p.Items)
                .WithOne(i => i.InventoryCheck)
                .HasForeignKey(i => i.InventoryCheckId)
                .OnDelete(DeleteBehavior.Cascade);
        });
        builder.Entity<InventoryCheckItem>(entity =>
        {
            entity
                .HasOne(i => i.Product)
                .WithMany()
                .HasForeignKey(i => i.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });

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
        SeedSupplierData(builder);
        SeedCategoryData(builder);
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
            PasswordHash =
                "AQAAAAIAAYagAAAAEFqGX2kp4KdZKDMjapLakqUamDNwC0vTXnvlme/+yss14bhAg0PbRCxpq4LkX3TzyQ==",
        };

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
                    CreatedAt = new DateTime(2025, 9, 16, 9, 34, 1, 800, DateTimeKind.Utc).AddTicks(
                        7670
                    ),
                    CreatedBy = "System",
                    UpdatedAt = new DateTime(2025, 9, 16, 9, 34, 1, 800, DateTimeKind.Utc).AddTicks(
                        7670
                    ),
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
                    CreatedAt = new DateTime(2025, 9, 16, 9, 34, 1, 800, DateTimeKind.Utc).AddTicks(
                        7670
                    ),
                    CreatedBy = "System",
                    UpdatedAt = new DateTime(2025, 9, 16, 9, 34, 1, 800, DateTimeKind.Utc).AddTicks(
                        7670
                    ),
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
                    CreatedAt = new DateTime(2025, 9, 16, 9, 34, 1, 800, DateTimeKind.Utc).AddTicks(
                        7670
                    ),
                    CreatedBy = "System",
                    UpdatedAt = new DateTime(2025, 9, 16, 9, 34, 1, 800, DateTimeKind.Utc).AddTicks(
                        7670
                    ),
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

    private static void SeedCategoryData(ModelBuilder builder)
    {
        builder
            .Entity<Category>()
            .HasData(
                new Category
                {
                    Id = 1,
                    Name = "Nước Giải Khát",
                    CreatedAt = new DateTime(2025, 9, 16, 9, 34, 1, 800, DateTimeKind.Utc).AddTicks(
                        7670
                    ),
                    CreatedBy = "System",
                    UpdatedAt = new DateTime(2025, 9, 16, 9, 34, 1, 800, DateTimeKind.Utc).AddTicks(
                        7670
                    ),
                    UpdatedBy = "System",
                },
                new Category
                {
                    Id = 2,
                    Name = "Đồ Ăn",
                    CreatedAt = new DateTime(2025, 9, 16, 9, 34, 1, 800, DateTimeKind.Utc).AddTicks(
                        7670
                    ),
                    CreatedBy = "System",
                    UpdatedAt = new DateTime(2025, 9, 16, 9, 34, 1, 800, DateTimeKind.Utc).AddTicks(
                        7670
                    ),
                    UpdatedBy = "System",
                },
                new Category
                {
                    Id = 3,
                    Name = "Thiết Bị Thể Thao",
                    CreatedAt = new DateTime(2025, 9, 16, 9, 34, 1, 800, DateTimeKind.Utc).AddTicks(
                        7670
                    ),
                    CreatedBy = "System",
                    UpdatedAt = new DateTime(2025, 9, 16, 9, 34, 1, 800, DateTimeKind.Utc).AddTicks(
                        7670
                    ),
                    UpdatedBy = "System",
                },
                new Category
                {
                    Id = 4,
                    Name = "Phụ Kiện",
                    CreatedAt = new DateTime(2025, 9, 16, 9, 34, 1, 800, DateTimeKind.Utc).AddTicks(
                        7670
                    ),
                    CreatedBy = "System",
                    UpdatedAt = new DateTime(2025, 9, 16, 9, 34, 1, 800, DateTimeKind.Utc).AddTicks(
                        7670
                    ),
                    UpdatedBy = "System",
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

        var username = string.IsNullOrWhiteSpace(_currentUser.Username)
            ? "System"
            : _currentUser.Username;

        foreach (var entityEntry in entries)
        {
            var entity = (IAuditableEntity)entityEntry.Entity;

            if (entityEntry.State == EntityState.Added)
            {
                entity.CreatedAt = DateTime.UtcNow;
                entity.CreatedBy = username;
                entity.UpdatedAt = DateTime.UtcNow;
                entity.UpdatedBy = username;
            }

            if (entityEntry.State == EntityState.Modified)
            {
                entity.UpdatedAt = DateTime.UtcNow;
                entity.UpdatedBy = username;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
