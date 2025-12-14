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
    public DbSet<AttendanceRecord> AttendanceRecords { get; set; }
    public DbSet<CancelledShift> CancelledShifts { get; set; }
    public DbSet<Supplier> Suppliers { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<PriceTable> PriceTables { get; set; }
    public DbSet<PriceTimeRange> PriceTimeRanges { get; set; }
    public DbSet<PriceTableProduct> PriceTableProducts { get; set; }
    public DbSet<InventoryCheck> InventoryChecks { get; set; }
    public DbSet<InventoryCheckItem> InventoryCheckItems { get; set; }
    public DbSet<InventoryCard> InventoryCards { get; set; }
    public DbSet<SupplierBankAccount> SupplierBankAccounts { get; set; }
    public DbSet<Receipt> Receipts { get; set; }
    public DbSet<ReceiptItem> ReceiptItems { get; set; }
    public DbSet<StockOut> StockOuts { get; set; }
    public DbSet<StockOutItem> StockOutItems { get; set; }
    public DbSet<ReturnGoods> ReturnGoods { get; set; }
    public DbSet<ReturnGoodsItem> ReturnGoodsItems { get; set; }
    public DbSet<StoreBankAccount> StoreBankAccounts { get; set; }
    public DbSet<Service> Services { get; set; }
    public DbSet<BookingService> BookingServices { get; set; }
    public DbSet<BookingOrderItem> BookingOrderItems { get; set; }
    public DbSet<Order> Orders { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    public DbSet<Cashflow> Cashflows { get; set; }
    public DbSet<CashflowType> CashflowTypes { get; set; }
    public DbSet<RelatedPerson> RelatedPeople { get; set; }
    public DbSet<BookingCourtOccurrence> BookingCourtOccurrences { get; set; }
    public DbSet<Blog> Blogs { get; set; }
    public DbSet<Slider> Sliders { get; set; }
    public DbSet<Membership> Memberships { get; set; }
    public DbSet<UserMembership> UserMemberships { get; set; }
    public DbSet<Feedback> Feedbacks { get; set; }

    // Voucher entities
    public DbSet<Voucher> Vouchers { get; set; }
    public DbSet<VoucherTimeRule> VoucherTimeRules { get; set; }
    public DbSet<VoucherUsage> VoucherUsages { get; set; }
    public DbSet<VoucherUserRule> VoucherUserRules { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder
            .Entity<ApplicationUser>()
            .HasOne(a => a.Customer)
            .WithOne(c => c.User)
            .HasForeignKey<Customer>(c => c.UserId);

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

        // Cashflow mappings
        builder.Entity<CashflowType>(entity =>
        {
            entity.HasIndex(x => x.Code).IsUnique();
            entity.Property(x => x.Name).HasMaxLength(100);
            entity.Property(x => x.Code).HasMaxLength(20);
        });

        builder.Entity<Cashflow>(entity =>
        {
            entity.Property(x => x.Value).HasColumnType("decimal(18,2)");
            entity.HasIndex(x => x.Time);
            entity.HasIndex(x => x.Status);
            entity
                .HasOne(x => x.CashflowType)
                .WithMany(t => t.Cashflows)
                .HasForeignKey(x => x.CashflowTypeId)
                .OnDelete(DeleteBehavior.Restrict);
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

        // Inventory card mappings
        builder.Entity<InventoryCard>(entity =>
        {
            entity.Property(p => p.CostPrice).HasColumnType("decimal(18,2)");
            entity.Property(p => p.Code).HasMaxLength(20);
            entity.Property(p => p.Method).HasMaxLength(100);
            entity
                .HasOne(p => p.Product)
                .WithMany(p => p.InventoryCards)
                .HasForeignKey(p => p.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Supplier bank accounts
        builder.Entity<SupplierBankAccount>(entity =>
        {
            entity.Property(p => p.AccountNumber).HasMaxLength(50);
            entity.Property(p => p.AccountName).HasMaxLength(100);
            entity.Property(p => p.BankName).HasMaxLength(120);
            entity
                .HasOne(p => p.Supplier)
                .WithMany()
                .HasForeignKey(p => p.SupplierId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Store bank accounts
        builder.Entity<StoreBankAccount>(entity =>
        {
            entity.Property(p => p.AccountNumber).HasMaxLength(50).IsRequired();
            entity.Property(p => p.AccountName).HasMaxLength(150).IsRequired();
            entity.Property(p => p.BankName).HasMaxLength(200).IsRequired();
        });

        // Receipts
        builder.Entity<Receipt>(entity =>
        {
            entity.Property(p => p.Code).HasMaxLength(20);
            entity.Property(p => p.Discount).HasColumnType("decimal(18,2)");
            entity.Property(p => p.PaymentAmount).HasColumnType("decimal(18,2)");
            entity.Property(p => p.PaymentMethod).HasMaxLength(10);
            entity
                .HasOne(r => r.Supplier)
                .WithMany()
                .HasForeignKey(r => r.SupplierId)
                .OnDelete(DeleteBehavior.Restrict);
            entity
                .HasOne(r => r.SupplierBankAccount)
                .WithMany()
                .HasForeignKey(r => r.SupplierBankAccountId)
                .OnDelete(DeleteBehavior.SetNull);
            entity
                .HasMany(r => r.Items)
                .WithOne(i => i.Receipt)
                .HasForeignKey(i => i.ReceiptId)
                .OnDelete(DeleteBehavior.Cascade);
        });
        builder.Entity<ReceiptItem>(entity =>
        {
            entity.Property(p => p.CostPrice).HasColumnType("decimal(18,2)");
        });

        // StockOuts
        builder.Entity<StockOut>(entity =>
        {
            entity.Property(p => p.Code).HasMaxLength(50);
            entity.Property(p => p.OutBy).HasMaxLength(100);
            entity.Property(p => p.CreatedBy).HasMaxLength(100);
            entity.Property(p => p.Note).HasMaxLength(500);
            entity.Property(p => p.TotalValue).HasColumnType("decimal(18,2)");
            entity
                .HasOne(s => s.Supplier)
                .WithMany()
                .HasForeignKey(s => s.SupplierId)
                .OnDelete(DeleteBehavior.Restrict);
            entity
                .HasMany(s => s.Items)
                .WithOne(i => i.StockOut)
                .HasForeignKey(i => i.StockOutId)
                .OnDelete(DeleteBehavior.Cascade);
        });
        builder.Entity<StockOutItem>(entity =>
        {
            entity.Property(p => p.CostPrice).HasColumnType("decimal(18,2)");
            entity.Property(p => p.Note).HasMaxLength(500);
            entity
                .HasOne(i => i.Product)
                .WithMany()
                .HasForeignKey(i => i.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ReturnGoods
        builder.Entity<ReturnGoods>(entity =>
        {
            entity.Property(p => p.Code).HasMaxLength(50);
            entity.Property(p => p.ReturnBy).HasMaxLength(100);
            entity.Property(p => p.CreatedBy).HasMaxLength(100);
            entity.Property(p => p.Note).HasMaxLength(500);
            entity.Property(p => p.TotalValue).HasColumnType("decimal(18,2)");
            entity.Property(p => p.Discount).HasColumnType("decimal(18,2)");
            entity.Property(p => p.SupplierNeedToPay).HasColumnType("decimal(18,2)");
            entity.Property(p => p.SupplierPaid).HasColumnType("decimal(18,2)");
            entity
                .HasOne(r => r.StoreBankAccount)
                .WithMany()
                .HasForeignKey(r => r.StoreBankAccountId)
                .OnDelete(DeleteBehavior.Restrict);
            entity
                .HasOne(r => r.Supplier)
                .WithMany()
                .HasForeignKey(r => r.SupplierId)
                .OnDelete(DeleteBehavior.Restrict);
            entity
                .HasMany(r => r.Items)
                .WithOne(i => i.ReturnGoods)
                .HasForeignKey(i => i.ReturnGoodsId)
                .OnDelete(DeleteBehavior.Cascade);
        });
        builder.Entity<ReturnGoodsItem>(entity =>
        {
            entity.Property(p => p.ImportPrice).HasColumnType("decimal(18,2)");
            entity.Property(p => p.ReturnPrice).HasColumnType("decimal(18,2)");
            entity.Property(p => p.Discount).HasColumnType("decimal(18,2)");
            entity.Property(p => p.LineTotal).HasColumnType("decimal(18,2)");
            entity.Property(p => p.Note).HasMaxLength(500);
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
                        Id = IdentityRoleConstants.BranchAdministratorRoleGuid,
                        Name = IdentityRoleConstants.BranchAdministrator,
                        NormalizedName = IdentityRoleConstants.BranchAdministrator.ToUpper(),
                    },
                    new()
                    {
                        Id = IdentityRoleConstants.StaffRoleGuid,
                        Name = IdentityRoleConstants.Staff,
                        NormalizedName = IdentityRoleConstants.Staff.ToUpper(),
                    },
                    new()
                    {
                        Id = IdentityRoleConstants.WarehouseStaffRoleGuid,
                        Name = IdentityRoleConstants.WarehouseStaff,
                        NormalizedName = IdentityRoleConstants.WarehouseStaff.ToUpper(),
                    },
                    new()
                    {
                        Id = IdentityRoleConstants.ReceptionistRoleGuid,
                        Name = IdentityRoleConstants.Receptionist,
                        NormalizedName = IdentityRoleConstants.Receptionist.ToUpper(),
                    },
                    new()
                    {
                        Id = IdentityRoleConstants.CustomerRoleGuid,
                        Name = IdentityRoleConstants.Customer,
                        NormalizedName = IdentityRoleConstants.Customer.ToUpper(),
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

        // BookingCourtOccurrence mappings
        builder.Entity<BookingCourtOccurrence>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Status).HasMaxLength(50);
            entity.Property(e => e.Note).HasMaxLength(500);

            entity
                .HasOne(e => e.BookingCourt)
                .WithMany(b => b.BookingCourtOccurrences)
                .HasForeignKey(e => e.BookingCourtId)
                .OnDelete(DeleteBehavior.Cascade);

            entity
                .HasMany(e => e.Payments)
                .WithOne(p => p.BookingCourtOccurrence)
                .HasForeignKey(p => p.BookingCourtOccurrenceId)
                .OnDelete(DeleteBehavior.Restrict);

            entity
                .HasMany(e => e.BookingServices)
                .WithOne(bs => bs.BookingCourtOccurrence)
                .HasForeignKey(bs => bs.BookingCourtOccurrenceId)
                .OnDelete(DeleteBehavior.Cascade);

            entity
                .HasMany(e => e.BookingOrderItems)
                .WithOne(boi => boi.BookingCourtOccurrence)
                .HasForeignKey(boi => boi.BookingCourtOccurrenceId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Order mappings
        builder.Entity<Order>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CourtTotalAmount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.CourtPaidAmount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.CourtRemainingAmount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.ItemsSubtotal).HasColumnType("decimal(18,2)");
            entity.Property(e => e.LateFeePercentage).HasColumnType("decimal(5,2)");
            entity.Property(e => e.LateFeeAmount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.DiscountAmount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.Status).HasMaxLength(50);
            entity.Property(e => e.Note).HasMaxLength(500);

            entity
                .HasOne(e => e.Booking)
                .WithMany()
                .HasForeignKey(e => e.BookingId)
                .OnDelete(DeleteBehavior.Restrict);

            entity
                .HasOne(e => e.Customer)
                .WithMany()
                .HasForeignKey(e => e.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            entity
                .HasMany(e => e.Payments)
                .WithOne(p => p.Order)
                .HasForeignKey(p => p.OrderId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Notification mappings
        builder.Entity<Notification>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Message).HasMaxLength(1000);
            entity.Property(e => e.Type).HasConversion<string>().HasMaxLength(50);
            entity.Property(e => e.NotificationByType).HasConversion<string>().HasMaxLength(100);
            entity.Property(e => e.UserIds).HasColumnType("uuid[]");
        });

        // Membership mappings
        builder.Entity<Membership>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.Status).HasMaxLength(50);
            entity.Property(e => e.Price).HasColumnType("decimal(18,2)");
            entity.Property(e => e.DiscountPercent).HasColumnType("decimal(5,2)");
        });

        builder.Entity<UserMembership>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity
                .HasIndex(e => new
                {
                    e.CustomerId,
                    e.MembershipId,
                    e.StartDate,
                })
                .IsUnique(false);
            entity
                .HasOne(e => e.Customer)
                .WithMany(c => c.UserMemberships)
                .HasForeignKey(e => e.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);
            entity
                .HasOne(e => e.Membership)
                .WithMany(m => m.UserMemberships)
                .HasForeignKey(e => e.MembershipId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Feedback mappings
        builder.Entity<Feedback>(entity =>
        {
            entity.Property(f => f.MediaUrl).HasColumnType("text[]");
        });

        SeedAdministratorUser(builder);
        SeedCustomerData(builder);
        SeedSupplierData(builder);
        SeedCategoryData(builder);
        SeedSystemConfigData(builder);
        SeedCashflowTypeData(builder);
        SeedMembershipData(builder);
    }

    private static void SeedSystemConfigData(ModelBuilder builder)
    {
        builder
            .Entity<SystemConfig>()
            .HasData(
                new SystemConfig
                {
                    Id = 1,
                    Key = "MonthlyPayrollGeneration",
                    Value = "1",
                    Description = "Ngày tạo bảng lương hàng tháng",
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "System",
                    UpdatedAt = DateTime.UtcNow,
                    UpdatedBy = "System",
                },
                new SystemConfig
                {
                    Id = 2,
                    Key = "Holidays",
                    Value = "",
                    Description = "Chế độ nghỉ lễ của hệ thống",
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "System",
                    UpdatedAt = DateTime.UtcNow,
                    UpdatedBy = "System",
                }
            );
    }

    private static void SeedMembershipData(ModelBuilder builder)
    {
        builder
            .Entity<Membership>()
            .HasData(
                new Membership
                {
                    Id = 1,
                    Name = "Silver",
                    Price = 199000,
                    DiscountPercent = 5,
                    Description = "Gói Silver: ưu đãi cơ bản khi đặt sân",
                    DurationDays = 30,
                    Status = "Active",
                    CreatedAt = new DateTime(2025, 11, 1, 0, 0, 0, DateTimeKind.Utc),
                    CreatedBy = "System",
                    UpdatedAt = new DateTime(2025, 11, 1, 0, 0, 0, DateTimeKind.Utc),
                    UpdatedBy = "System",
                },
                new Membership
                {
                    Id = 2,
                    Name = "Gold",
                    Price = 399000,
                    DiscountPercent = 10,
                    Description = "Gói Gold: ưu đãi tốt hơn, thời hạn 60 ngày",
                    DurationDays = 60,
                    Status = "Active",
                    CreatedAt = new DateTime(2025, 10, 31, 0, 0, 0, DateTimeKind.Utc),
                    CreatedBy = "System",
                    UpdatedAt = new DateTime(2025, 10, 31, 0, 0, 0, DateTimeKind.Utc),
                    UpdatedBy = "System",
                },
                new Membership
                {
                    Id = 3,
                    Name = "Platinum",
                    Price = 699000,
                    DiscountPercent = 15,
                    Description = "Gói Platinum: ưu đãi cao nhất, 90 ngày",
                    DurationDays = 90,
                    Status = "Active",
                    CreatedAt = new DateTime(2025, 10, 30, 0, 0, 0, DateTimeKind.Utc),
                    CreatedBy = "System",
                    UpdatedAt = new DateTime(2025, 10, 30, 0, 0, 0, DateTimeKind.Utc),
                    UpdatedBy = "System",
                }
            );
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
                    Email = "nguyenvana@example.com",
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
                    Email = "tranthibinh@example.com",
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
                    Email = "levancuong@example.com",
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

    private static void SeedCashflowTypeData(ModelBuilder builder)
    {
        builder
            .Entity<CashflowType>()
            .HasData(
                new CashflowType
                {
                    Id = 1,
                    Name = "Thu nhập khác",
                    Code = "TTM",
                    IsPayment = false,
                    Description = "Thu nhập khác",
                    IsActive = true,
                    CreatedAt = new DateTime(2025, 10, 17, 9, 0, 0, DateTimeKind.Utc),
                    CreatedBy = "System",
                    UpdatedAt = new DateTime(2025, 10, 17, 9, 0, 0, DateTimeKind.Utc),
                    UpdatedBy = "System",
                },
                new CashflowType
                {
                    Id = 2,
                    Name = "Chi phí khác",
                    Code = "CTM",
                    IsPayment = true,
                    Description = "Chi phí khác",
                    IsActive = true,
                    CreatedAt = new DateTime(2025, 10, 17, 9, 0, 0, DateTimeKind.Utc),
                    CreatedBy = "System",
                    UpdatedAt = new DateTime(2025, 10, 17, 9, 0, 0, DateTimeKind.Utc),
                    UpdatedBy = "System",
                },
                new CashflowType
                {
                    Id = 3,
                    Name = "Thu tiền thuê sân",
                    Code = "TTTS",
                    IsPayment = false,
                    Description = "Thu từ khách hàng thuê sân cầu lông",
                    IsActive = true,
                    CreatedAt = new DateTime(2025, 10, 17, 9, 0, 0, DateTimeKind.Utc),
                    CreatedBy = "System",
                    UpdatedAt = new DateTime(2025, 10, 17, 9, 0, 0, DateTimeKind.Utc),
                    UpdatedBy = "System",
                },
                new CashflowType
                {
                    Id = 4,
                    Name = "Thu tiền bán hàng",
                    Code = "TTBH",
                    IsPayment = false,
                    Description = "Thu tiền từ việc bán hàng hóa, đồ uống",
                    IsActive = true,
                    CreatedAt = new DateTime(2025, 10, 17, 9, 0, 0, DateTimeKind.Utc),
                    CreatedBy = "System",
                    UpdatedAt = new DateTime(2025, 10, 17, 9, 0, 0, DateTimeKind.Utc),
                    UpdatedBy = "System",
                },
                new CashflowType
                {
                    Id = 5,
                    Name = "Chi mua hàng hóa",
                    Code = "CMHH",
                    IsPayment = true,
                    Description = "Chi để nhập hàng hóa, vật tư",
                    IsActive = true,
                    CreatedAt = new DateTime(2025, 10, 17, 9, 0, 0, DateTimeKind.Utc),
                    CreatedBy = "System",
                    UpdatedAt = new DateTime(2025, 10, 17, 9, 0, 0, DateTimeKind.Utc),
                    UpdatedBy = "System",
                },
                new CashflowType
                {
                    Id = 6,
                    Name = "Chi lương nhân viên",
                    Code = "CLNV",
                    IsPayment = true,
                    Description = "Chi trả lương cho nhân viên",
                    IsActive = true,
                    CreatedAt = new DateTime(2025, 10, 17, 9, 0, 0, DateTimeKind.Utc),
                    CreatedBy = "System",
                    UpdatedAt = new DateTime(2025, 10, 17, 9, 0, 0, DateTimeKind.Utc),
                    UpdatedBy = "System",
                }
            );

        // Voucher configurations
        builder.Entity<VoucherUserRule>(entity =>
        {
            entity.Property(v => v.SpecificCustomerIds).HasColumnType("integer[]");

            entity
                .HasOne(v => v.Membership)
                .WithMany()
                .HasForeignKey(v => v.MembershipId)
                .OnDelete(DeleteBehavior.SetNull);
        });
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

        // Normalize StockOut.OutTime to UTC
        foreach (
            var soEntry in ChangeTracker
                .Entries<StockOut>()
                .Where(e => e.State == EntityState.Added || e.State == EntityState.Modified)
        )
        {
            if (soEntry.Entity.OutTime.Kind != DateTimeKind.Utc)
            {
                soEntry.Entity.OutTime = DateTime.SpecifyKind(
                    soEntry.Entity.OutTime,
                    DateTimeKind.Utc
                );
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
