using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Security.Claims;
using System.Threading.Tasks;
using ApiApplication.Constants;
using ApiApplication.Data;
using ApiApplication.Dtos.BookingCourt;
using ApiApplication.Dtos.Payment;
using ApiApplication.Dtos.Voucher;
using ApiApplication.Entities;
using ApiApplication.Entities.Shared;
using ApiApplication.Exceptions;
using ApiApplication.Mappings;
using ApiApplication.Processors;
using ApiApplication.Services;
using ApiApplication.Services.Impl;
using ApiApplication.Sessions;
using ApiApplication.SignalR;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using AutoMapper.Configuration;
using Tests;

namespace Tests;

[TestClass]
public class BookingCourtServiceTests
{
    private ApplicationDbContext _context = null!;
    private Mock<UserManager<ApplicationUser>> _userManagerMock = null!;
    private Mock<IPaymentService> _paymentServiceMock = null!;
    private Mock<IConfiguration> _configurationMock = null!;
    private IConfiguration _configuration = null!;
    private Mock<IHubContext<BookingHub>> _hubMock = null!;
    private Mock<INotificationService> _notificationServiceMock = null!;
    private Mock<IVoucherService> _voucherServiceMock = null!;
    private Mock<IHttpContextAccessor> _httpContextAccessorMock = null!;
    private Mock<ICurrentUser> _currentUserMock = null!;
    private IMapper _mapper = null!;
    private BookingCourtService _sut = null!;

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

        _paymentServiceMock = new Mock<IPaymentService>();
        _configurationMock = new Mock<IConfiguration>();
        
        // Create a real IConfiguration instead of mock for GetValue extension method
        var configurationBuilder = new Microsoft.Extensions.Configuration.ConfigurationBuilder();
        configurationBuilder.AddInMemoryCollection(new Dictionary<string, string?>
        {
            { "Booking:HoldMinutes", "5" }
        });
        _configuration = configurationBuilder.Build();
        
        _hubMock = new Mock<IHubContext<BookingHub>>();
        _notificationServiceMock = new Mock<INotificationService>();
        _voucherServiceMock = new Mock<IVoucherService>();
        _httpContextAccessorMock = new Mock<IHttpContextAccessor>();

        _mapper = TestHelpers.BuildMapper();

