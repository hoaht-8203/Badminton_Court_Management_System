using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using ApiApplication.Constants;
using ApiApplication.Data;
using ApiApplication.Dtos.Order;
using ApiApplication.Dtos.Payment;
using ApiApplication.Dtos.Voucher;
using ApiApplication.Entities;
using ApiApplication.Entities.Shared;
using ApiApplication.Exceptions;
using ApiApplication.Mappings;
using ApiApplication.Services;
using ApiApplication.Services.Impl;
using ApiApplication.Sessions;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using AutoMapper.Configuration;
using Tests;

namespace Tests;

[TestClass]
public class OrderServiceTests
{
    private ApplicationDbContext _context = null!;
    private Mock<IPaymentService> _paymentServiceMock = null!;
    private Mock<IConfiguration> _configurationMock = null!;
    private Mock<IVoucherService> _voucherServiceMock = null!;
    private Mock<ICurrentUser> _currentUserMock = null!;
    private IMapper _mapper = null!;
    private OrderService _sut = null!;

    [TestInitialize]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _currentUserMock = new Mock<ICurrentUser>();
        _context = new ApplicationDbContext(options, _currentUserMock.Object);

        _paymentServiceMock = new Mock<IPaymentService>();
        _configurationMock = new Mock<IConfiguration>();
        _voucherServiceMock = new Mock<IVoucherService>();

        _mapper = TestHelpers.BuildMapper();

        _sut = new OrderService(
            _context,
            _mapper,
            _paymentServiceMock.Object,
            _configurationMock.Object,
            _voucherServiceMock.Object
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

    private async Task<BookingCourtOccurrence> SeedOccurrence(BookingCourt booking, string status = BookingCourtOccurrenceStatus.CheckedIn)
    {
        var occurrence = new BookingCourtOccurrence
        {
            Id = Guid.NewGuid(),
            BookingCourtId = booking.Id,
            BookingCourt = booking,
            Date = DateOnly.FromDateTime(DateTime.UtcNow),
            StartTime = new TimeOnly(10, 0),
            EndTime = new TimeOnly(11, 0),
            Status = status,
        };
        await _context.BookingCourtOccurrences.AddAsync(occurrence);
        await _context.SaveChangesAsync();
        return occurrence;
    }

    // FUNC14: CheckoutAsync
    [TestMethod]
    public async Task FUNC14_TC01_CheckoutAsync_Success_ShouldCreateOrder()
    {
        // Arrange
        var court = await SeedCourt();
        var customer = await SeedCustomer();
        var booking = await SeedBooking(customer, court);
        var occurrence = await SeedOccurrence(booking, BookingCourtOccurrenceStatus.CheckedIn);

        var request = new CheckoutBookingRequest
        {
            BookingCourtOccurrenceId = occurrence.Id,
            PaymentMethod = "Cash",
            LateFeePercentage = 150m,
        };

        _paymentServiceMock.Setup(x => x.CreatePaymentForOrderAsync(It.IsAny<CreatePaymentForOrderRequest>()))
            .ReturnsAsync(new DetailPaymentResponse { Id = Guid.NewGuid().ToString() });
        _configurationMock.Setup(x => x["Booking:HoldMinutes"]).Returns("5");

        // Act
        var result = await _sut.CheckoutAsync(request);

        // Assert
        Assert.IsNotNull(result);
        var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == result.OrderId);
        Assert.IsNotNull(order);
        Assert.AreEqual(OrderStatus.Paid, order.Status);
    }

    [TestMethod]
    public async Task FUNC14_TC02_CheckoutAsync_OccurrenceNotFound_ShouldThrowException()
    {
        // Arrange
        var request = new CheckoutBookingRequest
        {
            BookingCourtOccurrenceId = Guid.NewGuid(),
            PaymentMethod = "Cash",
        };

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ApiException>(async () => await _sut.CheckoutAsync(request));
    }

