using System;
using System.Net;
using System.Threading.Tasks;
using ApiApplication.Data;
using ApiApplication.Entities;
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
public class ProductServiceTests
{
    private ApplicationDbContext _context = null!;
    private Mock<IStorageService> _storageServiceMock = null!;
    private IMapper _mapper = null!;
    private ProductService _sut = null!;

    [TestInitialize]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var currentUserMock = new Mock<ICurrentUser>();
        _context = new ApplicationDbContext(options, currentUserMock.Object);

        _mapper = TestHelpers.BuildMapper();
        _storageServiceMock = new Mock<IStorageService>();

        _sut = new ProductService(_context, _mapper, _storageServiceMock.Object);
    }

    [TestCleanup]
    public void Cleanup()
    {
        _context?.Dispose();
    }

    // FUNC39: UpdateWebDisplayAsync
    [TestMethod]
    public async Task FUNC39_TC01_UpdateWebDisplayAsync_Success_ShouldUpdateIsDisplayOnWeb()
    {
        // Arrange
        var product = await SeedProduct();

        // Act
        await _sut.UpdateWebDisplayAsync(product.Id, true);

        // Assert
        var updatedProduct = await _context.Products.FindAsync(product.Id);
        Assert.IsNotNull(updatedProduct);
        Assert.IsTrue(updatedProduct.IsDisplayOnWeb);
    }

    [TestMethod]
    public async Task FUNC39_TC02_UpdateWebDisplayAsync_SetToFalse_ShouldUpdateIsDisplayOnWeb()
    {
        // Arrange
        var product = await SeedProduct(isDisplayOnWeb: true);

        // Act
        await _sut.UpdateWebDisplayAsync(product.Id, false);

        // Assert
        var updatedProduct = await _context.Products.FindAsync(product.Id);
        Assert.IsNotNull(updatedProduct);
        Assert.IsFalse(updatedProduct.IsDisplayOnWeb);
    }

    [TestMethod]
    public async Task FUNC39_TC03_UpdateWebDisplayAsync_ProductNotFound_ShouldThrowException()
    {
        // Arrange
        var nonExistentId = 99999;

        // Act & Assert
        var exception = await Assert.ThrowsExceptionAsync<ApiException>(async () =>
            await _sut.UpdateWebDisplayAsync(nonExistentId, true));
        Assert.AreEqual(HttpStatusCode.NotFound, exception.StatusCode);
        Assert.IsTrue(exception.Message.Contains("không tồn tại"));
    }

    private async Task<Product> SeedProduct(int? id = null, bool isDisplayOnWeb = false)
    {
        var product = new Product
        {
            Id = id ?? 1,
            Name = "Test Product",
            CostPrice = 50000,
            SalePrice = 100000,
            Stock = 0,
            ManageInventory = false,
            IsActive = true,
            IsDisplayOnWeb = isDisplayOnWeb,
        };
        await _context.Products.AddAsync(product);
        await _context.SaveChangesAsync();
        return product;
    }
}

