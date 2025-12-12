using System;
using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using ApiApplication.Data;
using ApiApplication.Dtos.PriceTable;
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

namespace Tests;

[TestClass]
public class PriceTableServiceTests
{
    private ApplicationDbContext _context = null!;
    private IMapper _mapper = null!;
    private PriceTableService _sut = null!;

    [TestInitialize]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var currentUserMock = new Mock<ICurrentUser>();
        _context = new ApplicationDbContext(options, currentUserMock.Object);

        _mapper = TestHelpers.BuildMapper();

        _sut = new PriceTableService(_context, _mapper);
    }

    [TestCleanup]
    public void Cleanup()
    {
        _context?.Dispose();
    }

    // FUNC35: SetProductsAsync
    [TestMethod]
    public async Task FUNC35_TC01_SetProductsAsync_Success_ShouldAssignProducts()
    {
        // Arrange
        var priceTable = await SeedPriceTable();
        var product1 = await SeedProduct(1);
        var product2 = await SeedProduct(2);
        var request = new SetPriceTableProductsRequest
        {
            PriceTableId = priceTable.Id,
            Products = new List<PriceTableProductItem>
            {
                new PriceTableProductItem { ProductId = product1.Id, OverrideSalePrice = 120000 },
                new PriceTableProductItem { ProductId = product2.Id, OverrideSalePrice = null },
            },
        };

        // Act
        await _sut.SetProductsAsync(request);

        // Assert
        var updatedPriceTable = await _context.PriceTables
            .Include(pt => pt.PriceTableProducts)
            .FirstOrDefaultAsync(pt => pt.Id == priceTable.Id);
        Assert.IsNotNull(updatedPriceTable);
        Assert.AreEqual(2, updatedPriceTable.PriceTableProducts.Count);
    }

    [TestMethod]
    public async Task FUNC35_TC02_SetProductsAsync_PriceTableNotFound_ShouldThrowException()
    {
        // Arrange
        var request = new SetPriceTableProductsRequest
        {
            PriceTableId = 99999,
            Products = new List<PriceTableProductItem>(),
        };

        // Act & Assert
        var exception = await Assert.ThrowsExceptionAsync<ArgumentException>(async () =>
            await _sut.SetProductsAsync(request));
        Assert.IsTrue(exception.Message.Contains("không tồn tại"));
    }

    [TestMethod]
    public async Task FUNC35_TC03_SetProductsAsync_InvalidProductId_ShouldIgnore()
    {
        // Arrange
        var priceTable = await SeedPriceTable();
        var product = await SeedProduct();
        var request = new SetPriceTableProductsRequest
        {
            PriceTableId = priceTable.Id,
            Products = new List<PriceTableProductItem>
            {
                new PriceTableProductItem { ProductId = product.Id, OverrideSalePrice = null },
                new PriceTableProductItem { ProductId = 99999, OverrideSalePrice = null }, // Invalid
            },
        };

        // Act
        await _sut.SetProductsAsync(request);

        // Assert
        var updatedPriceTable = await _context.PriceTables
            .Include(pt => pt.PriceTableProducts)
            .FirstOrDefaultAsync(pt => pt.Id == priceTable.Id);
        Assert.IsNotNull(updatedPriceTable);
        Assert.AreEqual(1, updatedPriceTable.PriceTableProducts.Count); // Only valid product
    }

    [TestMethod]
    public async Task FUNC35_TC04_SetProductsAsync_PriceBelowCostPrice_ShouldThrowException()
    {
        // Arrange
        var priceTable = await SeedPriceTable();
        var product = await SeedProduct(costPrice: 100000);
        var request = new SetPriceTableProductsRequest
        {
            PriceTableId = priceTable.Id,
            Products = new List<PriceTableProductItem>
            {
                new PriceTableProductItem { ProductId = product.Id, OverrideSalePrice = 50000 }, // Below cost
            },
        };

        // Act & Assert
        var exception = await Assert.ThrowsExceptionAsync<ApiException>(async () =>
            await _sut.SetProductsAsync(request));
        Assert.AreEqual(HttpStatusCode.BadRequest, exception.StatusCode);
        Assert.IsTrue(exception.Message.Contains("phải lớn hơn hoặc bằng giá vốn"));
    }

    private async Task<PriceTable> SeedPriceTable(int? id = null)
    {
        var priceTable = new PriceTable
        {
            Id = id ?? 1,
            Name = "Test Price Table",
            IsActive = true,
        };
        await _context.PriceTables.AddAsync(priceTable);
        await _context.SaveChangesAsync();
        return priceTable;
    }

    private async Task<Product> SeedProduct(int? id = null, decimal costPrice = 50000)
    {
        var product = new Product
        {
            Id = id ?? 1,
            Name = $"Test Product {id}",
            CostPrice = costPrice,
            SalePrice = 100000,
            Stock = 0,
            ManageInventory = false,
            IsActive = true,
        };
        await _context.Products.AddAsync(product);
        await _context.SaveChangesAsync();
        return product;
    }
}

