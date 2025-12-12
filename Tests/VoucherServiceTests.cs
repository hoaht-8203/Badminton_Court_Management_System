using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using ApiApplication.Constants;
using ApiApplication.Data;
using ApiApplication.Dtos.Voucher;
using ApiApplication.Entities;
using ApiApplication.Entities.Shared;
using ApiApplication.Exceptions;
using ApiApplication.Mappings;
using ApiApplication.Services.Impl;
using ApiApplication.Sessions;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using AutoMapper.Configuration;
using Tests;

namespace Tests;

[TestClass]
public class VoucherServiceTests
{
    private ApplicationDbContext _context = null!;
    private Mock<ICurrentUser> _currentUserMock = null!;
    private Mock<ILogger<VoucherService>> _loggerMock = null!;
    private IMapper _mapper = null!;
    private VoucherService _sut = null!;

    [TestInitialize]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _currentUserMock = new Mock<ICurrentUser>();
        _context = new ApplicationDbContext(options, _currentUserMock.Object);
        _loggerMock = new Mock<ILogger<VoucherService>>();

        _mapper = TestHelpers.BuildMapper();

        _sut = new VoucherService(
            _context,
            _mapper,
            _currentUserMock.Object,
            _loggerMock.Object
        );
    }

    [TestCleanup]
    public void Cleanup()
    {
        _context?.Dispose();
    }

    private async Task<Customer> SeedCustomer(int? id = null)
    {
        var customer = new Customer
        {
            Id = id ?? 1,
            FullName = "Test Customer",
            PhoneNumber = "0123456789",
            Email = "customer@test.com",
            Status = CustomerStatus.Active,
        };
        await _context.Customers.AddAsync(customer);
        await _context.SaveChangesAsync();
        return customer;
    }

    private async Task<Voucher> SeedVoucher(int? id = null, bool isActive = true, decimal? minOrderValue = null)
    {
        var voucher = new Voucher
        {
            Id = id ?? 1,
            Code = "TESTVOUCHER",
            Title = "Test Voucher",
            Description = "Test Description",
            DiscountType = "Fixed",
            DiscountValue = 10000m,
            StartAt = DateTime.UtcNow.AddDays(-1),
            EndAt = DateTime.UtcNow.AddDays(1),
            UsageLimitTotal = 100,
            UsageLimitPerUser = 5,
            UsedCount = 0,
            IsActive = isActive,
            MinOrderValue = minOrderValue,
            TimeRules = new List<VoucherTimeRule>(), // Ensure no time rules that could block validation
            UserRules = new List<VoucherUserRule>(), // Ensure no user rules that could block validation
        };
        await _context.Vouchers.AddAsync(voucher);
        await _context.SaveChangesAsync();
        return voucher;
    }

    private async Task<Order> SeedOrder(Customer customer, Guid? id = null)
    {
        var order = new Order
        {
            Id = id ?? Guid.NewGuid(),
            OrderCode = "ORD001",
            CustomerId = customer.Id,
            TotalAmount = 100000m,
            Status = OrderStatus.Pending,
            PaymentMethod = "Bank",
            BookingId = Guid.NewGuid(),
        };
        await _context.Orders.AddAsync(order);
        await _context.SaveChangesAsync();
        return order;
    }

    // FUNC17: ValidateAndCalculateDiscountAsync
    [TestMethod]
    public async Task FUNC17_TC01_ValidateAndCalculateDiscountAsync_Success_ShouldReturnValidResponse()
    {
        // Arrange
        var customer = await SeedCustomer();
        var voucher = await SeedVoucher();

        var request = new ValidateVoucherRequest
        {
            VoucherId = voucher.Id,
            OrderTotalAmount = 100000m,
        };

        // Act
        var result = await _sut.ValidateAndCalculateDiscountAsync(request, customer.Id);

        // Assert
        Assert.IsNotNull(result);
        Assert.IsTrue(result.IsValid);
        Assert.AreEqual(10000m, result.DiscountAmount);
        Assert.AreEqual(90000m, result.FinalAmount);
    }

    [TestMethod]
    public async Task FUNC17_TC02_ValidateAndCalculateDiscountAsync_VoucherNotFound_ShouldReturnInvalid()
    {
        // Arrange
        var customer = await SeedCustomer();
        var request = new ValidateVoucherRequest
        {
            VoucherId = 999,
            OrderTotalAmount = 100000m,
        };

        // Act
        var result = await _sut.ValidateAndCalculateDiscountAsync(request, customer.Id);

        // Assert
        Assert.IsNotNull(result);
        Assert.IsFalse(result.IsValid);
        Assert.IsNotNull(result.ErrorMessage);
    }

    [TestMethod]
    public async Task FUNC17_TC03_ValidateAndCalculateDiscountAsync_VoucherInactive_ShouldReturnInvalid()
    {
        // Arrange
        var customer = await SeedCustomer();
        var voucher = await SeedVoucher(isActive: false);

        var request = new ValidateVoucherRequest
        {
            VoucherId = voucher.Id,
            OrderTotalAmount = 100000m,
        };

        // Act
        var result = await _sut.ValidateAndCalculateDiscountAsync(request, customer.Id);

        // Assert
        Assert.IsNotNull(result);
        Assert.IsFalse(result.IsValid);
        Assert.IsNotNull(result.ErrorMessage);
    }

    [TestMethod]
    public async Task FUNC17_TC04_ValidateAndCalculateDiscountAsync_OrderAmountBelowMin_ShouldReturnInvalid()
    {
        // Arrange
        var customer = await SeedCustomer();
        var voucher = await SeedVoucher(minOrderValue: 200000m);

        var request = new ValidateVoucherRequest
        {
            VoucherId = voucher.Id,
            OrderTotalAmount = 100000m,
        };

        // Act
        var result = await _sut.ValidateAndCalculateDiscountAsync(request, customer.Id);

        // Assert
        Assert.IsNotNull(result);
        Assert.IsFalse(result.IsValid);
        Assert.IsNotNull(result.ErrorMessage);
    }

    [TestMethod]
    public async Task FUNC17_TC05_ValidateAndCalculateDiscountAsync_VoucherExpired_ShouldReturnInvalid()
    {
        // Arrange
        var customer = await SeedCustomer();
        var voucher = new Voucher
        {
            Id = 1,
            Code = "EXPIRED",
            Title = "Expired Voucher",
            DiscountType = "Fixed",
            DiscountValue = 10000m,
            StartAt = DateTime.UtcNow.AddDays(-10),
            EndAt = DateTime.UtcNow.AddDays(-1),
            UsageLimitTotal = 100,
            UsageLimitPerUser = 5,
            UsedCount = 0,
            IsActive = true,
        };
        await _context.Vouchers.AddAsync(voucher);
        await _context.SaveChangesAsync();

        var request = new ValidateVoucherRequest
        {
            VoucherId = voucher.Id,
            OrderTotalAmount = 100000m,
        };

        // Act
        var result = await _sut.ValidateAndCalculateDiscountAsync(request, customer.Id);

        // Assert
        Assert.IsNotNull(result);
        Assert.IsFalse(result.IsValid);
        Assert.IsNotNull(result.ErrorMessage);
    }

    [TestMethod]
    public async Task FUNC17_TC06_ValidateAndCalculateDiscountAsync_UsageLimitReached_ShouldReturnInvalid()
    {
        // Arrange
        var customer = await SeedCustomer();
        var voucher = await SeedVoucher();
        voucher.UsedCount = voucher.UsageLimitTotal;
        _context.Vouchers.Update(voucher);
        await _context.SaveChangesAsync();

        var request = new ValidateVoucherRequest
        {
            VoucherId = voucher.Id,
            OrderTotalAmount = 100000m,
        };

        // Act
        var result = await _sut.ValidateAndCalculateDiscountAsync(request, customer.Id);

        // Assert
        Assert.IsNotNull(result);
        Assert.IsFalse(result.IsValid);
        Assert.IsNotNull(result.ErrorMessage);
    }

    [TestMethod]
    public async Task FUNC17_TC07_ValidateAndCalculateDiscountAsync_PercentageDiscount_ShouldCalculateCorrectly()
    {
        // Arrange
        var customer = await SeedCustomer();
        var voucher = new Voucher
        {
            Id = 1,
            Code = "PERCENT10",
            Title = "10% Discount",
            DiscountType = "Percentage",
            DiscountPercentage = 10,
            MaxDiscountValue = 50000m,
            StartAt = DateTime.UtcNow.AddDays(-1),
            EndAt = DateTime.UtcNow.AddDays(1),
            UsageLimitTotal = 100,
            UsageLimitPerUser = 5,
            UsedCount = 0,
            IsActive = true,
        };
        await _context.Vouchers.AddAsync(voucher);
        await _context.SaveChangesAsync();

        var request = new ValidateVoucherRequest
        {
            VoucherId = voucher.Id,
            OrderTotalAmount = 100000m,
        };

        // Act
        var result = await _sut.ValidateAndCalculateDiscountAsync(request, customer.Id);

        // Assert
        Assert.IsNotNull(result);
        Assert.IsTrue(result.IsValid);
        Assert.AreEqual(10000m, result.DiscountAmount); // 10% of 100000
        Assert.AreEqual(90000m, result.FinalAmount);
    }

    [TestMethod]
    public async Task FUNC17_TC08_ValidateAndCalculateDiscountAsync_PercentageWithMaxDiscount_ShouldCapAtMax()
    {
        // Arrange
        var customer = await SeedCustomer();
        var voucher = new Voucher
        {
            Id = 1,
            Code = "PERCENT20MAX50K",
            Title = "20% Discount Max 50K",
            DiscountType = "Percentage",
            DiscountPercentage = 20,
            MaxDiscountValue = 50000m,
            StartAt = DateTime.UtcNow.AddDays(-1),
            EndAt = DateTime.UtcNow.AddDays(1),
            UsageLimitTotal = 100,
            UsageLimitPerUser = 5,
            UsedCount = 0,
            IsActive = true,
        };
        await _context.Vouchers.AddAsync(voucher);
        await _context.SaveChangesAsync();

        var request = new ValidateVoucherRequest
        {
            VoucherId = voucher.Id,
            OrderTotalAmount = 500000m, // 20% would be 100000, but max is 50000
        };

        // Act
        var result = await _sut.ValidateAndCalculateDiscountAsync(request, customer.Id);

        // Assert
        Assert.IsNotNull(result);
        Assert.IsTrue(result.IsValid);
        Assert.AreEqual(50000m, result.DiscountAmount); // Capped at max
        Assert.AreEqual(450000m, result.FinalAmount);
    }

    // FUNC18: RecordVoucherUsageAsync
    [TestMethod]
    public async Task FUNC18_TC01_RecordVoucherUsageAsync_Success_ShouldCreateUsageRecord()
    {
        // Arrange
        var customer = await SeedCustomer();
        var voucher = await SeedVoucher();
        var order = await SeedOrder(customer);

        var initialUsedCount = voucher.UsedCount;

        // Act
        await _sut.RecordVoucherUsageAsync(voucher.Id, customer.Id, order.Id, 10000m);

        // Assert
        var usage = await _context.VoucherUsages.FirstOrDefaultAsync(u =>
            u.VoucherId == voucher.Id && u.CustomerId == customer.Id
        );
        Assert.IsNotNull(usage);
        Assert.AreEqual(10000m, usage.DiscountApplied);
        Assert.IsNotNull(usage.UsedAt);

        var updatedVoucher = await _context.Vouchers.FindAsync(voucher.Id);
        Assert.IsNotNull(updatedVoucher);
        Assert.AreEqual(initialUsedCount + 1, updatedVoucher.UsedCount);
    }

    [TestMethod]
    public async Task FUNC18_TC02_RecordVoucherUsageAsync_MultipleUsages_ShouldIncrementCount()
    {
        // Arrange
        var customer = await SeedCustomer();
        var voucher = await SeedVoucher();
        var order1 = await SeedOrder(customer);
        var order2 = await SeedOrder(customer, Guid.NewGuid());

        // Act
        await _sut.RecordVoucherUsageAsync(voucher.Id, customer.Id, order1.Id, 10000m);
        await _sut.RecordVoucherUsageAsync(voucher.Id, customer.Id, order2.Id, 10000m);

        // Assert
        var usages = await _context.VoucherUsages.Where(u =>
            u.VoucherId == voucher.Id && u.CustomerId == customer.Id
        ).ToListAsync();
        Assert.AreEqual(2, usages.Count);

        var updatedVoucher = await _context.Vouchers.FindAsync(voucher.Id);
        Assert.IsNotNull(updatedVoucher);
        Assert.AreEqual(2, updatedVoucher.UsedCount);
    }

    [TestMethod]
    public async Task FUNC18_TC03_RecordVoucherUsageAsync_DifferentCustomers_ShouldCreateSeparateRecords()
    {
        // Arrange
        var customer1 = await SeedCustomer(1);
        var customer2 = await SeedCustomer(2);
        var voucher = await SeedVoucher();
        var order1 = await SeedOrder(customer1);
        var order2 = await SeedOrder(customer2, Guid.NewGuid());

        // Act
        await _sut.RecordVoucherUsageAsync(voucher.Id, customer1.Id, order1.Id, 10000m);
        await _sut.RecordVoucherUsageAsync(voucher.Id, customer2.Id, order2.Id, 15000m);

        // Assert
        var usage1 = await _context.VoucherUsages.FirstOrDefaultAsync(u =>
            u.VoucherId == voucher.Id && u.CustomerId == customer1.Id
        );
        var usage2 = await _context.VoucherUsages.FirstOrDefaultAsync(u =>
            u.VoucherId == voucher.Id && u.CustomerId == customer2.Id
        );

        Assert.IsNotNull(usage1);
        Assert.IsNotNull(usage2);
        Assert.AreEqual(10000m, usage1.DiscountApplied);
        Assert.AreEqual(15000m, usage2.DiscountApplied);

        var updatedVoucher = await _context.Vouchers.FindAsync(voucher.Id);
        Assert.IsNotNull(updatedVoucher);
        Assert.AreEqual(2, updatedVoucher.UsedCount);
    }

    [TestMethod]
    public async Task FUNC18_TC04_RecordVoucherUsageAsync_ShouldSetUsedAtTimestamp()
    {
        // Arrange
        var customer = await SeedCustomer();
        var voucher = await SeedVoucher();
        var order = await SeedOrder(customer);

        var beforeRecord = DateTime.UtcNow;

        // Act
        await _sut.RecordVoucherUsageAsync(voucher.Id, customer.Id, order.Id, 10000m);

        // Assert
        var usage = await _context.VoucherUsages.FirstOrDefaultAsync(u =>
            u.VoucherId == voucher.Id && u.CustomerId == customer.Id
        );
        Assert.IsNotNull(usage);
        Assert.IsTrue(usage.UsedAt >= beforeRecord);
        Assert.IsTrue(usage.UsedAt <= DateTime.UtcNow);
    }

    [TestMethod]
    public async Task FUNC18_TC05_RecordVoucherUsageAsync_WithZeroDiscount_ShouldStillRecord()
    {
        // Arrange
        var customer = await SeedCustomer();
        var voucher = await SeedVoucher();
        var order = await SeedOrder(customer);

        // Act
        await _sut.RecordVoucherUsageAsync(voucher.Id, customer.Id, order.Id, 0m);

        // Assert
        var usage = await _context.VoucherUsages.FirstOrDefaultAsync(u =>
            u.VoucherId == voucher.Id && u.CustomerId == customer.Id
        );
        Assert.IsNotNull(usage);
        Assert.AreEqual(0m, usage.DiscountApplied);

        var updatedVoucher = await _context.Vouchers.FindAsync(voucher.Id);
        Assert.IsNotNull(updatedVoucher);
        Assert.AreEqual(1, updatedVoucher.UsedCount);
    }

    [TestMethod]
    public async Task FUNC18_TC06_RecordVoucherUsageAsync_VoucherNotFound_ShouldStillIncrement()
    {
        // Arrange
        var customer = await SeedCustomer();
        var order = await SeedOrder(customer);
        var nonExistentVoucherId = 999;

        // Act
        await _sut.RecordVoucherUsageAsync(nonExistentVoucherId, customer.Id, order.Id, 10000m);

        // Assert
        var usage = await _context.VoucherUsages.FirstOrDefaultAsync(u =>
            u.VoucherId == nonExistentVoucherId && u.CustomerId == customer.Id
        );
        Assert.IsNotNull(usage);
        // Voucher not found, so UsedCount won't increment, but usage record is still created
    }
}

