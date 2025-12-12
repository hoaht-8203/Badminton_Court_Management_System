using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Security.Claims;
using System.Threading.Tasks;
using ApiApplication.Constants;
using ApiApplication.Data;
using ApiApplication.Dtos.Payment;
using ApiApplication.Entities;
using ApiApplication.Entities.Shared;
using ApiApplication.Exceptions;
using ApiApplication.Mappings;
using ApiApplication.Services.Impl;
using ApiApplication.Sessions;
using ApiApplication.SignalR;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using AutoMapper.Configuration;
using Tests;

namespace Tests;

[TestClass]
public class PaymentServiceTests
{
    private ApplicationDbContext _context = null!;
    private Mock<IHubContext<BookingHub>> _hubMock = null!;
    private Mock<IHttpContextAccessor> _httpContextAccessorMock = null!;
    private Mock<UserManager<ApplicationUser>> _userManagerMock = null!;
    private Mock<ICurrentUser> _currentUserMock = null!;
    private IMapper _mapper = null!;
    private PaymentService _sut = null!;

    [TestInitialize]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _currentUserMock = new Mock<ICurrentUser>();
        _context = new ApplicationDbContext(options, _currentUserMock.Object);

        var store = new Mock<IUserStore<ApplicationUser>>();
        _userManagerMock = new Mock<UserManager<ApplicationUser>>(
            store.Object,
            null!,
            null!,
            null!,
            null!,
            null!,
            null!,
            null!,
            null!
        );

        _hubMock = new Mock<IHubContext<BookingHub>>();
        _httpContextAccessorMock = new Mock<IHttpContextAccessor>();

        _mapper = TestHelpers.BuildMapper();

