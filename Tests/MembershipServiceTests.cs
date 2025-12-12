using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using ApiApplication.Constants;
using ApiApplication.Data;
using ApiApplication.Dtos.Membership;
using ApiApplication.Entities;
using ApiApplication.Entities.Shared;
using ApiApplication.Exceptions;
using ApiApplication.Mappings;
using ApiApplication.Services.Impl;
using ApiApplication.Sessions;
using AutoMapper;
using AutoMapper.Configuration;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using Tests;

namespace Tests;

[TestClass]
public class MembershipServiceTests
{
    private ApplicationDbContext _context = null!;
    private Mock<ICurrentUser> _currentUserMock = null!;
    private IMapper _mapper = null!;
    private MembershipService _sut = null!;

    [TestInitialize]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _currentUserMock = new Mock<ICurrentUser>();
        _context = new ApplicationDbContext(options, _currentUserMock.Object);

        _mapper = TestHelpers.BuildMapper();

        _sut = new MembershipService(_context, _mapper);
    }

    [TestCleanup]
    public void Cleanup()
    {
        _context?.Dispose();
    }

    // FUNC19: CreateAsync
    [TestMethod]
    public async Task FUNC19_TC01_CreateAsync_Success_ShouldCreateMembership()
    {
        // Arrange
        var request = new CreateMembershipRequest
        {
            Name = "Test Membership",
            Price = 1000000m,
            DiscountPercent = 10m,
            Description = "Test Description",
            DurationDays = 30,
            Status = "Active",
        };

        // Act
        await _sut.CreateAsync(request);

        // Assert
        var membership = await _context.Memberships.FirstOrDefaultAsync(m => m.Name == request.Name);
        Assert.IsNotNull(membership);
        Assert.AreEqual(request.Price, membership.Price);
        Assert.AreEqual(request.DiscountPercent, membership.DiscountPercent);
        Assert.AreEqual(request.DurationDays, membership.DurationDays);
        Assert.AreEqual("Active", membership.Status);
    }

    [TestMethod]
    public async Task FUNC19_TC02_CreateAsync_WithoutStatus_ShouldDefaultToActive()
    {
        // Arrange
        var request = new CreateMembershipRequest
        {
            Name = "Test Membership",
            Price = 1000000m,
            DiscountPercent = 10m,
            Description = "Test Description",
            DurationDays = 30,
            Status = null,
        };

        // Act
        await _sut.CreateAsync(request);

        // Assert
        var membership = await _context.Memberships.FirstOrDefaultAsync(m => m.Name == request.Name);
        Assert.IsNotNull(membership);
        Assert.AreEqual("Active", membership.Status);
    }

    [TestMethod]
    public async Task FUNC19_TC03_CreateAsync_WithInactiveStatus_ShouldCreateInactive()
    {
        // Arrange
        var request = new CreateMembershipRequest
        {
            Name = "Test Membership",
            Price = 1000000m,
            DiscountPercent = 10m,
            Description = "Test Description",
            DurationDays = 30,
            Status = "Inactive",
        };

        // Act
        await _sut.CreateAsync(request);

        // Assert
        var membership = await _context.Memberships.FirstOrDefaultAsync(m => m.Name == request.Name);
        Assert.IsNotNull(membership);
        Assert.AreEqual("Inactive", membership.Status);
    }

    [TestMethod]
    public async Task FUNC19_TC04_CreateAsync_WithZeroPrice_ShouldCreate()
    {
        // Arrange
        var request = new CreateMembershipRequest
        {
            Name = "Free Membership",
            Price = 0m,
            DiscountPercent = 5m,
            Description = "Free membership",
            DurationDays = 7,
            Status = "Active",
        };

        // Act
        await _sut.CreateAsync(request);

        // Assert
        var membership = await _context.Memberships.FirstOrDefaultAsync(m => m.Name == request.Name);
        Assert.IsNotNull(membership);
        Assert.AreEqual(0m, membership.Price);
    }

    [TestMethod]
    public async Task FUNC19_TC05_CreateAsync_WithLongDuration_ShouldCreate()
    {
        // Arrange
        var request = new CreateMembershipRequest
        {
            Name = "Annual Membership",
            Price = 10000000m,
            DiscountPercent = 15m,
            Description = "Annual membership",
            DurationDays = 365,
            Status = "Active",
        };

        // Act
        await _sut.CreateAsync(request);

        // Assert
        var membership = await _context.Memberships.FirstOrDefaultAsync(m => m.Name == request.Name);
        Assert.IsNotNull(membership);
        Assert.AreEqual(365, membership.DurationDays);
    }

    // FUNC20: UpdateStatusAsync
    [TestMethod]
    public async Task FUNC20_TC01_UpdateStatusAsync_Success_ShouldUpdateStatus()
    {
        // Arrange
        var membership = new Membership
        {
            Id = 1,
            Name = "Test Membership",
            Price = 1000000m,
            DiscountPercent = 10m,
            DurationDays = 30,
            Status = "Active",
        };
        await _context.Memberships.AddAsync(membership);
        await _context.SaveChangesAsync();

        var request = new UpdateMemberShipStatusRequest
        {
            Id = membership.Id,
            Status = "Inactive",
        };

        // Act
        await _sut.UpdateStatusAsync(request);

        // Assert
        var updated = await _context.Memberships.FindAsync(membership.Id);
        Assert.IsNotNull(updated);
        Assert.AreEqual("Inactive", updated.Status);
    }

    [TestMethod]
    public async Task FUNC20_TC02_UpdateStatusAsync_MembershipNotFound_ShouldThrowException()
    {
        // Arrange
        var request = new UpdateMemberShipStatusRequest
        {
            Id = 999,
            Status = "Inactive",
        };

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ApiException>(async () => await _sut.UpdateStatusAsync(request));
    }

    [TestMethod]
    public async Task FUNC20_TC03_UpdateStatusAsync_InvalidStatus_ShouldThrowException()
    {
        // Arrange
        var membership = new Membership
        {
            Id = 1,
            Name = "Test Membership",
            Price = 1000000m,
            DiscountPercent = 10m,
            DurationDays = 30,
            Status = "Active",
        };
        await _context.Memberships.AddAsync(membership);
        await _context.SaveChangesAsync();

        var request = new UpdateMemberShipStatusRequest
        {
            Id = membership.Id,
            Status = "InvalidStatus",
        };

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ApiException>(async () => await _sut.UpdateStatusAsync(request));
    }

    [TestMethod]
    public async Task FUNC20_TC04_UpdateStatusAsync_ToDeleted_ShouldUpdate()
    {
        // Arrange
        var membership = new Membership
        {
            Id = 1,
            Name = "Test Membership",
            Price = 1000000m,
            DiscountPercent = 10m,
            DurationDays = 30,
            Status = "Active",
        };
        await _context.Memberships.AddAsync(membership);
        await _context.SaveChangesAsync();

        var request = new UpdateMemberShipStatusRequest
        {
            Id = membership.Id,
            Status = "Deleted",
        };

        // Act
        await _sut.UpdateStatusAsync(request);

        // Assert
        var updated = await _context.Memberships.FindAsync(membership.Id);
        Assert.IsNotNull(updated);
        Assert.AreEqual("Deleted", updated.Status);
    }

    [TestMethod]
    public async Task FUNC20_TC05_UpdateStatusAsync_FromInactiveToActive_ShouldUpdate()
    {
        // Arrange
        var membership = new Membership
        {
            Id = 1,
            Name = "Test Membership",
            Price = 1000000m,
            DiscountPercent = 10m,
            DurationDays = 30,
            Status = "Inactive",
        };
        await _context.Memberships.AddAsync(membership);
        await _context.SaveChangesAsync();

        var request = new UpdateMemberShipStatusRequest
        {
            Id = membership.Id,
            Status = "Active",
        };

        // Act
        await _sut.UpdateStatusAsync(request);

        // Assert
        var updated = await _context.Memberships.FindAsync(membership.Id);
        Assert.IsNotNull(updated);
        Assert.AreEqual("Active", updated.Status);
    }
}

