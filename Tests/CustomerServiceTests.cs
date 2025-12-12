using System;
using System.Net;
using System.Threading.Tasks;
using ApiApplication.Constants;
using ApiApplication.Data;
using ApiApplication.Dtos.Customer;
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
public class CustomerServiceTests
{
    private ApplicationDbContext _context = null!;
    private Mock<ICurrentUser> _currentUserMock = null!;
    private IMapper _mapper = null!;
    private CustomerService _sut = null!;

    [TestInitialize]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _currentUserMock = new Mock<ICurrentUser>();
        _context = new ApplicationDbContext(options, _currentUserMock.Object);

        _mapper = TestHelpers.BuildMapper();

        _sut = new CustomerService(_context, _mapper, _currentUserMock.Object);
    }

    [TestCleanup]
    public void Cleanup()
    {
        _context?.Dispose();
    }

    // FUNC38: ChangeCustomerStatusAsync
    [TestMethod]
    public async Task FUNC38_TC01_ChangeCustomerStatusAsync_Success_ShouldUpdateStatus()
    {
        // Arrange
        var customer = await SeedCustomer();
        var request = new ChangeCustomerStatusRequest
        {
            Id = customer.Id,
            Status = CustomerStatus.Inactive,
        };

        // Act
        var result = await _sut.ChangeCustomerStatusAsync(request);

        // Assert
        Assert.IsNotNull(result);
        Assert.AreEqual(CustomerStatus.Inactive, result.Status);
        var updatedCustomer = await _context.Customers.FindAsync(customer.Id);
        Assert.IsNotNull(updatedCustomer);
        Assert.AreEqual(CustomerStatus.Inactive, updatedCustomer.Status);
    }

    [TestMethod]
    public async Task FUNC38_TC02_ChangeCustomerStatusAsync_CustomerNotFound_ShouldThrowException()
    {
        // Arrange
        var request = new ChangeCustomerStatusRequest
        {
            Id = 99999,
            Status = CustomerStatus.Active,
        };

        // Act & Assert
        var exception = await Assert.ThrowsExceptionAsync<ApiException>(async () =>
            await _sut.ChangeCustomerStatusAsync(request));
        Assert.AreEqual(HttpStatusCode.BadRequest, exception.StatusCode);
        Assert.IsTrue(exception.Message.Contains("does not exist"));
    }

    [TestMethod]
    public async Task FUNC38_TC03_ChangeCustomerStatusAsync_InvalidStatus_ShouldThrowException()
    {
        // Arrange
        var customer = await SeedCustomer();
        var request = new ChangeCustomerStatusRequest
        {
            Id = customer.Id,
            Status = "InvalidStatus",
        };

        // Act & Assert
        var exception = await Assert.ThrowsExceptionAsync<ApiException>(async () =>
            await _sut.ChangeCustomerStatusAsync(request));
        Assert.AreEqual(HttpStatusCode.BadRequest, exception.StatusCode);
        Assert.IsTrue(exception.Message.Contains("Invalid status"));
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

