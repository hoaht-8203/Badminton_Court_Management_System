using System;
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
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using AutoMapper.Configuration;
using Tests;

namespace Tests;

[TestClass]
public class StaffServiceTests
{
    private ApplicationDbContext _context = null!;
    private Mock<ICurrentUser> _currentUserMock = null!;
    private IMapper _mapper = null!;
    private StaffService _sut = null!;

    [TestInitialize]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _currentUserMock = new Mock<ICurrentUser>();
        _context = new ApplicationDbContext(options, _currentUserMock.Object);

        _mapper = TestHelpers.BuildMapper();

        _sut = new StaffService(_context, _mapper, _currentUserMock.Object);
    }

    [TestCleanup]
    public void Cleanup()
    {
        _context?.Dispose();
    }

    // FUNC23: CreateStaffAsync
    [TestMethod]
    public async Task FUNC23_TC01_CreateStaffAsync_Success_ShouldCreateStaff()
    {
        // Arrange
        var request = new StaffRequest
        {
            FullName = "Test Staff",
            PhoneNumber = "0123456789",
            IdentificationNumber = "123456789012",
            IsActive = true,
            SalarySettings = "{}",
        };

        // Act
        await _sut.CreateStaffAsync(request);

        // Assert
        var staff = await _context.Staffs.FirstOrDefaultAsync(s => s.FullName == request.FullName);
        Assert.IsNotNull(staff);
        Assert.AreEqual(request.PhoneNumber, staff.PhoneNumber);
        Assert.AreEqual(request.IdentificationNumber, staff.IdentificationNumber);
    }

    [TestMethod]
    public async Task FUNC23_TC02_CreateStaffAsync_InvalidIdentificationNumber_ShouldThrowException()
    {
        // Arrange
        var request = new StaffRequest
        {
            FullName = "Test Staff",
            PhoneNumber = "0123456789",
            IdentificationNumber = "12345", // Invalid: not 12 digits
            IsActive = true,
            SalarySettings = "{}",
        };

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ApiException>(async () => await _sut.CreateStaffAsync(request));
    }

    [TestMethod]
    public async Task FUNC23_TC03_CreateStaffAsync_DuplicateIdentificationNumber_ShouldThrowException()
    {
        // Arrange
        var existingStaff = new Staff
        {
            Id = 1,
            FullName = "Existing Staff",
            IdentificationNumber = "123456789012",
            IsActive = true,
            SalarySettings = "{}",
        };
        await _context.Staffs.AddAsync(existingStaff);
        await _context.SaveChangesAsync();

        var request = new StaffRequest
        {
            FullName = "New Staff",
            PhoneNumber = "0987654321",
            IdentificationNumber = "123456789012", // Duplicate
            IsActive = true,
            SalarySettings = "{}",
        };

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ApiException>(async () => await _sut.CreateStaffAsync(request));
    }

    [TestMethod]
    public async Task FUNC23_TC04_CreateStaffAsync_InvalidPhoneNumber_ShouldThrowException()
    {
        // Arrange
        var request = new StaffRequest
        {
            FullName = "Test Staff",
            PhoneNumber = "12345", // Invalid: too short
            IsActive = true,
            SalarySettings = "{}",
        };

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ApiException>(async () => await _sut.CreateStaffAsync(request));
    }

    [TestMethod]
    public async Task FUNC23_TC05_CreateStaffAsync_DuplicatePhoneNumber_ShouldThrowException()
    {
        // Arrange
        var existingStaff = new Staff
        {
            Id = 1,
            FullName = "Existing Staff",
            PhoneNumber = "0123456789",
            IsActive = true,
            SalarySettings = "{}",
        };
        await _context.Staffs.AddAsync(existingStaff);
        await _context.SaveChangesAsync();

        var request = new StaffRequest
        {
            FullName = "New Staff",
            PhoneNumber = "0123456789", // Duplicate
            IsActive = true,
            SalarySettings = "{}",
        };

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ApiException>(async () => await _sut.CreateStaffAsync(request));
    }

    [TestMethod]
    public async Task FUNC23_TC06_CreateStaffAsync_WithoutOptionalFields_ShouldCreate()
    {
        // Arrange
        var request = new StaffRequest
        {
            FullName = "Test Staff",
            IsActive = true,
            SalarySettings = "{}",
        };

        // Act
        await _sut.CreateStaffAsync(request);

        // Assert
        var staff = await _context.Staffs.FirstOrDefaultAsync(s => s.FullName == request.FullName);
        Assert.IsNotNull(staff);
        Assert.IsNull(staff.PhoneNumber);
        Assert.IsNull(staff.IdentificationNumber);
    }

    // FUNC24: ChangeStaffStatusAsync
    [TestMethod]
    public async Task FUNC24_TC01_ChangeStaffStatusAsync_Success_ShouldUpdateStatus()
    {
        // Arrange
        var staff = new Staff
        {
            Id = 1,
            FullName = "Test Staff",
            IsActive = true,
            SalarySettings = "{}",
        };
        await _context.Staffs.AddAsync(staff);
        await _context.SaveChangesAsync();

        var request = new ChangeStaffStatusRequest
        {
            StaffId = staff.Id,
            IsActive = false,
        };

        // Act
        await _sut.ChangeStaffStatusAsync(request);

        // Assert
        var updated = await _context.Staffs.FindAsync(staff.Id);
        Assert.IsNotNull(updated);
        Assert.IsFalse(updated.IsActive);
    }

    [TestMethod]
    public async Task FUNC24_TC02_ChangeStaffStatusAsync_StaffNotFound_ShouldThrowException()
    {
        // Arrange
        var request = new ChangeStaffStatusRequest
        {
            StaffId = 999,
            IsActive = false,
        };

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ApiException>(async () => await _sut.ChangeStaffStatusAsync(request));
    }

    [TestMethod]
    public async Task FUNC24_TC03_ChangeStaffStatusAsync_ActivateStaff_ShouldSetActive()
    {
        // Arrange
        var staff = new Staff
        {
            Id = 1,
            FullName = "Test Staff",
            IsActive = false,
            SalarySettings = "{}",
        };
        await _context.Staffs.AddAsync(staff);
        await _context.SaveChangesAsync();

        var request = new ChangeStaffStatusRequest
        {
            StaffId = staff.Id,
            IsActive = true,
        };

        // Act
        await _sut.ChangeStaffStatusAsync(request);

        // Assert
        var updated = await _context.Staffs.FindAsync(staff.Id);
        Assert.IsNotNull(updated);
        Assert.IsTrue(updated.IsActive);
    }

    [TestMethod]
    public async Task FUNC24_TC04_ChangeStaffStatusAsync_DeactivateStaff_ShouldSetInactive()
    {
        // Arrange
        var staff = new Staff
        {
            Id = 1,
            FullName = "Test Staff",
            IsActive = true,
            SalarySettings = "{}",
        };
        await _context.Staffs.AddAsync(staff);
        await _context.SaveChangesAsync();

        var request = new ChangeStaffStatusRequest
        {
            StaffId = staff.Id,
            IsActive = false,
        };

        // Act
        await _sut.ChangeStaffStatusAsync(request);

        // Assert
        var updated = await _context.Staffs.FindAsync(staff.Id);
        Assert.IsNotNull(updated);
        Assert.IsFalse(updated.IsActive);
    }
}

