using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Security.Claims;
using System.Threading.Tasks;
using ApiApplication.Constants;
using ApiApplication.Data;
using ApiApplication.Dtos.Membership.UserMembership;
using ApiApplication.Dtos.Payment;
using ApiApplication.Entities;
using ApiApplication.Entities.Shared;
using ApiApplication.Exceptions;
using ApiApplication.Mappings;
using ApiApplication.Processors;
using ApiApplication.Services;
using ApiApplication.Services.Impl;
using ApiApplication.Sessions;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using AutoMapper.Configuration;
using Tests;

namespace Tests;

[TestClass]
public class UserMembershipServiceTests
{
    private ApplicationDbContext _context = null!;
    private Mock<IPaymentService> _paymentServiceMock = null!;
    private Mock<IConfiguration> _configurationMock = null!;
    private Mock<ICurrentUser> _currentUserMock = null!;
    private Mock<UserManager<ApplicationUser>> _userManagerMock = null!;
    private IMapper _mapper = null!;
    private UserMembershipService _sut = null!;

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

        _mapper = TestHelpers.BuildMapper();

        _sut = new UserMembershipService(
            _context,
            _mapper,
            _paymentServiceMock.Object,
            _configurationMock.Object,
            _currentUserMock.Object,
            _userManagerMock.Object
        );
    }

    [TestCleanup]
    public void Cleanup()
    {
        _context?.Dispose();
    }

    private async Task<Customer> SeedCustomer(int? id = null, Guid? userId = null)
    {
        var customer = new Customer
        {
            Id = id ?? 1,
            FullName = "Test Customer",
            PhoneNumber = "0123456789",
            Email = "customer@test.com",
            Status = CustomerStatus.Active,
            UserId = userId,
        };
        await _context.Customers.AddAsync(customer);
        await _context.SaveChangesAsync();
        return customer;
    }

    private async Task<Membership> SeedMembership(int? id = null, string status = "Active")
    {
        var membership = new Membership
        {
            Id = id ?? 1,
            Name = "Test Membership",
            Price = 1000000m,
            DiscountPercent = 10m,
            DurationDays = 30,
            Status = status,
        };
        await _context.Memberships.AddAsync(membership);
        await _context.SaveChangesAsync();
        return membership;
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

    // FUNC21: CreateForCurrentUserAsync
    [TestMethod]
    public async Task FUNC21_TC01_CreateForCurrentUserAsync_Success_ShouldCreateMembership()
    {
        // Arrange
        var user = await SeedUser();
        var customer = await SeedCustomer(userId: user.Id);
        var membership = await SeedMembership();

        var request = new CreateUserMembershipForCurrentUserRequest
        {
            MembershipId = membership.Id,
            IsActive = false,
        };

        _currentUserMock.Setup(x => x.UserId).Returns(user.Id);
        _userManagerMock.Setup(x => x.FindByIdAsync(It.IsAny<string>())).ReturnsAsync(user);
        _paymentServiceMock.Setup(x => x.CreatePaymentForMembershipAsync(It.IsAny<CreatePaymentForMembershipRequest>()))
            .ReturnsAsync(new DetailPaymentResponse { Id = Guid.NewGuid().ToString(), Amount = membership.Price });
        _configurationMock.Setup(x => x["Booking:HoldMinutes"]).Returns("5");

        // Act
        var result = await _sut.CreateForCurrentUserAsync(request);

        // Assert
        Assert.IsNotNull(result);
        var userMembership = await _context.UserMemberships.FirstOrDefaultAsync(um =>
            um.CustomerId == customer.Id && um.MembershipId == membership.Id
        );
        Assert.IsNotNull(userMembership);
        Assert.AreEqual("PendingPayment", userMembership.Status);
        Assert.IsFalse(userMembership.IsActive);
    }

    [TestMethod]
    public async Task FUNC21_TC02_CreateForCurrentUserAsync_NoUserId_ShouldThrowException()
    {
        // Arrange
        var membership = await SeedMembership();
        var request = new CreateUserMembershipForCurrentUserRequest
        {
            MembershipId = membership.Id,
        };

        _currentUserMock.Setup(x => x.UserId).Returns((Guid?)null);

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ApiException>(async () => await _sut.CreateForCurrentUserAsync(request));
    }

    [TestMethod]
    public async Task FUNC21_TC03_CreateForCurrentUserAsync_NoCustomer_ShouldThrowException()
    {
        // Arrange
        var user = await SeedUser();
        var membership = await SeedMembership();

        var request = new CreateUserMembershipForCurrentUserRequest
        {
            MembershipId = membership.Id,
        };

        _currentUserMock.Setup(x => x.UserId).Returns(user.Id);
        _userManagerMock.Setup(x => x.FindByIdAsync(It.IsAny<string>())).ReturnsAsync(user);

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ApiException>(async () => await _sut.CreateForCurrentUserAsync(request));
    }

    [TestMethod]
    public async Task FUNC21_TC04_CreateForCurrentUserAsync_MembershipNotFound_ShouldThrowException()
    {
        // Arrange
        var user = await SeedUser();
        var customer = await SeedCustomer(userId: user.Id);

        var request = new CreateUserMembershipForCurrentUserRequest
        {
            MembershipId = 999,
        };

        _currentUserMock.Setup(x => x.UserId).Returns(user.Id);
        _userManagerMock.Setup(x => x.FindByIdAsync(It.IsAny<string>())).ReturnsAsync(user);

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ApiException>(async () => await _sut.CreateForCurrentUserAsync(request));
    }

    [TestMethod]
    public async Task FUNC21_TC05_CreateForCurrentUserAsync_MembershipInactive_ShouldThrowException()
    {
        // Arrange
        var user = await SeedUser();
        var customer = await SeedCustomer(userId: user.Id);
        var membership = await SeedMembership(status: "Inactive");

        var request = new CreateUserMembershipForCurrentUserRequest
        {
            MembershipId = membership.Id,
        };

        _currentUserMock.Setup(x => x.UserId).Returns(user.Id);
        _userManagerMock.Setup(x => x.FindByIdAsync(It.IsAny<string>())).ReturnsAsync(user);

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ApiException>(async () => await _sut.CreateForCurrentUserAsync(request));
    }

    [TestMethod]
    public async Task FUNC21_TC06_CreateForCurrentUserAsync_ExistingUnexpiredMembership_ShouldThrowException()
    {
        // Arrange
        var user = await SeedUser();
        var customer = await SeedCustomer(userId: user.Id);
        var membership1 = await SeedMembership(1);
        var membership2 = await SeedMembership(2);

        var existingMembership = new UserMembership
        {
            Id = 1,
            CustomerId = customer.Id,
            MembershipId = membership1.Id,
            StartDate = DateTime.UtcNow.AddDays(-10),
            EndDate = DateTime.UtcNow.AddDays(20),
            IsActive = true,
            Status = "Paid",
        };
        await _context.UserMemberships.AddAsync(existingMembership);
        await _context.SaveChangesAsync();

        var request = new CreateUserMembershipForCurrentUserRequest
        {
            MembershipId = membership2.Id,
        };

        _currentUserMock.Setup(x => x.UserId).Returns(user.Id);
        _userManagerMock.Setup(x => x.FindByIdAsync(It.IsAny<string>())).ReturnsAsync(user);

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ApiException>(async () => await _sut.CreateForCurrentUserAsync(request));
    }

    // FUNC22: ExtendPaymentAsync
    [TestMethod]
    public async Task FUNC22_TC01_ExtendPaymentAsync_Success_ShouldExtendPayment()
    {
        // Arrange
        var customer = await SeedCustomer();
        var membership = await SeedMembership();

        var userMembership = new UserMembership
        {
            Id = 1,
            CustomerId = customer.Id,
            MembershipId = membership.Id,
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddDays(30),
            IsActive = false,
            Status = "PendingPayment",
        };
        await _context.UserMemberships.AddAsync(userMembership);
        await _context.SaveChangesAsync();

        var request = new ExtendPaymentRequest
        {
            UserMembershipId = userMembership.Id,
            Note = "Extend payment",
        };

        _paymentServiceMock.Setup(x => x.CreatePaymentForMembershipAsync(It.IsAny<CreatePaymentForMembershipRequest>()))
            .ReturnsAsync(new DetailPaymentResponse { Id = Guid.NewGuid().ToString(), Amount = membership.Price });
        _configurationMock.Setup(x => x["Booking:HoldMinutes"]).Returns("5");

        // Act
        var result = await _sut.ExtendPaymentAsync(request);

        // Assert
        Assert.IsNotNull(result);
        var updated = await _context.UserMemberships.FindAsync(userMembership.Id);
        Assert.IsNotNull(updated);
        Assert.AreEqual("PendingPayment", updated.Status);
        Assert.IsFalse(updated.IsActive);
    }

    [TestMethod]
    public async Task FUNC22_TC02_ExtendPaymentAsync_UserMembershipNotFound_ShouldThrowException()
    {
        // Arrange
        var request = new ExtendPaymentRequest
        {
            UserMembershipId = 999,
        };

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ApiException>(async () => await _sut.ExtendPaymentAsync(request));
    }

    [TestMethod]
    public async Task FUNC22_TC03_ExtendPaymentAsync_AlreadyPaid_ShouldThrowException()
    {
        // Arrange
        var customer = await SeedCustomer();
        var membership = await SeedMembership();

        var userMembership = new UserMembership
        {
            Id = 1,
            CustomerId = customer.Id,
            MembershipId = membership.Id,
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddDays(30),
            IsActive = true,
            Status = "Paid",
        };
        await _context.UserMemberships.AddAsync(userMembership);
        await _context.SaveChangesAsync();

        var request = new ExtendPaymentRequest
        {
            UserMembershipId = userMembership.Id,
        };

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ApiException>(async () => await _sut.ExtendPaymentAsync(request));
    }

    [TestMethod]
    public async Task FUNC22_TC04_ExtendPaymentAsync_ShouldCreateNewPayment()
    {
        // Arrange
        var customer = await SeedCustomer();
        var membership = await SeedMembership();

        var userMembership = new UserMembership
        {
            Id = 1,
            CustomerId = customer.Id,
            MembershipId = membership.Id,
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddDays(30),
            IsActive = false,
            Status = "PendingPayment",
        };
        await _context.UserMemberships.AddAsync(userMembership);
        await _context.SaveChangesAsync();

        var request = new ExtendPaymentRequest
        {
            UserMembershipId = userMembership.Id,
            Note = "Extend payment",
        };

        _paymentServiceMock.Setup(x => x.CreatePaymentForMembershipAsync(It.IsAny<CreatePaymentForMembershipRequest>()))
            .ReturnsAsync(new DetailPaymentResponse { Id = Guid.NewGuid().ToString(), Amount = membership.Price });
        _configurationMock.Setup(x => x["Booking:HoldMinutes"]).Returns("5");

        // Act
        var result = await _sut.ExtendPaymentAsync(request);

        // Assert
        Assert.IsNotNull(result);
        _paymentServiceMock.Verify(x => x.CreatePaymentForMembershipAsync(It.IsAny<CreatePaymentForMembershipRequest>()), Times.Once);
    }

    [TestMethod]
    public async Task FUNC22_TC05_ExtendPaymentAsync_ShouldResetStatusToPending()
    {
        // Arrange
        var customer = await SeedCustomer();
        var membership = await SeedMembership();

        var userMembership = new UserMembership
        {
            Id = 1,
            CustomerId = customer.Id,
            MembershipId = membership.Id,
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddDays(30),
            IsActive = false,
            Status = "Cancelled",
        };
        await _context.UserMemberships.AddAsync(userMembership);
        await _context.SaveChangesAsync();

        var request = new ExtendPaymentRequest
        {
            UserMembershipId = userMembership.Id,
        };

        _paymentServiceMock.Setup(x => x.CreatePaymentForMembershipAsync(It.IsAny<CreatePaymentForMembershipRequest>()))
            .ReturnsAsync(new DetailPaymentResponse { Id = Guid.NewGuid().ToString(), Amount = membership.Price });
        _configurationMock.Setup(x => x["Booking:HoldMinutes"]).Returns("5");

        // Act
        await _sut.ExtendPaymentAsync(request);

        // Assert
        var updated = await _context.UserMemberships.FindAsync(userMembership.Id);
        Assert.IsNotNull(updated);
        Assert.AreEqual("PendingPayment", updated.Status);
        Assert.IsFalse(updated.IsActive);
    }
}