    [TestMethod]
    public async Task FUNC14_TC03_CheckoutAsync_NotCheckedIn_ShouldThrowException()
    {
        // Arrange
        var court = await SeedCourt();
        var customer = await SeedCustomer();
        var booking = await SeedBooking(customer, court);
        var occurrence = await SeedOccurrence(booking, BookingCourtOccurrenceStatus.Active);

        var request = new CheckoutBookingRequest
        {
            BookingCourtOccurrenceId = occurrence.Id,
            PaymentMethod = "Cash",
        };

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ApiException>(async () => await _sut.CheckoutAsync(request));
    }

    [TestMethod]
    public async Task FUNC14_TC04_CheckoutAsync_WithVoucher_ShouldApplyDiscount()
    {
        // Arrange
        var court = await SeedCourt();
        var customer = await SeedCustomer();
        var booking = await SeedBooking(customer, court);
        var occurrence = await SeedOccurrence(booking, BookingCourtOccurrenceStatus.CheckedIn);

        var request = new CheckoutBookingRequest
        {
            BookingCourtOccurrenceId = occurrence.Id,
            PaymentMethod = "Cash",
            VoucherId = 1,
        };

        _voucherServiceMock.Setup(x => x.ValidateAndCalculateDiscountAsync(It.IsAny<ValidateVoucherRequest>(), It.IsAny<int>()))
            .ReturnsAsync(new ValidateVoucherResponse { IsValid = true, DiscountAmount = 10000m });
        _paymentServiceMock.Setup(x => x.CreatePaymentForOrderAsync(It.IsAny<CreatePaymentForOrderRequest>()))
            .ReturnsAsync(new DetailPaymentResponse { Id = Guid.NewGuid().ToString() });
        _configurationMock.Setup(x => x["Booking:HoldMinutes"]).Returns("5");

        // Act
        var result = await _sut.CheckoutAsync(request);

        // Assert
        Assert.IsNotNull(result);
        Assert.IsTrue(result.DiscountAmount > 0);
        _voucherServiceMock.Verify(x => x.ValidateAndCalculateDiscountAsync(It.IsAny<ValidateVoucherRequest>(), customer.Id), Times.Once);
    }

    [TestMethod]
    public async Task FUNC14_TC05_CheckoutAsync_InvalidVoucher_ShouldThrowException()
    {
        // Arrange
        var court = await SeedCourt();
        var customer = await SeedCustomer();
        var booking = await SeedBooking(customer, court);
        var occurrence = await SeedOccurrence(booking, BookingCourtOccurrenceStatus.CheckedIn);

        var request = new CheckoutBookingRequest
        {
            BookingCourtOccurrenceId = occurrence.Id,
            PaymentMethod = "Cash",
            VoucherId = 1,
        };

        _voucherServiceMock.Setup(x => x.ValidateAndCalculateDiscountAsync(It.IsAny<ValidateVoucherRequest>(), It.IsAny<int>()))
            .ReturnsAsync(new ValidateVoucherResponse { IsValid = false, ErrorMessage = "Voucher không hợp lệ" });

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ApiException>(async () => await _sut.CheckoutAsync(request));
    }

