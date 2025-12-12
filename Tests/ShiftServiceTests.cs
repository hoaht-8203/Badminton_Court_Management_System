using System;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using ApiApplication.Data;
using ApiApplication.Dtos;
using ApiApplication.Entities;
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
public class ShiftServiceTests
{
    private ApplicationDbContext _context = null!;
    private IMapper _mapper = null!;
    private ShiftService _sut = null!;

    [TestInitialize]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var currentUserMock = new Mock<ICurrentUser>();
        _context = new ApplicationDbContext(options, currentUserMock.Object);

        _mapper = TestHelpers.BuildMapper();

        _sut = new ShiftService(_context, _mapper);
    }

    [TestCleanup]
    public void Cleanup()
    {
        _context?.Dispose();
    }

    // FUNC27: CreateShiftAsync
    [TestMethod]
    public async Task FUNC27_TC01_CreateShiftAsync_Success_ShouldCreateShift()
    {
        // Arrange
        var request = new ShiftRequest
        {
            Name = "Morning Shift",
            StartTime = new TimeOnly(8, 0),
            EndTime = new TimeOnly(12, 0),
        };

        // Act
        await _sut.CreateShiftAsync(request);

        // Assert
        var shift = await _context.Shifts.FirstOrDefaultAsync(s =>
            s.Name == request.Name && s.StartTime == request.StartTime);
        Assert.IsNotNull(shift);
        Assert.AreEqual(request.EndTime, shift.EndTime);
        Assert.IsTrue(shift.IsActive);
    }

    [TestMethod]
    public async Task FUNC27_TC02_CreateShiftAsync_OverlappingTime_ShouldThrowException()
    {
        // Arrange
        await SeedShift(1, new TimeOnly(8, 0), new TimeOnly(12, 0));
        var request = new ShiftRequest
        {
            Name = "Overlapping Shift",
            StartTime = new TimeOnly(10, 0), // Overlaps with existing shift
            EndTime = new TimeOnly(14, 0),
        };

        // Act & Assert
        var exception = await Assert.ThrowsExceptionAsync<ApiException>(async () =>
            await _sut.CreateShiftAsync(request));
        Assert.AreEqual(HttpStatusCode.BadRequest, exception.StatusCode);
        Assert.IsTrue(exception.Message.Contains("trùng"));
    }

    [TestMethod]
    public async Task FUNC27_TC03_CreateShiftAsync_StartTimeAfterEndTime_ShouldThrowException()
    {
        // Arrange
        var request = new ShiftRequest
        {
            Name = "Invalid Shift",
            StartTime = new TimeOnly(12, 0),
            EndTime = new TimeOnly(8, 0), // End before start
        };

        // Act & Assert
        var exception = await Assert.ThrowsExceptionAsync<ApiException>(async () =>
            await _sut.CreateShiftAsync(request));
        Assert.AreEqual(HttpStatusCode.BadRequest, exception.StatusCode);
        Assert.IsTrue(exception.Message.Contains("bắt đầu phải trước"));
    }

    [TestMethod]
    public async Task FUNC27_TC04_CreateShiftAsync_ZeroDuration_ShouldThrowException()
    {
        // Arrange
        var request = new ShiftRequest
        {
            Name = "Zero Duration Shift",
            StartTime = new TimeOnly(8, 0),
            EndTime = new TimeOnly(8, 0), // Same start and end
        };

        // Act & Assert
        var exception = await Assert.ThrowsExceptionAsync<ApiException>(async () =>
            await _sut.CreateShiftAsync(request));
        Assert.AreEqual(HttpStatusCode.BadRequest, exception.StatusCode);
    }

    // FUNC28: DeleteShiftAsync
    [TestMethod]
    public async Task FUNC28_TC01_DeleteShiftAsync_Success_ShouldDeleteShift()
    {
        // Arrange
        var shift = await SeedShift();

        // Act
        await _sut.DeleteShiftAsync(shift.Id);

        // Assert
        var shiftExists = await _context.Shifts.AnyAsync(s => s.Id == shift.Id);
        Assert.IsFalse(shiftExists);
    }

    [TestMethod]
    public async Task FUNC28_TC02_DeleteShiftAsync_ShiftNotFound_ShouldThrowException()
    {
        // Arrange
        var nonExistentId = 99999;

        // Act & Assert
        var exception = await Assert.ThrowsExceptionAsync<ApiException>(async () =>
            await _sut.DeleteShiftAsync(nonExistentId));
        Assert.AreEqual(HttpStatusCode.NotFound, exception.StatusCode);
        Assert.IsTrue(exception.Message.Contains("không tồn tại"));
    }

    [TestMethod]
    public async Task FUNC28_TC03_DeleteShiftAsync_WithSchedules_ShouldThrowException()
    {
        // Arrange
        var shift = await SeedShift();
        var staff = await SeedStaff();
        var schedule = new Schedule
        {
            StaffId = staff.Id,
            ShiftId = shift.Id,
            StartDate = DateOnly.FromDateTime(DateTime.Today),
        };
        await _context.Schedules.AddAsync(schedule);
        await _context.SaveChangesAsync();

        // Act & Assert
        var exception = await Assert.ThrowsExceptionAsync<ApiException>(async () =>
            await _sut.DeleteShiftAsync(shift.Id));
        Assert.AreEqual(HttpStatusCode.BadRequest, exception.StatusCode);
        Assert.IsTrue(exception.Message.Contains("đã được gán"));
    }

    private async Task<Shift> SeedShift(int? id = null, TimeOnly? startTime = null, TimeOnly? endTime = null)
    {
        var shift = new Shift
        {
            Id = id ?? 1,
            Name = "Test Shift",
            StartTime = startTime ?? new TimeOnly(8, 0),
            EndTime = endTime ?? new TimeOnly(12, 0),
            IsActive = true,
        };
        await _context.Shifts.AddAsync(shift);
        await _context.SaveChangesAsync();
        return shift;
    }

    private async Task<Staff> SeedStaff(int? id = null)
    {
        var staff = new Staff
        {
            Id = id ?? 1,
            FullName = "Test Staff",
            PhoneNumber = "0123456789",
            IdentificationNumber = "123456789012",
            IsActive = true,
            SalarySettings = "{}",
        };
        await _context.Staffs.AddAsync(staff);
        await _context.SaveChangesAsync();
        return staff;
    }
}