        _sut = new BookingCourtService(
            _context,
            _mapper,
            _paymentServiceMock.Object,
            _configuration, // Use real configuration for GetValue extension method
            _hubMock.Object,
            _notificationServiceMock.Object,
            _voucherServiceMock.Object,
            _httpContextAccessorMock.Object,
            _userManagerMock.Object,
            _currentUserMock.Object
        );
    }

    [TestCleanup]
    public void Cleanup()
    {
        _context?.Dispose();
    }

    private async Task<Court> SeedCourt(Guid? id = null, string status = CourtStatus.Active)
    {
        var court = new Court
        {
            Id = id ?? Guid.NewGuid(),
            Name = "Test Court",
            Status = status,
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

    private async Task<CourtPricingRules> SeedPricingRule(Guid courtId, int[]? daysOfWeek = null)
    {
        // Ensure court exists before creating pricing rule
        var court = await _context.Courts.FindAsync(courtId);
        if (court == null)
        {
            throw new InvalidOperationException($"Court with id {courtId} not found");
        }
        
        var rule = new CourtPricingRules
        {
            Id = Guid.NewGuid(),
            CourtId = courtId,
            Court = court,
            DaysOfWeek = daysOfWeek ?? new[] { 2, 3, 4, 5, 6 },
            StartTime = new TimeOnly(6, 0),
            EndTime = new TimeOnly(22, 0),
            PricePerHour = 100000m,
            Order = 1,
        };
        await _context.CourtPricingRules.AddAsync(rule);
        await _context.SaveChangesAsync();
        return rule;
    }

    private async Task<ApplicationUser> SeedUser(Guid? id = null)
    {
        var user = new ApplicationUser
        {
            Id = id ?? Guid.NewGuid(),
            Email = "user@test.com",
            UserName = "testuser",
            FullName = "Test User",
            Status = ApplicationUserStatus.Active,
            UserTokens = new List<ApplicationUserToken>(),
        };
        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();
        return user;
    }

    // FUNC06: CreateBookingCourtAsync
    [TestMethod]
    public async Task FUNC06_TC01_CreateBookingCourtAsync_Success_ShouldCreateBooking()
    {
        // Arrange
        var court = await SeedCourt();
        var customer = await SeedCustomer();
        // Seed pricing rule for tomorrow's day of week (convert to custom format: Monday=2..Sunday=8)
        var tomorrow = DateTime.UtcNow.AddDays(1).Date;
        var dayOfWeekEnum = tomorrow.DayOfWeek; // Sunday=0..Saturday=6
        var customDayOfWeek = dayOfWeekEnum == DayOfWeek.Sunday ? 8 : (int)dayOfWeekEnum + 1; // Monday=2..Sunday=8
        await SeedPricingRule(court.Id, daysOfWeek: new[] { customDayOfWeek });
        var request = new CreateBookingCourtRequest
        {
            CustomerId = customer.Id,
            CourtId = court.Id,
            StartDate = tomorrow,
            EndDate = tomorrow,
            StartTime = new TimeOnly(10, 0),
            EndTime = new TimeOnly(11, 0),
            DaysOfWeek = null,
            PaymentMethod = "Cash",
        };

        _configurationMock.Setup(x => x["Booking:HoldMinutes"]).Returns("5");
        _paymentServiceMock.Setup(x => x.CreatePaymentAsync(It.IsAny<CreatePaymentRequest>()))
            .ReturnsAsync(new DetailPaymentResponse { Id = Guid.NewGuid().ToString() });
        
        // Setup hub mock for SignalR
        var clientsMock = new Mock<IClientProxy>();
        var hubClientsMock = new Mock<IHubClients>();
        hubClientsMock.Setup(x => x.All).Returns(clientsMock.Object);
        _hubMock.Setup(x => x.Clients).Returns(hubClientsMock.Object);

        // Act
        var result = await _sut.CreateBookingCourtAsync(request);

        // Assert
        Assert.IsNotNull(result);
        var booking = await _context.BookingCourts.FirstOrDefaultAsync(b => b.Id == result.Id);
        Assert.IsNotNull(booking);
        Assert.AreEqual(customer.Id, booking.CustomerId);
        Assert.AreEqual(court.Id, booking.CourtId);
    }

    [TestMethod]
    public async Task FUNC06_TC02_CreateBookingCourtAsync_CourtNotFound_ShouldThrowException()
    {
        // Arrange
        var customer = await SeedCustomer();
        var request = new CreateBookingCourtRequest
        {
            CustomerId = customer.Id,
            CourtId = Guid.NewGuid(),
            StartDate = DateTime.UtcNow.AddDays(1),
            EndDate = DateTime.UtcNow.AddDays(1),
            StartTime = new TimeOnly(10, 0),
            EndTime = new TimeOnly(11, 0),
        };

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ApiException>(async () => await _sut.CreateBookingCourtAsync(request));
    }

    [TestMethod]
    public async Task FUNC06_TC03_CreateBookingCourtAsync_CourtInactive_ShouldThrowException()
    {
        // Arrange
        var court = await SeedCourt(status: CourtStatus.Inactive);
        var customer = await SeedCustomer();
        var request = new CreateBookingCourtRequest
        {
            CustomerId = customer.Id,
            CourtId = court.Id,
            StartDate = DateTime.UtcNow.AddDays(1),
            EndDate = DateTime.UtcNow.AddDays(1),
            StartTime = new TimeOnly(10, 0),
            EndTime = new TimeOnly(11, 0),
        };

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ApiException>(async () => await _sut.CreateBookingCourtAsync(request));
    }

    [TestMethod]
    public async Task FUNC06_TC04_CreateBookingCourtAsync_InvalidTimeRange_ShouldThrowException()
    {
        // Arrange
        var court = await SeedCourt();
        var customer = await SeedCustomer();
        var request = new CreateBookingCourtRequest
        {
            CustomerId = customer.Id,
            CourtId = court.Id,
            StartDate = DateTime.UtcNow.AddDays(1),
            EndDate = DateTime.UtcNow.AddDays(1),
            StartTime = new TimeOnly(11, 0),
            EndTime = new TimeOnly(10, 0), // End before start
        };

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ApiException>(async () => await _sut.CreateBookingCourtAsync(request));
    }

    [TestMethod]
    public async Task FUNC06_TC05_CreateBookingCourtAsync_PastDate_ShouldThrowException()
    {
        // Arrange
        var court = await SeedCourt();
        var customer = await SeedCustomer();
        var request = new CreateBookingCourtRequest
        {
            CustomerId = customer.Id,
            CourtId = court.Id,
            StartDate = DateTime.UtcNow.AddDays(-1),
            EndDate = DateTime.UtcNow.AddDays(-1),
            StartTime = new TimeOnly(10, 0),
            EndTime = new TimeOnly(11, 0),
        };

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ApiException>(async () => await _sut.CreateBookingCourtAsync(request));
    }

    [TestMethod]
    public async Task FUNC06_TC06_CreateBookingCourtAsync_WithVoucher_ShouldApplyDiscount()
    {
        // Arrange
        var court = await SeedCourt();
        var customer = await SeedCustomer();
        // Seed pricing rule for tomorrow's day of week (convert to custom format: Monday=2..Sunday=8)
        var tomorrow = DateTime.UtcNow.AddDays(1).Date;
        var dayOfWeekEnum = tomorrow.DayOfWeek; // Sunday=0..Saturday=6
        var customDayOfWeek = dayOfWeekEnum == DayOfWeek.Sunday ? 8 : (int)dayOfWeekEnum + 1; // Monday=2..Sunday=8
        await SeedPricingRule(court.Id, daysOfWeek: new[] { customDayOfWeek });

        var request = new CreateBookingCourtRequest
        {
            CustomerId = customer.Id,
            CourtId = court.Id,
            StartDate = tomorrow,
            EndDate = tomorrow,
            StartTime = new TimeOnly(10, 0),
            EndTime = new TimeOnly(11, 0),
            VoucherId = 1,
            PaymentMethod = "Cash",
        };

        _configurationMock.Setup(x => x["Booking:HoldMinutes"]).Returns("5");
        _voucherServiceMock.Setup(x => x.ValidateAndCalculateDiscountAsync(It.IsAny<ValidateVoucherRequest>(), It.IsAny<int>()))
            .ReturnsAsync(new ValidateVoucherResponse { IsValid = true, DiscountAmount = 10000m });
        _paymentServiceMock.Setup(x => x.CreatePaymentAsync(It.IsAny<CreatePaymentRequest>()))
            .ReturnsAsync(new DetailPaymentResponse { Id = Guid.NewGuid().ToString() });
        
        // Setup hub mock for SignalR
        var clientsMock = new Mock<IClientProxy>();
        var hubClientsMock = new Mock<IHubClients>();
        hubClientsMock.Setup(x => x.All).Returns(clientsMock.Object);
        _hubMock.Setup(x => x.Clients).Returns(hubClientsMock.Object);

        // Act
        var result = await _sut.CreateBookingCourtAsync(request);

        // Assert
        Assert.IsNotNull(result);
        _voucherServiceMock.Verify(x => x.ValidateAndCalculateDiscountAsync(It.IsAny<ValidateVoucherRequest>(), customer.Id), Times.Once);
    }

    // FUNC07: UserCreateBookingCourtAsync
    [TestMethod]
    public async Task FUNC07_TC01_UserCreateBookingCourtAsync_Success_ShouldCreateBooking()
    {
        // Arrange
        var user = await SeedUser();
        var customer = await SeedCustomer();
        customer.UserId = user.Id;
        await _context.SaveChangesAsync();

        var court = await SeedCourt();
        // Seed pricing rule for tomorrow's day of week (convert to custom format: Monday=2..Sunday=8)
        var tomorrow = DateTime.UtcNow.AddDays(1).Date;
        var dayOfWeekEnum = tomorrow.DayOfWeek; // Sunday=0..Saturday=6
        var customDayOfWeek = dayOfWeekEnum == DayOfWeek.Sunday ? 8 : (int)dayOfWeekEnum + 1; // Monday=2..Sunday=8
        await SeedPricingRule(court.Id, daysOfWeek: new[] { customDayOfWeek });

        var request = new UserCreateBookingCourtRequest
        {
            CourtId = court.Id,
            StartDate = tomorrow,
            EndDate = tomorrow,
            StartTime = new TimeOnly(10, 0),
            EndTime = new TimeOnly(11, 0),
        };

        _currentUserMock.Setup(x => x.UserId).Returns(user.Id);
        _userManagerMock.Setup(x => x.FindByIdAsync(It.IsAny<string>())).ReturnsAsync(user);
        _configurationMock.Setup(x => x["Booking:HoldMinutes"]).Returns("5");
        _paymentServiceMock.Setup(x => x.CreatePaymentAsync(It.IsAny<CreatePaymentRequest>()))
            .ReturnsAsync(new DetailPaymentResponse { Id = Guid.NewGuid().ToString() });
        
        // Setup hub mock for SignalR
        var clientsMock = new Mock<IClientProxy>();
        var hubClientsMock = new Mock<IHubClients>();
        hubClientsMock.Setup(x => x.All).Returns(clientsMock.Object);
        _hubMock.Setup(x => x.Clients).Returns(hubClientsMock.Object);

        // Act
        var result = await _sut.UserCreateBookingCourtAsync(request);

        // Assert
        Assert.IsNotNull(result);
        var booking = await _context.BookingCourts.FirstOrDefaultAsync(b => b.Id == result.Id);
        Assert.IsNotNull(booking);
    }

    [TestMethod]
    public async Task FUNC07_TC02_UserCreateBookingCourtAsync_NoUserId_ShouldThrowException()
    {
        // Arrange
        var request = new UserCreateBookingCourtRequest
        {
            CourtId = Guid.NewGuid(),
            StartDate = DateTime.UtcNow.AddDays(1),
            EndDate = DateTime.UtcNow.AddDays(1),
            StartTime = new TimeOnly(10, 0),
            EndTime = new TimeOnly(11, 0),
        };

        _currentUserMock.Setup(x => x.UserId).Returns((Guid?)null);

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ApiException>(async () => await _sut.UserCreateBookingCourtAsync(request));
    }

    [TestMethod]
    public async Task FUNC07_TC03_UserCreateBookingCourtAsync_NoCustomer_ShouldThrowException()
    {
        // Arrange
        var user = await SeedUser();
        var court = await SeedCourt();

        var request = new UserCreateBookingCourtRequest
        {
            CourtId = court.Id,
            StartDate = DateTime.UtcNow.AddDays(1),
            EndDate = DateTime.UtcNow.AddDays(1),
            StartTime = new TimeOnly(10, 0),
            EndTime = new TimeOnly(11, 0),
        };

        _currentUserMock.Setup(x => x.UserId).Returns(user.Id);
        _userManagerMock.Setup(x => x.FindByIdAsync(It.IsAny<string>())).ReturnsAsync(user);

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ApiException>(async () => await _sut.UserCreateBookingCourtAsync(request));
    }

    // FUNC08: CancelBookingCourtAsync
    [TestMethod]
    public async Task FUNC08_TC01_CancelBookingCourtAsync_Success_ShouldCancelOccurrence()
    {
        // Arrange
        var court = await SeedCourt();
        var customer = await SeedCustomer();
        var booking = new BookingCourt
        {
            Id = Guid.NewGuid(),
            CustomerId = customer.Id,
            CourtId = court.Id,
            StartDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)),
            EndDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)),
            StartTime = new TimeOnly(10, 0),
            EndTime = new TimeOnly(11, 0),
            DaysOfWeek = Array.Empty<int>(),
            Status = BookingCourtStatus.Active,
        };
        await _context.BookingCourts.AddAsync(booking);

        var occurrence = new BookingCourtOccurrence
        {
            Id = Guid.NewGuid(),
            BookingCourtId = booking.Id,
            BookingCourt = booking,
            Date = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)),
            StartTime = new TimeOnly(10, 0),
            EndTime = new TimeOnly(11, 0),
            Status = BookingCourtOccurrenceStatus.Active,
        };
        await _context.BookingCourtOccurrences.AddAsync(occurrence);
        await _context.SaveChangesAsync();

        var request = new CancelBookingCourtRequest { Id = occurrence.Id };

        var clientsMock = new Mock<IClientProxy>();
        _hubMock.Setup(x => x.Clients.All).Returns(clientsMock.Object);

        // Act
        var result = await _sut.CancelBookingCourtAsync(request);

        // Assert
        Assert.IsTrue(result);
        var updatedOccurrence = await _context.BookingCourtOccurrences.FindAsync(occurrence.Id);
        Assert.IsNotNull(updatedOccurrence);
        Assert.AreEqual(BookingCourtOccurrenceStatus.Cancelled, updatedOccurrence.Status);
    }

    [TestMethod]
    public async Task FUNC08_TC02_CancelBookingCourtAsync_OccurrenceNotFound_ShouldThrowException()
    {
        // Arrange
        var request = new CancelBookingCourtRequest { Id = Guid.NewGuid() };

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ApiException>(async () => await _sut.CancelBookingCourtAsync(request));
    }

    [TestMethod]
    public async Task FUNC08_TC03_CancelBookingCourtAsync_AlreadyCancelled_ShouldReturnTrue()
    {
        // Arrange
        var court = await SeedCourt();
        var customer = await SeedCustomer();
        var booking = new BookingCourt
        {
            Id = Guid.NewGuid(),
            CustomerId = customer.Id,
            CourtId = court.Id,
            StartDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)),
            EndDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)),
            StartTime = new TimeOnly(10, 0),
            EndTime = new TimeOnly(11, 0),
            DaysOfWeek = Array.Empty<int>(),
            Status = BookingCourtStatus.Active,
        };
        await _context.BookingCourts.AddAsync(booking);

        var occurrence = new BookingCourtOccurrence
        {
            Id = Guid.NewGuid(),
            BookingCourtId = booking.Id,
            BookingCourt = booking,
            Date = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)),
            StartTime = new TimeOnly(10, 0),
            EndTime = new TimeOnly(11, 0),
            Status = BookingCourtOccurrenceStatus.Cancelled,
        };
        await _context.BookingCourtOccurrences.AddAsync(occurrence);
        await _context.SaveChangesAsync();

        var request = new CancelBookingCourtRequest { Id = occurrence.Id };

        // Act
        var result = await _sut.CancelBookingCourtAsync(request);

        // Assert
        Assert.IsTrue(result);
    }

    // FUNC09: CheckInOccurrenceAsync
    [TestMethod]
    public async Task FUNC09_TC01_CheckInOccurrenceAsync_Success_ShouldCheckIn()
    {
        // Arrange
        var court = await SeedCourt();
        var customer = await SeedCustomer();
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

        // Set occurrence time to allow check-in (within -10 minutes to end time window)
        // Need to account for Vietnam timezone (UTC+7) conversion
        var tz = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
        var nowUtc = DateTime.UtcNow;
        var nowLocal = TimeZoneInfo.ConvertTimeFromUtc(nowUtc, tz);
        
        // Set occurrence to current local time to ensure check-in window is valid
        var occurrenceDate = DateOnly.FromDateTime(nowLocal);
        var occurrenceStartTime = TimeOnly.FromDateTime(nowLocal);
        var occurrenceEndTime = TimeOnly.FromDateTime(nowLocal.AddHours(1)); // 1 hour from now

        var occurrence = new BookingCourtOccurrence
        {
            Id = Guid.NewGuid(),
            BookingCourtId = booking.Id,
            BookingCourt = booking,
            Date = occurrenceDate,
            StartTime = occurrenceStartTime,
            EndTime = occurrenceEndTime,
            Status = BookingCourtOccurrenceStatus.Active,
        };
        await _context.BookingCourtOccurrences.AddAsync(occurrence);
        await _context.SaveChangesAsync();

        var request = new CheckInBookingCourtRequest { Id = occurrence.Id };

        var clientsMock = new Mock<IClientProxy>();
        _hubMock.Setup(x => x.Clients.All).Returns(clientsMock.Object);

        // Act
        var result = await _sut.CheckInOccurrenceAsync(request);

        // Assert
        Assert.IsTrue(result);
        var updatedOccurrence = await _context.BookingCourtOccurrences.FindAsync(occurrence.Id);
        Assert.IsNotNull(updatedOccurrence);
        Assert.AreEqual(BookingCourtOccurrenceStatus.CheckedIn, updatedOccurrence.Status);
        var updatedCourt = await _context.Courts.FindAsync(court.Id);
        Assert.IsNotNull(updatedCourt);
        Assert.AreEqual(CourtStatus.InUse, updatedCourt.Status);
    }

    [TestMethod]
    public async Task FUNC09_TC02_CheckInOccurrenceAsync_OccurrenceNotFound_ShouldThrowException()
    {
        // Arrange
        var request = new CheckInBookingCourtRequest { Id = Guid.NewGuid() };

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ApiException>(async () => await _sut.CheckInOccurrenceAsync(request));
    }

    [TestMethod]
    public async Task FUNC09_TC03_CheckInOccurrenceAsync_AlreadyCheckedIn_ShouldThrowException()
    {
        // Arrange
        var court = await SeedCourt();
        var customer = await SeedCustomer();
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

        var occurrence = new BookingCourtOccurrence
        {
            Id = Guid.NewGuid(),
            BookingCourtId = booking.Id,
            BookingCourt = booking,
            Date = DateOnly.FromDateTime(DateTime.UtcNow),
            StartTime = new TimeOnly(10, 0),
            EndTime = new TimeOnly(11, 0),
            Status = BookingCourtOccurrenceStatus.CheckedIn,
        };
        await _context.BookingCourtOccurrences.AddAsync(occurrence);
        await _context.SaveChangesAsync();

        var request = new CheckInBookingCourtRequest { Id = occurrence.Id };

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ApiException>(async () => await _sut.CheckInOccurrenceAsync(request));
    }

    // FUNC10: CheckOutOccurrenceAsync
    [TestMethod]
    public async Task FUNC10_TC01_CheckOutOccurrenceAsync_Success_ShouldCheckOut()
    {
        // Arrange
        var court = await SeedCourt(status: CourtStatus.InUse);
        var customer = await SeedCustomer();
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

        var occurrence = new BookingCourtOccurrence
        {
            Id = Guid.NewGuid(),
            BookingCourtId = booking.Id,
            BookingCourt = booking,
            Date = DateOnly.FromDateTime(DateTime.UtcNow),
            StartTime = new TimeOnly(10, 0),
            EndTime = new TimeOnly(11, 0),
            Status = BookingCourtOccurrenceStatus.CheckedIn,
        };
        await _context.BookingCourtOccurrences.AddAsync(occurrence);
        await _context.SaveChangesAsync();

        var request = new CheckOutBookingCourtRequest { Id = occurrence.Id, Note = "Checkout note" };

        var clientsMock = new Mock<IClientProxy>();
        _hubMock.Setup(x => x.Clients.All).Returns(clientsMock.Object);

        // Act
        var result = await _sut.CheckOutOccurrenceAsync(request);

        // Assert
        Assert.IsTrue(result);
        var updatedOccurrence = await _context.BookingCourtOccurrences.FindAsync(occurrence.Id);
        Assert.IsNotNull(updatedOccurrence);
        Assert.AreEqual(BookingCourtOccurrenceStatus.Completed, updatedOccurrence.Status);
        var updatedCourt = await _context.Courts.FindAsync(court.Id);
        Assert.IsNotNull(updatedCourt);
        Assert.AreEqual(CourtStatus.Active, updatedCourt.Status);
    }

    [TestMethod]
    public async Task FUNC10_TC02_CheckOutOccurrenceAsync_NotCheckedIn_ShouldThrowException()
    {
        // Arrange
        var court = await SeedCourt();
        var customer = await SeedCustomer();
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

        var request = new CheckOutBookingCourtRequest { Id = occurrence.Id };

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ApiException>(async () => await _sut.CheckOutOccurrenceAsync(request));
    }

    // FUNC11: MarkOccurrenceNoShowAsync
    [TestMethod]
    public async Task FUNC11_TC01_MarkOccurrenceNoShowAsync_Success_ShouldMarkNoShow()
    {
        // Arrange
        var court = await SeedCourt();
        var customer = await SeedCustomer();
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

        var request = new NoShowBookingCourtRequest { Id = occurrence.Id, Note = "No show" };

        var clientsMock = new Mock<IClientProxy>();
        _hubMock.Setup(x => x.Clients.All).Returns(clientsMock.Object);

        // Act
        var result = await _sut.MarkOccurrenceNoShowAsync(request);

        // Assert
        Assert.IsTrue(result);
        var updatedOccurrence = await _context.BookingCourtOccurrences.FindAsync(occurrence.Id);
        Assert.IsNotNull(updatedOccurrence);
        Assert.AreEqual(BookingCourtOccurrenceStatus.NoShow, updatedOccurrence.Status);
    }

    [TestMethod]
    public async Task FUNC11_TC02_MarkOccurrenceNoShowAsync_AlreadyCompleted_ShouldReturnTrue()
    {
        // Arrange
        var court = await SeedCourt();
        var customer = await SeedCustomer();
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

        var occurrence = new BookingCourtOccurrence
        {
            Id = Guid.NewGuid(),
            BookingCourtId = booking.Id,
            BookingCourt = booking,
            Date = DateOnly.FromDateTime(DateTime.UtcNow),
            StartTime = new TimeOnly(10, 0),
            EndTime = new TimeOnly(11, 0),
            Status = BookingCourtOccurrenceStatus.Completed,
        };
        await _context.BookingCourtOccurrences.AddAsync(occurrence);
        await _context.SaveChangesAsync();

        var request = new NoShowBookingCourtRequest { Id = occurrence.Id };

        // Act
        var result = await _sut.MarkOccurrenceNoShowAsync(request);

        // Assert
        Assert.IsTrue(result);
    }

    // FUNC12: AddOrderItemAsync
    [TestMethod]
    public async Task FUNC12_TC01_AddOrderItemAsync_Success_ShouldAddItem()
    {
        // Arrange
        var court = await SeedCourt();
        var customer = await SeedCustomer();
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

        var product = new Product
        {
            Id = 1,
            Name = "Test Product",
            SalePrice = 50000m,
            IsActive = true,
        };
        await _context.Products.AddAsync(product);
        await _context.SaveChangesAsync();

        var request = new AddOrderItemRequest
        {
            BookingCourtOccurrenceId = occurrence.Id,
            ProductId = product.Id,
            Quantity = 2,
        };

        // Act
        var result = await _sut.AddOrderItemAsync(request);

        // Assert
        Assert.IsTrue(result);
        var item = await _context.BookingOrderItems.FirstOrDefaultAsync(i =>
            i.BookingCourtOccurrenceId == occurrence.Id && i.ProductId == product.Id
        );
        Assert.IsNotNull(item);
        Assert.AreEqual(2, item.Quantity);
        Assert.AreEqual(100000m, item.TotalPrice);
    }

    [TestMethod]
    public async Task FUNC12_TC02_AddOrderItemAsync_OccurrenceNotFound_ShouldThrowException()
    {
        // Arrange
        var product = new Product
        {
            Id = 1,
            Name = "Test Product",
            SalePrice = 50000m,
            IsActive = true,
        };
        await _context.Products.AddAsync(product);
        await _context.SaveChangesAsync();

        var request = new AddOrderItemRequest
        {
            BookingCourtOccurrenceId = Guid.NewGuid(),
            ProductId = product.Id,
            Quantity = 1,
        };

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ApiException>(async () => await _sut.AddOrderItemAsync(request));
    }

    [TestMethod]
    public async Task FUNC12_TC03_AddOrderItemAsync_ProductNotFound_ShouldThrowException()
    {
        // Arrange
        var court = await SeedCourt();
        var customer = await SeedCustomer();
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

        var request = new AddOrderItemRequest
        {
            BookingCourtOccurrenceId = occurrence.Id,
            ProductId = 999,
            Quantity = 1,
        };

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ApiException>(async () => await _sut.AddOrderItemAsync(request));
    }

    [TestMethod]
    public async Task FUNC12_TC04_AddOrderItemAsync_ExistingItem_ShouldUpdateQuantity()
    {
        // Arrange
        var court = await SeedCourt();
        var customer = await SeedCustomer();
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

        var product = new Product
        {
            Id = 1,
            Name = "Test Product",
            SalePrice = 50000m,
            IsActive = true,
        };
        await _context.Products.AddAsync(product);

        var existingItem = new BookingOrderItem
        {
            Id = Guid.NewGuid(),
            BookingCourtOccurrenceId = occurrence.Id,
            ProductId = product.Id,
            Quantity = 1,
            UnitPrice = 50000m,
            TotalPrice = 50000m,
        };
        await _context.BookingOrderItems.AddAsync(existingItem);
        await _context.SaveChangesAsync();

        var request = new AddOrderItemRequest
        {
            BookingCourtOccurrenceId = occurrence.Id,
            ProductId = product.Id,
            Quantity = 2,
        };

        // Act
        var result = await _sut.AddOrderItemAsync(request);

        // Assert
        Assert.IsTrue(result);
        var item = await _context.BookingOrderItems.FindAsync(existingItem.Id);
        Assert.IsNotNull(item);
        Assert.AreEqual(3, item.Quantity);
        Assert.AreEqual(150000m, item.TotalPrice);
    }

    // FUNC13: UpdateOrderItemAsync
    [TestMethod]
    public async Task FUNC13_TC01_UpdateOrderItemAsync_Success_ShouldUpdateItem()
    {
        // Arrange
        var court = await SeedCourt();
        var customer = await SeedCustomer();
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

        var product = new Product
        {
            Id = 1,
            Name = "Test Product",
            SalePrice = 50000m,
            IsActive = true,
        };
        await _context.Products.AddAsync(product);

        var item = new BookingOrderItem
        {
            Id = Guid.NewGuid(),
            BookingCourtOccurrenceId = occurrence.Id,
            ProductId = product.Id,
            Quantity = 2,
            UnitPrice = 50000m,
            TotalPrice = 100000m,
        };
        await _context.BookingOrderItems.AddAsync(item);
        await _context.SaveChangesAsync();

        var request = new UpdateOrderItemRequest
        {
            BookingCourtOccurrenceId = occurrence.Id,
            ProductId = product.Id,
            Quantity = 5,
        };

        // Act
        var result = await _sut.UpdateOrderItemAsync(request);

        // Assert
        Assert.IsTrue(result);
        var updatedItem = await _context.BookingOrderItems.FindAsync(item.Id);
        Assert.IsNotNull(updatedItem);
        Assert.AreEqual(5, updatedItem.Quantity);
        Assert.AreEqual(250000m, updatedItem.TotalPrice);
    }

    [TestMethod]
    public async Task FUNC13_TC02_UpdateOrderItemAsync_QuantityZero_ShouldRemoveItem()
    {
        // Arrange
        var court = await SeedCourt();
        var customer = await SeedCustomer();
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

        var product = new Product
        {
            Id = 1,
            Name = "Test Product",
            SalePrice = 50000m,
            IsActive = true,
        };
        await _context.Products.AddAsync(product);

        var item = new BookingOrderItem
        {
            Id = Guid.NewGuid(),
            BookingCourtOccurrenceId = occurrence.Id,
            ProductId = product.Id,
            Quantity = 2,
            UnitPrice = 50000m,
            TotalPrice = 100000m,
        };
        await _context.BookingOrderItems.AddAsync(item);
        await _context.SaveChangesAsync();

        var request = new UpdateOrderItemRequest
        {
            BookingCourtOccurrenceId = occurrence.Id,
            ProductId = product.Id,
            Quantity = 0,
        };

        // Act
        var result = await _sut.UpdateOrderItemAsync(request);

        // Assert
        Assert.IsTrue(result);
        var removedItem = await _context.BookingOrderItems.FindAsync(item.Id);
        Assert.IsNull(removedItem);
    }

    [TestMethod]
    public async Task FUNC13_TC03_UpdateOrderItemAsync_ItemNotFound_ShouldThrowException()
    {
        // Arrange
        var court = await SeedCourt();
        var customer = await SeedCustomer();
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

        var request = new UpdateOrderItemRequest
        {
            BookingCourtOccurrenceId = occurrence.Id,
            ProductId = 999,
            Quantity = 5,
        };

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ApiException>(async () => await _sut.UpdateOrderItemAsync(request));
    }
}

