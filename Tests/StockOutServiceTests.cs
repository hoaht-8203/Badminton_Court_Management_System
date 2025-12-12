using System;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using ApiApplication.Constants;
using ApiApplication.Data;
using ApiApplication.Entities;
using ApiApplication.Entities.Shared;
using ApiApplication.Exceptions;
using ApiApplication.Mappings;
using ApiApplication.Services;
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
public class StockOutServiceTests
{
    private ApplicationDbContext _context = null!;
    private Mock<IInventoryCardService> _inventoryCardServiceMock = null!;
    private IMapper _mapper = null!;
    private StockOutService _sut = null!;

    [TestInitialize]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var currentUserMock = new Mock<ICurrentUser>();
        _context = new ApplicationDbContext(options, currentUserMock.Object);

        _mapper = TestHelpers.BuildMapper();
        _inventoryCardServiceMock = new Mock<IInventoryCardService>();
        _inventoryCardServiceMock.Setup(x => x.GenerateNextInventoryCardCodeAsync())
            .ReturnsAsync("TC000001");

        _sut = new StockOutService(_context, _mapper, _inventoryCardServiceMock.Object);
    }

    [TestCleanup]
    public void Cleanup()
    {
        _context?.Dispose();
    }

    // FUNC33: CompleteAsync
    [TestMethod]
    public async Task FUNC33_TC01_CompleteAsync_Success_ShouldUpdateStatusAndProcess()
    {
        // Arrange
        var product = await SeedProduct();
        var supplier = await SeedSupplier();
        var stockOut = await SeedStockOut(supplier.Id, StockOutStatus.Draft);
        var stockOutItem = new StockOutItem
        {
            StockOutId = stockOut.Id,
            ProductId = product.Id,
            Quantity = 5,
            CostPrice = product.CostPrice,
        };
        await _context.StockOutItems.AddAsync(stockOutItem);
        await _context.SaveChangesAsync();

        // Act
        await _sut.CompleteAsync(stockOut.Id);

        // Assert
        var updatedStockOut = await _context.StockOuts.FindAsync(stockOut.Id);
        Assert.IsNotNull(updatedStockOut);
        Assert.AreEqual(StockOutStatus.Completed, updatedStockOut.Status);
    }

    [TestMethod]
    public async Task FUNC33_TC02_CompleteAsync_StockOutNotFound_ShouldThrowException()
    {
        // Arrange
        var nonExistentId = 99999;

        // Act & Assert
        var exception = await Assert.ThrowsExceptionAsync<ArgumentException>(async () =>
            await _sut.CompleteAsync(nonExistentId));
        Assert.IsTrue(exception.Message.Contains("not found"));
    }

    [TestMethod]
    public async Task FUNC33_TC03_CompleteAsync_NotDraftStatus_ShouldThrowException()
    {
        // Arrange
        var supplier = await SeedSupplier();
        var stockOut = await SeedStockOut(supplier.Id, StockOutStatus.Completed);

        // Act & Assert
        var exception = await Assert.ThrowsExceptionAsync<InvalidOperationException>(async () =>
            await _sut.CompleteAsync(stockOut.Id));
        Assert.IsTrue(exception.Message.Contains("Only draft stock outs can be completed"));
    }

    [TestMethod]
    public async Task FUNC33_TC04_CompleteAsync_WithItems_ShouldDeductStock()
    {
        // Arrange
        var product = await SeedProduct(manageInventory: true, stock: 10);
        var supplier = await SeedSupplier();
        var stockOut = await SeedStockOut(supplier.Id, StockOutStatus.Draft);
        var stockOutItem = new StockOutItem
        {
            StockOutId = stockOut.Id,
            ProductId = product.Id,
            Quantity = 3,
        };
        await _context.StockOutItems.AddAsync(stockOutItem);
        await _context.SaveChangesAsync();

        // Act
        await _sut.CompleteAsync(stockOut.Id);

        // Assert
        var updatedProduct = await _context.Products.FindAsync(product.Id);
        Assert.IsNotNull(updatedProduct);
        Assert.AreEqual(7, updatedProduct.Stock); // 10 - 3 = 7
    }

    private async Task<Product> SeedProduct(int? id = null, bool manageInventory = true, int stock = 0)
    {
        var product = new Product
        {
            Id = id ?? 1,
            Name = "Test Product",
            CostPrice = 50000,
            SalePrice = 100000,
            Stock = stock,
            ManageInventory = manageInventory,
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
            Status = "Active",
        };
        await _context.Suppliers.AddAsync(supplier);
        await _context.SaveChangesAsync();
        return supplier;
    }

    private async Task<StockOut> SeedStockOut(int supplierId, StockOutStatus status)
    {
        var stockOut = new StockOut
        {
            Code = "SO001",
            OutTime = DateTime.UtcNow,
            SupplierId = supplierId,
            OutBy = "Test User",
            TotalValue = 0,
            Status = status,
        };
        await _context.StockOuts.AddAsync(stockOut);
        await _context.SaveChangesAsync();
        return stockOut;
    }
}