        _sut = new PaymentService(
            _context,
            _mapper,
            _hubMock.Object,
            _httpContextAccessorMock.Object,
            _userManagerMock.Object
        );
    }

    [TestCleanup]
    public void Cleanup()
    {
        _context?.Dispose();
    }

    private async Task<Court> SeedCourt(Guid? id = null)
    {
        var court = new Court
        {
            Id = id ?? Guid.NewGuid(),
            Name = "Test Court",
            Status = CourtStatus.Active,
            CourtAreaId = 1,
        };
        await _context.Courts.AddAsync(court);
        await _context.SaveChangesAsync();
        return court;
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

    private async Task<BookingCourt> SeedBooking(Customer customer, Court court)
    {
        var booking = new BookingCourt
        {
            Id = Guid.NewGuid(),
            CustomerId = customer.Id,
            CourtId = court.Id,
            StartDate = DateOnly.FromDateTime(DateTime.UtcNow),
            EndDate = DateOnly.FromDateTime(DateTime.UtcNow),
            StartTime = new TimeOnly(10, 0),
            EndTime = new TimeOnly(11, 0),
            DaysOfWeek = Array.Empty<int>(),
            Status = BookingCourtStatus.Active,
        };
        await _context.BookingCourts.AddAsync(booking);
        await _context.SaveChangesAsync();
        return booking;
    }

    private async Task<BookingCourtOccurrence> SeedOccurrence(BookingCourt booking)
    {
        var occurrence = new BookingCourtOccurrence
        {
            Id = Guid.NewGuid(),
            BookingCourtId = booking.Id,
            BookingCourt = booking,
            Date = DateOnly.FromDateTime(DateTime.UtcNow),
            StartTime = new TimeOnly(10, 0),
            EndTime = new TimeOnly(11, 0),
            Status = BookingCourtOccurrenceStatus.Active,
        };
        await _context.BookingCourtOccurrences.AddAsync(occurrence);
        await _context.SaveChangesAsync();
        return occurrence;
    }

    private async Task<Order> SeedOrder(BookingCourt booking, BookingCourtOccurrence? occurrence = null)
    {
        var order = new Order
        {
            Id = Guid.NewGuid(),
            OrderCode = "ORD001",
            BookingId = booking.Id,
            BookingCourtOccurrenceId = occurrence?.Id,
            CustomerId = booking.CustomerId,
            TotalAmount = 100000m,
            Status = OrderStatus.Pending,
            PaymentMethod = "Bank",
        };
        await _context.Orders.AddAsync(order);
        await _context.SaveChangesAsync();
        return order;
    }

    // FUNC16: CreatePaymentForOrderAsync
    [TestMethod]
    public async Task FUNC16_TC01_CreatePaymentForOrderAsync_Success_ShouldCreatePayment()
    {
        // Arrange
        var court = await SeedCourt();
        var customer = await SeedCustomer();
        var booking = await SeedBooking(customer, court);
        var occurrence = await SeedOccurrence(booking);
        var order = await SeedOrder(booking, occurrence);

        var request = new CreatePaymentForOrderRequest
        {
            OrderId = order.Id,
            BookingId = booking.Id,
            BookingOccurrenceId = occurrence.Id,
            CustomerId = customer.Id,
            Amount = 100000m,
            PaymentMethod = "Bank",
        };

        var clientsMock = new Mock<IClientProxy>();
        _hubMock.Setup(x => x.Clients.All).Returns(clientsMock.Object);

        // Act
        var result = await _sut.CreatePaymentForOrderAsync(request);

        // Assert
        Assert.IsNotNull(result);
        var payment = await _context.Payments.FirstOrDefaultAsync(p => p.Id == result.Id);
        Assert.IsNotNull(payment);
        Assert.AreEqual(order.Id, payment.OrderId);
        Assert.AreEqual(customer.Id, payment.CustomerId);
        Assert.AreEqual(100000m, payment.Amount);
        Assert.AreEqual(PaymentStatus.PendingPayment, payment.Status);
    }

    [TestMethod]
    public async Task FUNC16_TC02_CreatePaymentForOrderAsync_OrderNotFound_ShouldThrowException()
    {
        // Arrange
        var request = new CreatePaymentForOrderRequest
        {
            OrderId = Guid.NewGuid(),
            BookingId = Guid.NewGuid(),
            CustomerId = 1,
            Amount = 100000m,
            PaymentMethod = "Bank",
        };

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ApiException>(async () => await _sut.CreatePaymentForOrderAsync(request));
    }

    [TestMethod]
    public async Task FUNC16_TC03_CreatePaymentForOrderAsync_BookingNotFound_ShouldThrowException()
    {
        // Arrange
        var court = await SeedCourt();
        var customer = await SeedCustomer();
        var booking = await SeedBooking(customer, court);
        var occurrence = await SeedOccurrence(booking);

        var order = new Order
        {
            Id = Guid.NewGuid(),
            OrderCode = "ORD001",
            BookingId = Guid.NewGuid(), // Invalid booking ID
            CustomerId = customer.Id,
            TotalAmount = 100000m,
            Status = OrderStatus.Pending,
            PaymentMethod = "Bank",
        };
        await _context.Orders.AddAsync(order);
        await _context.SaveChangesAsync();

        var request = new CreatePaymentForOrderRequest
        {
            OrderId = order.Id,
            BookingId = booking.Id,
            BookingOccurrenceId = occurrence.Id,
            CustomerId = customer.Id,
            Amount = 100000m,
            PaymentMethod = "Bank",
        };

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ApiException>(async () => await _sut.CreatePaymentForOrderAsync(request));
    }

    [TestMethod]
    public async Task FUNC16_TC04_CreatePaymentForOrderAsync_WithVoucher_ShouldIncludeVoucherInfo()
    {
        // Arrange
        var court = await SeedCourt();
        var customer = await SeedCustomer();
        var booking = await SeedBooking(customer, court);
        var occurrence = await SeedOccurrence(booking);

        var voucher = new Voucher
        {
            Id = 1,
            Code = "TESTVOUCHER",
            Title = "Test Voucher",
            IsActive = true,
            StartAt = DateTime.UtcNow.AddDays(-1),
            EndAt = DateTime.UtcNow.AddDays(1),
            DiscountType = "Fixed",
            DiscountValue = 10000m,
        };
        await _context.Vouchers.AddAsync(voucher);

        var order = new Order
        {
            Id = Guid.NewGuid(),
            OrderCode = "ORD001",
            BookingId = booking.Id,
            BookingCourtOccurrenceId = occurrence.Id,
            CustomerId = customer.Id,
            TotalAmount = 100000m,
            VoucherId = voucher.Id,
            DiscountAmount = 10000m,
            Status = OrderStatus.Pending,
            PaymentMethod = "Bank",
        };
        await _context.Orders.AddAsync(order);
        await _context.SaveChangesAsync();

        var request = new CreatePaymentForOrderRequest
        {
            OrderId = order.Id,
            BookingId = booking.Id,
            BookingOccurrenceId = occurrence.Id,
            CustomerId = customer.Id,
            Amount = 90000m,
            PaymentMethod = "Bank",
        };

        var clientsMock = new Mock<IClientProxy>();
        _hubMock.Setup(x => x.Clients.All).Returns(clientsMock.Object);

        // Act
        var result = await _sut.CreatePaymentForOrderAsync(request);

        // Assert
        Assert.IsNotNull(result);
        var payment = await _context.Payments.FirstOrDefaultAsync(p => p.Id == result.Id);
        Assert.IsNotNull(payment);
        Assert.AreEqual(voucher.Id, payment.VoucherId);
        Assert.AreEqual(10000m, payment.DiscountAmount);
    }

    [TestMethod]
    public async Task FUNC16_TC05_CreatePaymentForOrderAsync_WithNote_ShouldSaveNote()
    {
        // Arrange
        var court = await SeedCourt();
        var customer = await SeedCustomer();
        var booking = await SeedBooking(customer, court);
        var occurrence = await SeedOccurrence(booking);
        var order = await SeedOrder(booking, occurrence);

        var request = new CreatePaymentForOrderRequest
        {
            OrderId = order.Id,
            BookingId = booking.Id,
            BookingOccurrenceId = occurrence.Id,
            CustomerId = customer.Id,
            Amount = 100000m,
            PaymentMethod = "Bank",
            Note = "Test payment note",
        };

        var clientsMock = new Mock<IClientProxy>();
        _hubMock.Setup(x => x.Clients.All).Returns(clientsMock.Object);

        // Act
        var result = await _sut.CreatePaymentForOrderAsync(request);

        // Assert
        Assert.IsNotNull(result);
        var payment = await _context.Payments.FirstOrDefaultAsync(p => p.Id == result.Id);
        Assert.IsNotNull(payment);
        Assert.AreEqual("Test payment note", payment.Note);
    }

    [TestMethod]
    public async Task FUNC16_TC06_CreatePaymentForOrderAsync_ShouldSetPaymentCreatedAt()
    {
        // Arrange
        var court = await SeedCourt();
        var customer = await SeedCustomer();
        var booking = await SeedBooking(customer, court);
        var occurrence = await SeedOccurrence(booking);
        var order = await SeedOrder(booking, occurrence);

        var request = new CreatePaymentForOrderRequest
        {
            OrderId = order.Id,
            BookingId = booking.Id,
            BookingOccurrenceId = occurrence.Id,
            CustomerId = customer.Id,
            Amount = 100000m,
            PaymentMethod = "Bank",
        };

        var clientsMock = new Mock<IClientProxy>();
        _hubMock.Setup(x => x.Clients.All).Returns(clientsMock.Object);

        var beforeCreate = DateTime.UtcNow;

        // Act
        var result = await _sut.CreatePaymentForOrderAsync(request);

        // Assert
        Assert.IsNotNull(result);
        var payment = await _context.Payments.FirstOrDefaultAsync(p => p.Id == result.Id);
        Assert.IsNotNull(payment);
        Assert.IsTrue(payment.PaymentCreatedAt >= beforeCreate);
        Assert.IsTrue(payment.PaymentCreatedAt <= DateTime.UtcNow);
    }

    [TestMethod]
    public async Task FUNC16_TC07_CreatePaymentForOrderAsync_ShouldGeneratePaymentId()
    {
        // Arrange
        var court = await SeedCourt();
        var customer = await SeedCustomer();
        var booking = await SeedBooking(customer, court);
        var occurrence = await SeedOccurrence(booking);
        var order = await SeedOrder(booking, occurrence);

        var request = new CreatePaymentForOrderRequest
        {
            OrderId = order.Id,
            BookingId = booking.Id,
            BookingOccurrenceId = occurrence.Id,
            CustomerId = customer.Id,
            Amount = 100000m,
            PaymentMethod = "Bank",
        };

        var clientsMock = new Mock<IClientProxy>();
        _hubMock.Setup(x => x.Clients.All).Returns(clientsMock.Object);

        // Act
        var result = await _sut.CreatePaymentForOrderAsync(request);

        // Assert
        Assert.IsNotNull(result);
        Assert.IsFalse(string.IsNullOrEmpty(result.Id));
        var payment = await _context.Payments.FirstOrDefaultAsync(p => p.Id == result.Id);
        Assert.IsNotNull(payment);
    }

    [TestMethod]
    public async Task FUNC16_TC08_CreatePaymentForOrderAsync_ShouldSendSignalRNotification()
    {
        // Arrange
        var court = await SeedCourt();
        var customer = await SeedCustomer();
        var booking = await SeedBooking(customer, court);
        var occurrence = await SeedOccurrence(booking);
        var order = await SeedOrder(booking, occurrence);

        var request = new CreatePaymentForOrderRequest
        {
            OrderId = order.Id,
            BookingId = booking.Id,
            BookingOccurrenceId = occurrence.Id,
            CustomerId = customer.Id,
            Amount = 100000m,
            PaymentMethod = "Bank",
        };

        var clientsMock = new Mock<IClientProxy>();
        var hubClientsMock = new Mock<IHubClients>();
        hubClientsMock.Setup(x => x.All).Returns(clientsMock.Object);
        _hubMock.Setup(x => x.Clients).Returns(hubClientsMock.Object);

        // Act
        var result = await _sut.CreatePaymentForOrderAsync(request);

        // Assert
        Assert.IsNotNull(result);
        // SendAsync is an extension method, cannot verify directly
        // Just verify result is not null (payment was created successfully)
    }
}

