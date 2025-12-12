using System;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using ApiApplication.Data;
using ApiApplication.Dtos.InventoryCard;
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
public class InventoryCardServiceTests
{
    private ApplicationDbContext _context = null!;
    private InventoryCardService _sut = null!;

    [TestInitialize]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var currentUserMock = new Mock<ICurrentUser>();
        _context = new ApplicationDbContext(options, currentUserMock.Object);

        _sut = new InventoryCardService(_context);
    }

    [TestCleanup]
    public void Cleanup()
    {
        _context?.Dispose();
    }

    // FUNC31: CreateInventoryCardForSaleAsync
    [TestMethod]
    public async Task FUNC31_TC01_CreateInventoryCardForSaleAsync_Success_ShouldDeductStock()
    {
        // Arrange
        var product = await SeedProduct(manageInventory: true, stock: 10);
        var request = new CreateInventoryCardForSaleRequest
        {
            ProductId = product.Id,
            Code = "TC000001",
            Method = "Sale",
            OccurredAt = DateTime.UtcNow,
            CostPrice = 50000,
            QuantitySold = 3,
            UpdateProductStock = true,
        };

        // Act
        var result = await _sut.CreateInventoryCardForSaleAsync(request);

        // Assert
        Assert.IsNotNull(result);
        Assert.AreEqual(product.Id, result.ProductId);
        Assert.AreEqual(-3, result.QuantityChange); // Negative for sale
        Assert.AreEqual(7, result.EndingStock); // 10 - 3 = 7

        var updatedProduct = await _context.Products.FindAsync(product.Id);
        Assert.IsNotNull(updatedProduct);
        Assert.AreEqual(7, updatedProduct.Stock);

        var inventoryCard = await _context.InventoryCards.FirstOrDefaultAsync(ic =>
            ic.ProductId == product.Id && ic.Code == request.Code);
        Assert.IsNotNull(inventoryCard);
    }

    [TestMethod]
    public async Task FUNC31_TC02_CreateInventoryCardForSaleAsync_ProductNotFound_ShouldThrowException()
    {
        // Arrange
        var request = new CreateInventoryCardForSaleRequest
        {
            ProductId = 99999, // Non-existent product
            Code = "TC000001",
            Method = "Sale",
            OccurredAt = DateTime.UtcNow,
            CostPrice = 50000,
            QuantitySold = 3,
            UpdateProductStock = true,
        };

        // Act & Assert
        var exception = await Assert.ThrowsExceptionAsync<ApiException>(async () =>
            await _sut.CreateInventoryCardForSaleAsync(request));
        Assert.AreEqual(HttpStatusCode.NotFound, exception.StatusCode);
        Assert.IsTrue(exception.Message.Contains("không tồn tại"));
    }

    [TestMethod]
    public async Task FUNC31_TC03_CreateInventoryCardForSaleAsync_ProductNotManageInventory_ShouldThrowException()
    {
        // Arrange
        var product = await SeedProduct(manageInventory: false, stock: 10);
        var request = new CreateInventoryCardForSaleRequest
        {
            ProductId = product.Id,
            Code = "TC000001",
            Method = "Sale",
            OccurredAt = DateTime.UtcNow,
            CostPrice = 50000,
            QuantitySold = 3,
            UpdateProductStock = true,
        };

        // Act & Assert
        var exception = await Assert.ThrowsExceptionAsync<ApiException>(async () =>
            await _sut.CreateInventoryCardForSaleAsync(request));
        Assert.AreEqual(HttpStatusCode.BadRequest, exception.StatusCode);
        Assert.IsTrue(exception.Message.Contains("không quản lý tồn kho"));
    }

    [TestMethod]
    public async Task FUNC31_TC04_CreateInventoryCardForSaleAsync_UpdateProductStockFalse_ShouldNotDeductStock()
    {
        // Arrange
        var product = await SeedProduct(manageInventory: true, stock: 10);
        var request = new CreateInventoryCardForSaleRequest
        {
            ProductId = product.Id,
            Code = "TC000001",
            Method = "Sale",
            OccurredAt = DateTime.UtcNow,
            CostPrice = 50000,
            QuantitySold = 3,
            UpdateProductStock = false, // Don't update stock
        };

        // Act
        var result = await _sut.CreateInventoryCardForSaleAsync(request);

        // Assert
        Assert.IsNotNull(result);
        Assert.AreEqual(-3, result.QuantityChange);
        Assert.AreEqual(10, result.EndingStock); // Stock unchanged

        var updatedProduct = await _context.Products.FindAsync(product.Id);
        Assert.IsNotNull(updatedProduct);
        Assert.AreEqual(10, updatedProduct.Stock); // Stock should remain unchanged
    }

    [TestMethod]
    public async Task FUNC31_TC05_CreateInventoryCardForSaleAsync_InsufficientStock_ShouldThrowException()
    {
        // Arrange
        var product = await SeedProduct(manageInventory: true, stock: 5);
        var request = new CreateInventoryCardForSaleRequest
        {
            ProductId = product.Id,
            Code = "TC000001",
            Method = "Sale",
            OccurredAt = DateTime.UtcNow,
            CostPrice = 50000,
            QuantitySold = 10, // More than available stock
            UpdateProductStock = true,
        };

        // Act & Assert
        var exception = await Assert.ThrowsExceptionAsync<ApiException>(async () =>
            await _sut.CreateInventoryCardForSaleAsync(request));
        Assert.AreEqual(HttpStatusCode.BadRequest, exception.StatusCode);
        Assert.IsTrue(exception.Message.Contains("Không đủ tồn kho"));
    }

    // FUNC32: CreateInventoryCardForPurchaseAsync
    [TestMethod]
    public async Task FUNC32_TC01_CreateInventoryCardForPurchaseAsync_Success_ShouldAddStock()
    {
        // Arrange
        var product = await SeedProduct(manageInventory: true, stock: 10);
        var request = new CreateInventoryCardForPurchaseRequest
        {
            ProductId = product.Id,
            Code = "TC000001",
            Method = "Purchase",
            OccurredAt = DateTime.UtcNow,
            CostPrice = 45000,
            QuantityPurchased = 5,
            UpdateProductStock = true,
        };

        // Act
        var result = await _sut.CreateInventoryCardForPurchaseAsync(request);

        // Assert
        Assert.IsNotNull(result);
        Assert.AreEqual(product.Id, result.ProductId);
        Assert.AreEqual(5, result.QuantityChange); // Positive for purchase
        Assert.AreEqual(15, result.EndingStock); // 10 + 5 = 15

        var updatedProduct = await _context.Products.FindAsync(product.Id);
        Assert.IsNotNull(updatedProduct);
        Assert.AreEqual(15, updatedProduct.Stock);

        var inventoryCard = await _context.InventoryCards.FirstOrDefaultAsync(ic =>
            ic.ProductId == product.Id && ic.Code == request.Code);
        Assert.IsNotNull(inventoryCard);
    }

    [TestMethod]
    public async Task FUNC32_TC02_CreateInventoryCardForPurchaseAsync_ProductNotFound_ShouldThrowException()
    {
        // Arrange
        var request = new CreateInventoryCardForPurchaseRequest
        {
            ProductId = 99999, // Non-existent product
            Code = "TC000001",
            Method = "Purchase",
            OccurredAt = DateTime.UtcNow,
            CostPrice = 45000,
            QuantityPurchased = 5,
            UpdateProductStock = true,
        };

        // Act & Assert
        var exception = await Assert.ThrowsExceptionAsync<ApiException>(async () =>
            await _sut.CreateInventoryCardForPurchaseAsync(request));
        Assert.AreEqual(HttpStatusCode.NotFound, exception.StatusCode);
        Assert.IsTrue(exception.Message.Contains("không tồn tại"));
    }

    [TestMethod]
    public async Task FUNC32_TC03_CreateInventoryCardForPurchaseAsync_ProductNotManageInventory_ShouldThrowException()
    {
        // Arrange
        var product = await SeedProduct(manageInventory: false, stock: 10);
        var request = new CreateInventoryCardForPurchaseRequest
        {
            ProductId = product.Id,
            Code = "TC000001",
            Method = "Purchase",
            OccurredAt = DateTime.UtcNow,
            CostPrice = 45000,
            QuantityPurchased = 5,
            UpdateProductStock = true,
        };

        // Act & Assert
        var exception = await Assert.ThrowsExceptionAsync<ApiException>(async () =>
            await _sut.CreateInventoryCardForPurchaseAsync(request));
        Assert.AreEqual(HttpStatusCode.BadRequest, exception.StatusCode);
        Assert.IsTrue(exception.Message.Contains("không quản lý tồn kho"));
    }

    [TestMethod]
    public async Task FUNC32_TC04_CreateInventoryCardForPurchaseAsync_UpdateProductStockFalse_ShouldNotAddStock()
    {
        // Arrange
        var product = await SeedProduct(manageInventory: true, stock: 10);
        var request = new CreateInventoryCardForPurchaseRequest
        {
            ProductId = product.Id,
            Code = "TC000001",
            Method = "Purchase",
            OccurredAt = DateTime.UtcNow,
            CostPrice = 45000,
            QuantityPurchased = 5,
            UpdateProductStock = false, // Don't update stock
        };

        // Act
        var result = await _sut.CreateInventoryCardForPurchaseAsync(request);

        // Assert
        Assert.IsNotNull(result);
        Assert.AreEqual(5, result.QuantityChange);
        Assert.AreEqual(10, result.EndingStock); // Stock unchanged

        var updatedProduct = await _context.Products.FindAsync(product.Id);
        Assert.IsNotNull(updatedProduct);
        Assert.AreEqual(10, updatedProduct.Stock); // Stock should remain unchanged
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
}

