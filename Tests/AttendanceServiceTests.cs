using System;
using System.Linq;
using System.Threading.Tasks;
using ApiApplication.Data;
using ApiApplication.Entities;
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
public class AttendanceServiceTests
{
    private ApplicationDbContext _context = null!;
    private IMapper _mapper = null!;
    private AttendanceService _sut = null!;

    [TestInitialize]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var currentUserMock = new Mock<ICurrentUser>();
        _context = new ApplicationDbContext(options, currentUserMock.Object);

        _mapper = TestHelpers.BuildMapper();

        _sut = new AttendanceService(_context, _mapper);
    }

    [TestCleanup]
    public void Cleanup()
    {
        _context?.Dispose();
    }

    // FUNC29: CheckInAsync
    [TestMethod]
    public async Task FUNC29_TC01_CheckInAsync_Success_ShouldCreateAttendanceRecord()
    {
        // Arrange
        var staff = await SeedStaff();

        // Act
        var result = await _sut.CheckInAsync(staff.Id);

        // Assert
        Assert.IsTrue(result);
        var attendance = await _context.AttendanceRecords.FirstOrDefaultAsync(a =>
            a.StaffId == staff.Id && a.Date == DateOnly.FromDateTime(DateTime.Today));
        Assert.IsNotNull(attendance);
        Assert.IsNotNull(attendance.CheckInTime);
        Assert.IsNull(attendance.CheckOutTime);
    }

    [TestMethod]
    public async Task FUNC29_TC02_CheckInAsync_ExistingRecord_ShouldUpdateCheckInTime()
    {
        // Arrange
        var staff = await SeedStaff();
        var existingAttendance = new AttendanceRecord
        {
            StaffId = staff.Id,
            Date = DateOnly.FromDateTime(DateTime.Today),
            CheckInTime = new TimeOnly(7, 0),
            CheckOutTime = new TimeOnly(12, 0),
        };
        await _context.AttendanceRecords.AddAsync(existingAttendance);
        await _context.SaveChangesAsync();

        // Act
        var result = await _sut.CheckInAsync(staff.Id);

        // Assert
        Assert.IsTrue(result);
        var attendance = await _context.AttendanceRecords.FirstOrDefaultAsync(a =>
            a.StaffId == staff.Id && a.Date == DateOnly.FromDateTime(DateTime.Today));
        Assert.IsNotNull(attendance);
        Assert.IsNull(attendance.CheckOutTime); // Should clear checkout
    }

    [TestMethod]
    public async Task FUNC29_TC03_CheckInAsync_MultipleTimes_ShouldUpdateLatestCheckIn()
    {
        // Arrange
        var staff = await SeedStaff();
        await _sut.CheckInAsync(staff.Id);
        var firstCheckIn = await _context.AttendanceRecords.FirstOrDefaultAsync(a =>
            a.StaffId == staff.Id && a.Date == DateOnly.FromDateTime(DateTime.Today));

        // Act - Check in again
        var result = await _sut.CheckInAsync(staff.Id);

        // Assert
        Assert.IsTrue(result);
        var attendance = await _context.AttendanceRecords.FirstOrDefaultAsync(a =>
            a.StaffId == staff.Id && a.Date == DateOnly.FromDateTime(DateTime.Today));
        Assert.IsNotNull(attendance);
        Assert.IsTrue(attendance.CheckInTime >= firstCheckIn!.CheckInTime);
    }

    [TestMethod]
    public async Task FUNC29_TC04_CheckInAsync_InvalidStaffId_ShouldStillCreateRecord()
    {
        // Arrange
        var invalidStaffId = 99999;

        // Act
        var result = await _sut.CheckInAsync(invalidStaffId);

        // Assert
        // In-memory DB doesn't enforce FK, so this may succeed
        // But the method should handle gracefully
        Assert.IsTrue(result);
    }

    // FUNC30: CheckOutAsync
    [TestMethod]
    public async Task FUNC30_TC01_CheckOutAsync_Success_ShouldSetCheckOutTime()
    {
        // Arrange
        var staff = await SeedStaff();
        var attendance = new AttendanceRecord
        {
            StaffId = staff.Id,
            Date = DateOnly.FromDateTime(DateTime.Today),
            CheckInTime = new TimeOnly(8, 0),
        };
        await _context.AttendanceRecords.AddAsync(attendance);
        await _context.SaveChangesAsync();

        // Act
        var result = await _sut.CheckOutAsync(staff.Id);

        // Assert
        Assert.IsTrue(result);
        var updatedAttendance = await _context.AttendanceRecords.FirstOrDefaultAsync(a =>
            a.StaffId == staff.Id && a.Date == DateOnly.FromDateTime(DateTime.Today));
        Assert.IsNotNull(updatedAttendance);
        Assert.IsNotNull(updatedAttendance.CheckOutTime);
    }

    [TestMethod]
    public async Task FUNC30_TC02_CheckOutAsync_NoCheckIn_ShouldReturnFalse()
    {
        // Arrange
        var staff = await SeedStaff();

        // Act
        var result = await _sut.CheckOutAsync(staff.Id);

        // Assert
        Assert.IsFalse(result);
        var attendance = await _context.AttendanceRecords.FirstOrDefaultAsync(a =>
            a.StaffId == staff.Id && a.Date == DateOnly.FromDateTime(DateTime.Today));
        Assert.IsNull(attendance);
    }

    [TestMethod]
    public async Task FUNC30_TC03_CheckOutAsync_AlreadyCheckedOut_ShouldReturnFalse()
    {
        // Arrange
        var staff = await SeedStaff();
        var attendance = new AttendanceRecord
        {
            StaffId = staff.Id,
            Date = DateOnly.FromDateTime(DateTime.Today),
            CheckInTime = new TimeOnly(8, 0),
            CheckOutTime = new TimeOnly(12, 0),
        };
        await _context.AttendanceRecords.AddAsync(attendance);
        await _context.SaveChangesAsync();

        // Act
        var result = await _sut.CheckOutAsync(staff.Id);

        // Assert
        Assert.IsFalse(result);
    }

    [TestMethod]
    public async Task FUNC30_TC04_CheckOutAsync_MultipleRecords_ShouldUpdateMostRecent()
    {
        // Arrange
        var staff = await SeedStaff();
        var earlierAttendance = new AttendanceRecord
        {
            StaffId = staff.Id,
            Date = DateOnly.FromDateTime(DateTime.Today),
            CheckInTime = new TimeOnly(8, 0),
        };
        var laterAttendance = new AttendanceRecord
        {
            StaffId = staff.Id,
            Date = DateOnly.FromDateTime(DateTime.Today),
            CheckInTime = new TimeOnly(14, 0),
        };
        await _context.AttendanceRecords.AddAsync(earlierAttendance);
        await _context.AttendanceRecords.AddAsync(laterAttendance);
        await _context.SaveChangesAsync();

        // Act
        var result = await _sut.CheckOutAsync(staff.Id);

        // Assert
        Assert.IsTrue(result);
        var updatedLater = await _context.AttendanceRecords.FindAsync(laterAttendance.Id);
        Assert.IsNotNull(updatedLater);
        Assert.IsNotNull(updatedLater.CheckOutTime);
        var updatedEarlier = await _context.AttendanceRecords.FindAsync(earlierAttendance.Id);
        Assert.IsNotNull(updatedEarlier);
        Assert.IsNull(updatedEarlier.CheckOutTime); // Should not update earlier record
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