    [TestMethod]
    public async Task FUNC14_TC06_CheckoutAsync_BankPayment_ShouldCreatePendingOrder()
    {
        // Arrange
        var court = await SeedCourt();
        var customer = await SeedCustomer();
        var booking = await SeedBooking(customer, court);
        var occurrence = await SeedOccurrence(booking, BookingCourtOccurrenceStatus.CheckedIn);

        var request = new CheckoutBookingRequest
        {
            BookingCourtOccurrenceId = occurrence.Id,
            PaymentMethod = "Bank",
        };

        _paymentServiceMock.Setup(x => x.CreatePaymentForOrderAsync(It.IsAny<CreatePaymentForOrderRequest>()))
            .ReturnsAsync(new DetailPaymentResponse { Id = Guid.NewGuid().ToString() });
        _configurationMock.Setup(x => x["Booking:HoldMinutes"]).Returns("5");

        // Act
        var result = await _sut.CheckoutAsync(request);

        // Assert
        Assert.IsNotNull(result);
        var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == result.OrderId);
        Assert.IsNotNull(order);
        Assert.AreEqual(OrderStatus.Pending, order.Status);
        Assert.IsNotNull(result.QrUrl);
    }

    [TestMethod]
    public async Task FUNC14_TC07_CheckoutAsync_WithOrderItems_ShouldIncludeItemsInTotal()
    {
        // Arrange
        var court = await SeedCourt();
        var customer = await SeedCustomer();
        var booking = await SeedBooking(customer, court);
        var occurrence = await SeedOccurrence(booking, BookingCourtOccurrenceStatus.CheckedIn);

        var product = new Product
        {
            Id = 1,
            Name = "Test Product",
            SalePrice = 50000m,
            IsActive = true,
        };
        await _context.Products.AddAsync(product);

        var orderItem = new BookingOrderItem
        {
            Id = Guid.NewGuid(),
            BookingCourtOccurrenceId = occurrence.Id,
            ProductId = product.Id,
            Quantity = 2,
            UnitPrice = 50000m,
            TotalPrice = 100000m,
        };
        await _context.BookingOrderItems.AddAsync(orderItem);
        await _context.SaveChangesAsync();

        var request = new CheckoutBookingRequest
        {
            BookingCourtOccurrenceId = occurrence.Id,
            PaymentMethod = "Cash",
        };

        _paymentServiceMock.Setup(x => x.CreatePaymentForOrderAsync(It.IsAny<CreatePaymentForOrderRequest>()))
            .ReturnsAsync(new DetailPaymentResponse { Id = Guid.NewGuid().ToString() });
        _configurationMock.Setup(x => x["Booking:HoldMinutes"]).Returns("5");

        // Act
        var result = await _sut.CheckoutAsync(request);

        // Assert
        Assert.IsNotNull(result);
        Assert.IsTrue(result.ItemsSubtotal > 0);
    }

    // FUNC15: ExtendPaymentTimeAsync
    [TestMethod]
    public async Task FUNC15_TC01_ExtendPaymentTimeAsync_Success_ShouldExtendPayment()
    {
        // Arrange
        var court = await SeedCourt();
        var customer = await SeedCustomer();
        var booking = await SeedBooking(customer, court);

        var order = new Order
        {
            Id = Guid.NewGuid(),
            OrderCode = "ORD001",
            BookingId = booking.Id,
            CustomerId = customer.Id,
            Status = OrderStatus.Cancelled,
            PaymentMethod = "Bank",
            TotalAmount = 100000m,
        };
        await _context.Orders.AddAsync(order);

        var payment = new Payment
        {
            Id = Guid.NewGuid().ToString(),
            BookingId = booking.Id,
            OrderId = order.Id,
            CustomerId = customer.Id,
            Amount = 100000m,
            Status = PaymentStatus.Cancelled,
            PaymentCreatedAt = DateTime.UtcNow.AddMinutes(-10),
        };
        await _context.Payments.AddAsync(payment);
        order.Payments.Add(payment);
        await _context.SaveChangesAsync();

        // Act
        var result = await _sut.ExtendPaymentTimeAsync(order.Id);

        // Assert
        Assert.IsTrue(result);
        var updatedOrder = await _context.Orders.FindAsync(order.Id);
        Assert.IsNotNull(updatedOrder);
        Assert.AreEqual(OrderStatus.Pending, updatedOrder.Status);
        var updatedPayment = await _context.Payments.FindAsync(payment.Id);
        Assert.IsNotNull(updatedPayment);
        Assert.AreEqual(PaymentStatus.PendingPayment, updatedPayment.Status);
    }

    [TestMethod]
    public async Task FUNC15_TC02_ExtendPaymentTimeAsync_OrderNotFound_ShouldThrowException()
    {
        // Arrange
        var orderId = Guid.NewGuid();

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ApiException>(async () => await _sut.ExtendPaymentTimeAsync(orderId));
    }

    [TestMethod]
    public async Task FUNC15_TC03_ExtendPaymentTimeAsync_OrderNotCancelled_ShouldThrowException()
    {
        // Arrange
        var court = await SeedCourt();
        var customer = await SeedCustomer();
        var booking = await SeedBooking(customer, court);

        var order = new Order
        {
            Id = Guid.NewGuid(),
            OrderCode = "ORD001",
            BookingId = booking.Id,
            CustomerId = customer.Id,
            Status = OrderStatus.Pending,
            PaymentMethod = "Bank",
            TotalAmount = 100000m,
        };
        await _context.Orders.AddAsync(order);
        await _context.SaveChangesAsync();

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ApiException>(async () => await _sut.ExtendPaymentTimeAsync(order.Id));
    }

    [TestMethod]
    public async Task FUNC15_TC04_ExtendPaymentTimeAsync_WithMultiplePayments_ShouldUpdateAllPayments()
    {
        // Arrange
        var court = await SeedCourt();
        var customer = await SeedCustomer();
        var booking = await SeedBooking(customer, court);

        var order = new Order
        {
            Id = Guid.NewGuid(),
            OrderCode = "ORD001",
            BookingId = booking.Id,
            CustomerId = customer.Id,
            Status = OrderStatus.Cancelled,
            PaymentMethod = "Bank",
            TotalAmount = 200000m,
        };
        await _context.Orders.AddAsync(order);

        var payment1 = new Payment
        {
            Id = Guid.NewGuid().ToString(),
            BookingId = booking.Id,
            OrderId = order.Id,
            CustomerId = customer.Id,
            Amount = 100000m,
            Status = PaymentStatus.Cancelled,
            PaymentCreatedAt = DateTime.UtcNow.AddMinutes(-10),
        };
        var payment2 = new Payment
        {
            Id = Guid.NewGuid().ToString(),
            BookingId = booking.Id,
            OrderId = order.Id,
            CustomerId = customer.Id,
            Amount = 100000m,
            Status = PaymentStatus.Cancelled,
            PaymentCreatedAt = DateTime.UtcNow.AddMinutes(-10),
        };
        await _context.Payments.AddAsync(payment1);
        await _context.Payments.AddAsync(payment2);
        order.Payments.Add(payment1);
        order.Payments.Add(payment2);
        await _context.SaveChangesAsync();

        // Act
        var result = await _sut.ExtendPaymentTimeAsync(order.Id);

        // Assert
        Assert.IsTrue(result);
        var payments = await _context.Payments.Where(p => p.OrderId == order.Id).ToListAsync();
        Assert.AreEqual(2, payments.Count);
        Assert.IsTrue(payments.All(p => p.Status == PaymentStatus.PendingPayment));
    }

    [TestMethod]
    public async Task FUNC15_TC05_ExtendPaymentTimeAsync_ShouldResetPaymentCreatedAt()
    {
        // Arrange
        var court = await SeedCourt();
        var customer = await SeedCustomer();
        var booking = await SeedBooking(customer, court);

        var oldCreatedAt = DateTime.UtcNow.AddMinutes(-30);
        var order = new Order
        {
            Id = Guid.NewGuid(),
            OrderCode = "ORD001",
            BookingId = booking.Id,
            CustomerId = customer.Id,
            Status = OrderStatus.Cancelled,
            PaymentMethod = "Bank",
            TotalAmount = 100000m,
        };
        await _context.Orders.AddAsync(order);

        var payment = new Payment
        {
            Id = Guid.NewGuid().ToString(),
            BookingId = booking.Id,
            OrderId = order.Id,
            CustomerId = customer.Id,
            Amount = 100000m,
            Status = PaymentStatus.Cancelled,
            PaymentCreatedAt = oldCreatedAt,
        };
        await _context.Payments.AddAsync(payment);
        order.Payments.Add(payment);
        await _context.SaveChangesAsync();

        // Act
        await _sut.ExtendPaymentTimeAsync(order.Id);

        // Assert
        var updatedPayment = await _context.Payments.FindAsync(payment.Id);
        Assert.IsNotNull(updatedPayment);
        Assert.IsTrue(updatedPayment.PaymentCreatedAt > oldCreatedAt);
    }
}

