using System;
using System.Net;
using System.Threading.Tasks;
using ApiApplication.Constants;
using ApiApplication.Data;
using ApiApplication.Dtos.Service;
using ApiApplication.Entities;
using ApiApplication.Entities.Shared;
using ApiApplication.Exceptions;
using ApiApplication.Mappings;
using ApiApplication.Services.Impl;
using ApiApplication.Sessions;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using Tests;

namespace Tests;

[TestClass]
public class ServiceServiceTests
{
    private ApplicationDbContext _context = null!;
    private IMapper _mapper = null!;
    private ServiceService _sut = null!;

    [TestInitialize]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var currentUserMock = new Mock<ICurrentUser>();
        _context = new ApplicationDbContext(options, currentUserMock.Object);

        _mapper = TestHelpers.BuildMapper();

        _sut = new ServiceService(_context, _mapper);
    }

    [TestCleanup]
    public void Cleanup()
    {
        _context?.Dispose();
    }

    // FUNC36: AddBookingServiceAsync
    [TestMethod]
    public async Task FUNC36_TC01_AddBookingServiceAsync_Success_ShouldCreateBookingService()
    {
        // Arrange
        var service = await SeedService();
        var occurrence = await SeedBookingCourtOccurrence();
        var request = new AddBookingServiceRequest
        {
            ServiceId = service.Id,
            BookingCourtOccurrenceId = occurrence.Id,
            Quantity = 1,
        };

        // Act
        var result = await _sut.AddBookingServiceAsync(request);

        // Assert
        Assert.IsNotNull(result);
        var bookingService = await _context.BookingServices.FirstOrDefaultAsync(bs =>
            bs.ServiceId == service.Id && bs.BookingCourtOccurrenceId == occurrence.Id);
        Assert.IsNotNull(bookingService);
        Assert.AreEqual(BookingServiceStatus.Pending, bookingService.Status);
    }

    [TestMethod]
    public async Task FUNC36_TC02_AddBookingServiceAsync_ServiceNotFound_ShouldThrowException()
    {
        // Arrange
        var occurrence = await SeedBookingCourtOccurrence();
        var request = new AddBookingServiceRequest
        {
            ServiceId = Guid.NewGuid(),
            BookingCourtOccurrenceId = occurrence.Id,
            Quantity = 1,
        };

        // Act & Assert
        var exception = await Assert.ThrowsExceptionAsync<ApiException>(async () =>
            await _sut.AddBookingServiceAsync(request));
        Assert.AreEqual(HttpStatusCode.BadRequest, exception.StatusCode);
        Assert.IsTrue(exception.Message.Contains("Không tìm thấy dịch vụ"));
    }

    [TestMethod]
    public async Task FUNC36_TC03_AddBookingServiceAsync_OccurrenceNotCheckedIn_ShouldThrowException()
    {
        // Arrange
        var service = await SeedService();
        var occurrence = await SeedBookingCourtOccurrence(status: BookingCourtOccurrenceStatus.Active);
        var request = new AddBookingServiceRequest
        {
            ServiceId = service.Id,
            BookingCourtOccurrenceId = occurrence.Id,
            Quantity = 1,
        };

        // Act & Assert
        var exception = await Assert.ThrowsExceptionAsync<ApiException>(async () =>
            await _sut.AddBookingServiceAsync(request));
        Assert.AreEqual(HttpStatusCode.BadRequest, exception.StatusCode);
        Assert.IsTrue(exception.Message.Contains("check-in"));
    }

    // FUNC37: EndServiceAsync
    [TestMethod]
    public async Task FUNC37_TC01_EndServiceAsync_Success_ShouldUpdateStatus()
    {
        // Arrange
        var bookingService = await SeedBookingService();

        // Act
        var result = await _sut.EndServiceAsync(new EndServiceRequest { BookingServiceId = bookingService.Id });

        // Assert
        Assert.IsNotNull(result);
        var updatedBookingService = await _context.BookingServices.FindAsync(bookingService.Id);
        Assert.IsNotNull(updatedBookingService);
        Assert.AreEqual(BookingServiceStatus.Completed, updatedBookingService.Status);
        Assert.IsNotNull(updatedBookingService.ServiceEndTime);
    }

    [TestMethod]
    public async Task FUNC37_TC02_EndServiceAsync_BookingServiceNotFound_ShouldThrowException()
    {
        // Arrange
        var request = new EndServiceRequest { BookingServiceId = Guid.NewGuid() };

        // Act & Assert
        var exception = await Assert.ThrowsExceptionAsync<ApiException>(async () =>
            await _sut.EndServiceAsync(request));
        Assert.AreEqual(HttpStatusCode.BadRequest, exception.StatusCode);
        Assert.IsTrue(exception.Message.Contains("Không tìm thấy dịch vụ đặt sân"));
    }

    private async Task<Service> SeedService(Guid? id = null)
    {
        var service = new Service
        {
            Id = id ?? Guid.NewGuid(),
            Code = "SV001",
            Name = "Test Service",
            Status = ApiApplication.Constants.ServiceStatus.Active,
            PricePerHour = 50000,
        };
        await _context.Services.AddAsync(service);
        await _context.SaveChangesAsync();
        return service;
    }

    private async Task<BookingCourtOccurrence> SeedBookingCourtOccurrence(Guid? id = null, string? status = null)
    {
        var court = await SeedCourt();
        var booking = await SeedBookingCourt(court.Id);
        var occurrence = new BookingCourtOccurrence
        {
            Id = id ?? Guid.NewGuid(),
            BookingCourtId = booking.Id,
            Date = DateOnly.FromDateTime(DateTime.UtcNow),
            StartTime = TimeOnly.FromDateTime(DateTime.UtcNow),
            EndTime = TimeOnly.FromDateTime(DateTime.UtcNow.AddHours(1)),
            Status = status ?? BookingCourtOccurrenceStatus.CheckedIn,
        };
        await _context.BookingCourtOccurrences.AddAsync(occurrence);
        await _context.SaveChangesAsync();
        return occurrence;
    }

    private async Task<BookingService> SeedBookingService(Guid? id = null)
    {
        var service = await SeedService();
        var occurrence = await SeedBookingCourtOccurrence();
        var bookingService = new BookingService
        {
            Id = id ?? Guid.NewGuid(),
            ServiceId = service.Id,
            BookingCourtOccurrenceId = occurrence.Id,
            Quantity = 1,
            UnitPrice = service.PricePerHour,
            Hours = 1,
            TotalPrice = service.PricePerHour,
            Status = BookingServiceStatus.Pending,
            ServiceStartTime = DateTime.UtcNow,
            Service = service,
            BookingCourtOccurrence = occurrence,
        };
        await _context.BookingServices.AddAsync(bookingService);
        await _context.SaveChangesAsync();
        return bookingService;
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

    private async Task<BookingCourt> SeedBookingCourt(Guid courtId)
    {
        var customer = await SeedCustomer();
        var booking = new BookingCourt
        {
            Id = Guid.NewGuid(),
            CourtId = courtId,
            CustomerId = customer.Id,
            Status = BookingCourtStatus.Active,
            StartDate = DateOnly.FromDateTime(DateTime.Today),
            EndDate = DateOnly.FromDateTime(DateTime.Today),
            StartTime = new TimeOnly(8, 0),
            EndTime = new TimeOnly(10, 0),
            DaysOfWeek = Array.Empty<int>(),
        };
        await _context.BookingCourts.AddAsync(booking);
        await _context.SaveChangesAsync();
        return booking;
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
}

