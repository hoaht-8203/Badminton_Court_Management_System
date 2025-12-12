using System;
using System.Net;
using System.Threading.Tasks;
using ApiApplication.Constants;
using ApiApplication.Data;
using ApiApplication.Dtos.Court;
using ApiApplication.Entities;
using ApiApplication.Exceptions;
using ApiApplication.Mappings;
using ApiApplication.Services.Impl;
using ApiApplication.Sessions;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using Tests;
using ApiApplication.Entities.Shared;
using ApiApplication.Dtos.Customer;

namespace Tests;

[TestClass]
public class CourtServiceTests
{
    private ApplicationDbContext _context = null!;
    private Mock<ICurrentUser> _currentUserMock = null!;
    private IMapper _mapper = null!;
    private CourtService _sut = null!;

    [TestInitialize]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _currentUserMock = new Mock<ICurrentUser>();
        _context = new ApplicationDbContext(options, _currentUserMock.Object);

        _mapper = TestHelpers.BuildMapper();

        _sut = new CourtService(_context, _mapper, _currentUserMock.Object);
    }

    [TestCleanup]
    public void Cleanup()
    {
        _context?.Dispose();
    }

    // FUNC40: ChangeCourtStatusAsync
    [TestMethod]
    public async Task FUNC40_TC01_ChangeCourtStatusAsync_Success_ShouldUpdateStatus()
    {
        // Arrange
        var court = await SeedCourt();
        var request = new ApiApplication.Dtos.Customer.ChangeCourtStatusRequest
        {
            Id = court.Id,
            Status = CourtStatus.Inactive,
        };

        // Act
        var result = await _sut.ChangeCourtStatusAsync(request);

        // Assert
        Assert.IsNotNull(result);
        Assert.AreEqual(CourtStatus.Inactive, result.Status);
        var updatedCourt = await _context.Courts.FindAsync(court.Id);
        Assert.IsNotNull(updatedCourt);
        Assert.AreEqual(CourtStatus.Inactive, updatedCourt.Status);
    }

    [TestMethod]
    public async Task FUNC40_TC02_ChangeCourtStatusAsync_CourtNotFound_ShouldThrowException()
    {
        // Arrange
        var request = new ApiApplication.Dtos.Customer.ChangeCourtStatusRequest
        {
            Id = Guid.NewGuid(),
            Status = CourtStatus.Active,
        };

        // Act & Assert
        var exception = await Assert.ThrowsExceptionAsync<ApiException>(async () =>
            await _sut.ChangeCourtStatusAsync(request));
        Assert.AreEqual(HttpStatusCode.BadRequest, exception.StatusCode);
        Assert.IsTrue(exception.Message.Contains("không tồn tại"));
    }

    [TestMethod]
    public async Task FUNC40_TC03_ChangeCourtStatusAsync_InvalidStatus_ShouldThrowException()
    {
        // Arrange
        var court = await SeedCourt();
        var request = new ApiApplication.Dtos.Customer.ChangeCourtStatusRequest
        {
            Id = court.Id,
            Status = "InvalidStatus",
        };

        // Act & Assert
        var exception = await Assert.ThrowsExceptionAsync<ApiException>(async () =>
            await _sut.ChangeCourtStatusAsync(request));
        Assert.AreEqual(HttpStatusCode.BadRequest, exception.StatusCode);
        Assert.IsTrue(exception.Message.Contains("không hợp lệ"));
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
}

