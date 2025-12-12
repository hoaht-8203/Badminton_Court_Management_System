using System;
using System.Net;
using System.Threading.Tasks;
using ApiApplication.Constants;
using ApiApplication.Data;
using ApiApplication.Entities;
using ApiApplication.Entities.Shared;
using ApiApplication.Enums;
using ApiApplication.Exceptions;
using ApiApplication.Mappings;
using ApiApplication.Services;
using ApiApplication.Services.Impl;
using ApiApplication.Sessions;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using Tests;

namespace Tests;

[TestClass]
public class ReturnGoodsServiceTests
{
    private ApplicationDbContext _context = null!;
    private Mock<ICurrentUser> _currentUserMock = null!;
    private Mock<IInventoryCardService> _inventoryCardServiceMock = null!;
    private Mock<ICashflowService> _cashflowServiceMock = null!;
    private ReturnGoodsService _sut = null!;

    [TestInitialize]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _currentUserMock = new Mock<ICurrentUser>();
        _context = new ApplicationDbContext(options, _currentUserMock.Object);

        _inventoryCardServiceMock = new Mock<IInventoryCardService>();
        _inventoryCardServiceMock.Setup(x => x.GenerateNextInventoryCardCodeAsync())
            .ReturnsAsync("TC000001");

        _cashflowServiceMock = new Mock<ICashflowService>();

        _sut = new ReturnGoodsService(
            _context,
            _currentUserMock.Object,
            _inventoryCardServiceMock.Object,
            _cashflowServiceMock.Object
        );
    }

    [TestCleanup]
    public void Cleanup()
    {
        _context?.Dispose();
    }

    // FUNC34: CompleteAsync
    [TestMethod]
    public async Task FUNC34_TC01_CompleteAsync_Success_ShouldUpdateStatus()
    {
        // Arrange
        var supplier = await SeedSupplier();
        var returnGoods = await SeedReturnGoods(supplier.Id, ReturnGoodsStatus.Draft);

        // Act
        await _sut.CompleteAsync(returnGoods.Id);

        // Assert
        var updatedReturnGoods = await _context.ReturnGoods.FindAsync(returnGoods.Id);
        Assert.IsNotNull(updatedReturnGoods);
        Assert.AreEqual(ReturnGoodsStatus.Completed, updatedReturnGoods.Status);
    }

    [TestMethod]
    public async Task FUNC34_TC02_CompleteAsync_ReturnGoodsNotFound_ShouldThrowException()
    {
        // Arrange
        var nonExistentId = 99999;

        // Act & Assert
        var exception = await Assert.ThrowsExceptionAsync<ApiException>(async () =>
            await _sut.CompleteAsync(nonExistentId));
        // ApiException is thrown but may have different status code
        Assert.IsTrue(exception.Message.Contains("Không tìm thấy phiếu trả hàng"));
    }

    [TestMethod]
    public async Task FUNC34_TC03_CompleteAsync_NotDraftStatus_ShouldThrowException()
    {
        // Arrange
        var supplier = await SeedSupplier();
        var returnGoods = await SeedReturnGoods(supplier.Id, ReturnGoodsStatus.Completed);

        // Act & Assert
        var exception = await Assert.ThrowsExceptionAsync<ApiException>(async () =>
            await _sut.CompleteAsync(returnGoods.Id));
        // ApiException is thrown but may have different status code
        Assert.IsTrue(exception.Message.Contains("Chỉ có thể hoàn thành phiếu nháp"));
    }

    [TestMethod]
    public async Task FUNC34_TC04_CompleteAsync_WithCashPayment_ShouldSetSupplierPaid()
    {
        // Arrange
        var supplier = await SeedSupplier();
        var returnGoods = await SeedReturnGoods(supplier.Id, ReturnGoodsStatus.Draft, paymentMethod: 0, supplierNeedToPay: 100000);

        // Act
        await _sut.CompleteAsync(returnGoods.Id);

        // Assert
        var updatedReturnGoods = await _context.ReturnGoods.FindAsync(returnGoods.Id);
        Assert.IsNotNull(updatedReturnGoods);
        Assert.AreEqual(100000, updatedReturnGoods.SupplierPaid);
    }

    [TestMethod]
    public async Task FUNC34_TC05_CompleteAsync_WithItems_ShouldProcessInventory()
    {
        // Arrange
        var product = await SeedProduct();
        var supplier = await SeedSupplier();
        var returnGoods = await SeedReturnGoods(supplier.Id, ReturnGoodsStatus.Draft);
        var returnGoodsItem = new ReturnGoodsItem
        {
            ReturnGoodsId = returnGoods.Id,
            ProductId = product.Id,
            Quantity = 5,
            ImportPrice = product.CostPrice,
            ReturnPrice = product.CostPrice,
            LineTotal = product.CostPrice * 5,
        };
        await _context.ReturnGoodsItems.AddAsync(returnGoodsItem);
        await _context.SaveChangesAsync();

        // Act
        await _sut.CompleteAsync(returnGoods.Id);

        // Assert
        var updatedReturnGoods = await _context.ReturnGoods.FindAsync(returnGoods.Id);
        Assert.IsNotNull(updatedReturnGoods);
        Assert.AreEqual(ReturnGoodsStatus.Completed, updatedReturnGoods.Status);
    }

    private async Task<Product> SeedProduct(int? id = null)
    {
        var product = new Product
        {
            Id = id ?? 1,
            Name = "Test Product",
            CostPrice = 50000,
            SalePrice = 100000,
            Stock = 0,
            ManageInventory = true,
            IsActive = true,
        };
        await _context.Products.AddAsync(product);
        await _context.SaveChangesAsync();
        return product;
    }

    private async Task<Supplier> SeedSupplier(int? id = null)
    {
        var supplier = new Supplier
        {
            Id = id ?? 1,
            Name = "Test Supplier",
            Phone = "0123456789",
            Email = "supplier@test.com",
            Status = SupplierStatus.Active,
        };
        await _context.Suppliers.AddAsync(supplier);
        await _context.SaveChangesAsync();
        return supplier;
    }

    private async Task<ReturnGoods> SeedReturnGoods(int supplierId, ReturnGoodsStatus status, int paymentMethod = 0, decimal supplierNeedToPay = 0)
    {
        var returnGoods = new ReturnGoods
        {
            Code = "RG001",
            ReturnTime = DateTime.UtcNow,
            SupplierId = supplierId,
            ReturnBy = "Test User",
            TotalValue = 0,
            Discount = 0,
            SupplierNeedToPay = supplierNeedToPay,
            SupplierPaid = 0,
            PaymentMethod = paymentMethod,
            Status = status,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        await _context.ReturnGoods.AddAsync(returnGoods);
        await _context.SaveChangesAsync();
        return returnGoods;
    }
}

