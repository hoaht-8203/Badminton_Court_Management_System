using ApiApplication.Data;
using ApiApplication.Dtos;
using ApiApplication.Dtos.Minio;
using ApiApplication.Dtos.Product;
using ApiApplication.Entities;
using ApiApplication.Entities.Shared;
using ApiApplication.Exceptions;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Services.Impl;

public class ProductService(ApplicationDbContext context, IMapper mapper, IStorageService storage)
    : IProductService
{
    private readonly ApplicationDbContext _context = context;
    private readonly IMapper _mapper = mapper;
    private readonly IStorageService _storage = storage;

    public async Task<List<ListProductResponse>> ListAsync(ListProductRequest request)
    {
        var query = _context.Products.Include(p => p.Category).AsQueryable();

        if (request.Id.HasValue)
        {
            query = query.Where(p => p.Id == request.Id);
        }
        if (!string.IsNullOrWhiteSpace(request.Code))
        {
            var code = request.Code.ToLower();
            query = query.Where(p => p.Code != null && p.Code.ToLower().Contains(code));
        }
        if (!string.IsNullOrWhiteSpace(request.Name))
        {
            var name = request.Name.ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(name));
        }
        if (!string.IsNullOrWhiteSpace(request.Category))
        {
            var cat = request.Category.ToLower();
            query = query.Where(p => p.Category != null && p.Category.Name.ToLower().Contains(cat));
        }

        var items = await query.OrderByDescending(p => p.CreatedAt).ToListAsync();
        return _mapper.Map<List<ListProductResponse>>(items);
    }

    public async Task<DetailProductResponse> DetailAsync(int id)
    {
        var item = await _context
            .Products.Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Id == id);
        if (item == null)
        {
            throw new ApiException(
                $"Sản phẩm không tồn tại: {id}",
                System.Net.HttpStatusCode.NotFound
            );
        }
        return _mapper.Map<DetailProductResponse>(item);
    }

    public async Task CreateAsync(CreateProductRequest request)
    {
        try
        {
            if (!string.IsNullOrWhiteSpace(request.Code))
            {
                var existed = await _context.Products.AnyAsync(p => p.Code == request.Code);
                if (existed)
                {
                    throw new ApiException(
                        $"Mã hàng đã tồn tại: {request.Code}",
                        System.Net.HttpStatusCode.BadRequest
                    );
                }
            }
            if (!string.IsNullOrWhiteSpace(request.Name))
            {
                var existedName = await _context.Products.AnyAsync(p => p.Name == request.Name);
                if (existedName)
                {
                    throw new ApiException(
                        $"Tên hàng đã tồn tại: {request.Name}",
                        System.Net.HttpStatusCode.BadRequest
                    );
                }
            }

            var entity = _mapper.Map<Product>(request);
            _context.Products.Add(entity);
            await _context.SaveChangesAsync();

            // Auto create inventory check if manage inventory and initial stock > 0
            if (entity.ManageInventory && entity.Stock > 0)
            {
                await CreateInitialInventoryCheckAsync(entity);
            }

            // Kiểm tra nếu tồn kho ban đầu đã thấp hơn mức tối thiểu thì tạo phiếu cảnh báo
            if (entity.ManageInventory && entity.MinStock > 0 && entity.Stock < entity.MinStock)
            {
                await CreateLowStockInventoryCheckAsync(entity);
            }

            // Ghi thẻ kho khi tạo mới có tồn kho ban đầu
            if (entity.ManageInventory && entity.Stock > 0)
            {
                _context.InventoryCards.Add(
                    new InventoryCard
                    {
                        ProductId = entity.Id,
                        Code = await GenerateNextInventoryCardCodeAsync(),
                        Method = "Kiểm hàng (tạo mới)",
                        OccurredAt = DateTime.UtcNow,
                        CostPrice = entity.CostPrice,
                        QuantityChange = entity.Stock,
                        EndingStock = entity.Stock,
                    }
                );
                await _context.SaveChangesAsync();
            }
        }
        catch (DbUpdateException ex)
        {
            var msg = ex.InnerException?.Message ?? ex.Message;
            throw new ApiException(
                $"Create product failed: {msg}",
                System.Net.HttpStatusCode.BadRequest
            );
        }
        catch (Exception ex)
        {
            throw new ApiException(
                $"Create product failed: {ex.Message}",
                System.Net.HttpStatusCode.BadRequest
            );
        }
    }

    public async Task UpdateAsync(UpdateProductRequest request)
    {
        var entity = await _context.Products.FirstOrDefaultAsync(p => p.Id == request.Id);
        if (entity == null)
        {
            throw new ApiException(
                $"Sản phẩm không tồn tại: {request.Id}",
                System.Net.HttpStatusCode.NotFound
            );
        }

        if (!string.IsNullOrWhiteSpace(request.Code) && request.Code != entity.Code)
        {
            var existed = await _context.Products.AnyAsync(p =>
                p.Code == request.Code && p.Id != request.Id
            );
            if (existed)
            {
                throw new ApiException(
                    $"Mã hàng đã tồn tại: {request.Code}",
                    System.Net.HttpStatusCode.BadRequest
                );
            }
        }

        // Lưu lại giá trị cũ để kiểm tra thay đổi
        bool previousManageInventory = entity.ManageInventory;
        int previousStock = entity.Stock;
        int previousMinStock = entity.MinStock;
        if (!string.IsNullOrWhiteSpace(request.Name) && request.Name != entity.Name)
        {
            var existedName = await _context.Products.AnyAsync(p =>
                p.Name == request.Name && p.Id != request.Id
            );
            if (existedName)
            {
                throw new ApiException(
                    $"Tên hàng đã tồn tại: {request.Name}",
                    System.Net.HttpStatusCode.BadRequest
                );
            }
        }

        try
        {
            var previousCostPrice = entity.CostPrice;
            var prevStockLocal = entity.Stock;
            _mapper.Map(request, entity);
            await _context.SaveChangesAsync();

            // Kiểm tra và tạo phiếu kiểm kho tự động nếu cần

            // Trường hợp 1: Sản phẩm mới bắt đầu quản lý tồn kho với tồn ban đầu > 0
            if (entity.ManageInventory && !previousManageInventory && entity.Stock > 0)
            {
                await CreateInitialInventoryCheckAsync(entity);
            }

            // Trường hợp 1b: Tồn kho được cập nhật thủ công (thay đổi so với trước) -> tạo phiếu cân bằng
            if (entity.ManageInventory && entity.Stock != prevStockLocal)
            {
                await CreateBalancedInventoryCheckOnUpdateAsync(entity, prevStockLocal);
                // Ghi thẻ kho khi thay đổi tồn kho
                _context.InventoryCards.Add(
                    new InventoryCard
                    {
                        ProductId = entity.Id,
                        Code = await GenerateNextInventoryCardCodeAsync(),
                        Method = "Cập nhật tồn kho",
                        OccurredAt = DateTime.UtcNow,
                        CostPrice = entity.CostPrice,
                        QuantityChange = entity.Stock - prevStockLocal,
                        EndingStock = entity.Stock,
                    }
                );
                await _context.SaveChangesAsync();
            }

            // Trường hợp 2: Tồn kho được cập nhật và thấp hơn mức tồn kho tối thiểu
            if (entity.ManageInventory && entity.MinStock > 0 && entity.Stock < entity.MinStock)
            {
                await CreateLowStockInventoryCheckAsync(entity);
            }

            // Nếu thay đổi giá vốn -> ghi thẻ "Cập nhật giá vốn" (không đổi tồn)
            if (entity.CostPrice != previousCostPrice)
            {
                _context.InventoryCards.Add(
                    new InventoryCard
                    {
                        ProductId = entity.Id,
                        Code = await GenerateNextInventoryCardCodeAsync(),
                        Method = "Cập nhật giá vốn",
                        OccurredAt = DateTime.UtcNow,
                        CostPrice = entity.CostPrice,
                        QuantityChange = 0,
                        EndingStock = entity.Stock,
                    }
                );
                await _context.SaveChangesAsync();
            }
        }
        catch (DbUpdateException ex)
        {
            var msg = ex.InnerException?.Message ?? ex.Message;
            throw new ApiException(
                $"Update product failed: {msg}",
                System.Net.HttpStatusCode.BadRequest
            );
        }
    }

    public async Task DeleteAsync(DeleteProductRequest request)
    {
        var entity = await _context.Products.FirstOrDefaultAsync(p => p.Id == request.Id);
        if (entity == null)
        {
            throw new ApiException(
                $"Sản phẩm không tồn tại: {request.Id}",
                System.Net.HttpStatusCode.NotFound
            );
        }

        // Clean up images when deleting the product
        if (entity.Images.Length > 0)
        {
            foreach (var url in entity.Images)
            {
                var fileName = ExtractFileNameFromUrl(url);
                if (!string.IsNullOrWhiteSpace(fileName))
                {
                    await _storage.DeleteFileAsync(new DeleteFileRequest { FileName = fileName });
                }
            }
        }

        try
        {
            _context.Products.Remove(entity);
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
        {
            var msg = ex.InnerException?.Message ?? ex.Message;
            throw new ApiException(
                $"Delete product failed: {msg}",
                System.Net.HttpStatusCode.BadRequest
            );
        }
    }

    public async Task UpdateImagesAsync(UpdateProductImagesRequest request)
    {
        var entity = await _context.Products.FirstOrDefaultAsync(p => p.Id == request.Id);
        if (entity == null)
        {
            throw new ApiException(
                $"Sản phẩm không tồn tại: {request.Id}",
                System.Net.HttpStatusCode.NotFound
            );
        }

        // Delete old images
        foreach (var url in entity.Images)
        {
            var fileName = ExtractFileNameFromUrl(url);
            if (!string.IsNullOrWhiteSpace(fileName))
            {
                await _storage.DeleteFileAsync(new DeleteFileRequest { FileName = fileName });
            }
        }

        // Upload new images
        var newUrls = new List<string>();
        foreach (var file in request.Files)
        {
            var uploaded = await _storage.UploadFileAsync(new UploadFileRequest { File = file });
            newUrls.Add(uploaded.PublicUrl);
        }

        entity.Images = newUrls.ToArray();
        await _context.SaveChangesAsync();
    }

    public async Task UpdateStatusAsync(int id, bool isActive)
    {
        var entity = await _context.Products.FirstOrDefaultAsync(p => p.Id == id);
        if (entity == null)
        {
            throw new ApiException(
                $"Sản phẩm không tồn tại: {id}",
                System.Net.HttpStatusCode.NotFound
            );
        }

        entity.IsActive = isActive;
        await _context.SaveChangesAsync();
    }

    public async Task UpdateWebDisplayAsync(int id, bool isDisplayOnWeb)
    {
        var entity = await _context.Products.FirstOrDefaultAsync(p => p.Id == id);
        if (entity == null)
        {
            throw new ApiException(
                $"Sản phẩm không tồn tại: {id}",
                System.Net.HttpStatusCode.NotFound
            );
        }

        entity.IsDisplayOnWeb = isDisplayOnWeb;
        await _context.SaveChangesAsync();
    }

    public async Task<List<ListProductResponse>> ListForWebAsync(ListProductRequest request)
    {
        var query = _context
            .Products.Include(p => p.Category)
            .Where(p => p.IsActive && p.IsDisplayOnWeb) // Chỉ lấy sản phẩm active và bán trên web
            .AsQueryable();

        if (request.Id.HasValue)
        {
            query = query.Where(p => p.Id == request.Id);
        }
        if (!string.IsNullOrWhiteSpace(request.Code))
        {
            var code = request.Code.ToLower();
            query = query.Where(p => p.Code != null && p.Code.ToLower().Contains(code));
        }
        if (!string.IsNullOrWhiteSpace(request.Name))
        {
            var name = request.Name.ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(name));
        }
        if (!string.IsNullOrWhiteSpace(request.Category))
        {
            var cat = request.Category.ToLower();
            query = query.Where(p => p.Category != null && p.Category.Name.ToLower().Contains(cat));
        }

        var items = await query.OrderBy(p => p.Name).ToListAsync(); // Sắp xếp theo tên cho web
        return _mapper.Map<List<ListProductResponse>>(items);
    }

    private async Task<string> GenerateNextInventoryCodeAsync()
    {
        var last = await _context
            .InventoryChecks.OrderByDescending(x => x.Id)
            .Select(x => x.Code)
            .FirstOrDefaultAsync();
        if (string.IsNullOrWhiteSpace(last) || last.Length < 2)
        {
            return "KK000001";
        }
        var numberPart = new string(last.Skip(2).ToArray());
        if (!int.TryParse(numberPart, out var num))
        {
            return "KK000001";
        }
        return $"KK{(num + 1).ToString("D6")}";
    }

    private async Task<string> GenerateNextInventoryCardCodeAsync()
    {
        var last = await _context
            .InventoryCards.OrderByDescending(x => x.Id)
            .Select(x => x.Code)
            .FirstOrDefaultAsync();
        if (string.IsNullOrWhiteSpace(last) || last.Length < 2)
        {
            return "TC000001";
        }
        var numberPart = new string(last.Skip(2).ToArray());
        if (!int.TryParse(numberPart, out var num))
        {
            return "TC000001";
        }
        return $"TC{(num + 1).ToString("D6")}";
    }

    // Tạo phiếu kiểm kho cân bằng khi cập nhật tồn kho thủ công ở Danh mục
    private async Task CreateBalancedInventoryCheckOnUpdateAsync(Product product, int previousStock)
    {
        var code = await GenerateNextInventoryCodeAsync();
        var note = $"Phiếu kiểm kho được tạo tự động khi cập nhật Hàng hóa:{product.Name}";
        var check = new InventoryCheck
        {
            Code = code,
            CheckTime = DateTime.UtcNow,
            Status = InventoryCheckStatus.Balanced,
            BalancedAt = DateTime.UtcNow,
            Note = note,
            Items = new List<InventoryCheckItem>
            {
                new()
                {
                    ProductId = product.Id,
                    SystemQuantity = previousStock,
                    ActualQuantity = product.Stock,
                },
            },
        };
        _context.InventoryChecks.Add(check);
        await _context.SaveChangesAsync();
    }

    // Tạo phiếu kiểm kê kho tự động khi thêm sản phẩm mới với tồn kho > 0
    private async Task CreateInitialInventoryCheckAsync(Product product)
    {
        var code = await GenerateNextInventoryCodeAsync();
        var note =
            $"Phiếu kiểm kho được tạo tự động khi thêm mới Hàng hóa:{product.Code ?? product.Id.ToString()}";
        var check = new InventoryCheck
        {
            Code = code,
            CheckTime = DateTime.UtcNow,
            Status = InventoryCheckStatus.Balanced,
            BalancedAt = DateTime.UtcNow,
            Note = note,
            Items = new List<InventoryCheckItem>
            {
                new()
                {
                    ProductId = product.Id,
                    SystemQuantity = 0,
                    ActualQuantity = product.Stock,
                },
            },
        };
        _context.InventoryChecks.Add(check);
        await _context.SaveChangesAsync();
    }

    // Tạo phiếu kiểm kê kho tự động khi tồn kho thấp hơn mức tối thiểu
    private async Task CreateLowStockInventoryCheckAsync(Product product)
    {
        var code = await GenerateNextInventoryCodeAsync();
        var note =
            $"Cảnh báo: Tồn kho thấp cho sản phẩm {product.Name} ({product.Code ?? product.Id.ToString()}). "
            + $"Hiện tại: {product.Stock}, Tối thiểu: {product.MinStock}";

        var check = new InventoryCheck
        {
            Code = code,
            CheckTime = DateTime.UtcNow,
            Status = InventoryCheckStatus.Balanced,
            BalancedAt = DateTime.UtcNow,
            Note = note,
            Items = new List<InventoryCheckItem>
            {
                new()
                {
                    ProductId = product.Id,
                    SystemQuantity = product.Stock,
                    ActualQuantity = product.Stock, // Giá trị ban đầu giống nhau, người dùng sẽ điều chỉnh
                },
            },
        };
        _context.InventoryChecks.Add(check);
        await _context.SaveChangesAsync();
    }

    // Lấy danh sách sản phẩm theo bảng giá với giá theo thời gian
    public async Task<List<ListProductsByPriceTableResponse>> ListByPriceTableAsync(
        ListProductsByPriceTableRequest request
    )
    {
        // Kiểm tra bảng giá có tồn tại và đang hoạt động không
        var priceTable = await _context
            .PriceTables.Include(pt => pt.TimeRanges)
            .Include(pt => pt.PriceTableProducts)
            .FirstOrDefaultAsync(pt => pt.Id == request.PriceTableId && pt.IsActive);

        if (priceTable == null)
        {
            throw new ApiException(
                $"Bảng giá không tồn tại hoặc không hoạt động: {request.PriceTableId}",
                System.Net.HttpStatusCode.NotFound
            );
        }

        // Kiểm tra thời gian hiệu lực của bảng giá
        var now = DateTime.UtcNow;
        bool isPriceTableEffective = true;

        if (priceTable.EffectiveFrom.HasValue && now < priceTable.EffectiveFrom.Value)
        {
            isPriceTableEffective = false; // Bảng giá chưa có hiệu lực
        }

        if (priceTable.EffectiveTo.HasValue && now > priceTable.EffectiveTo.Value)
        {
            isPriceTableEffective = false; // Bảng giá đã hết hiệu lực
        }

        var productIds = priceTable.PriceTableProducts.Select(pp => pp.ProductId).ToList();

        var query = _context
            .Products.Include(p => p.Category)
            .Where(p => productIds.Contains(p.Id));

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.ToLower();
            query = query.Where(p =>
                p.Name.ToLower().Contains(search)
                || (p.Code != null && p.Code.ToLower().Contains(search))
                || (p.Category != null && p.Category.Name.ToLower().Contains(search))
            );
        }

        if (request.CategoryId.HasValue)
        {
            query = query.Where(p => p.CategoryId == request.CategoryId);
        }

        if (request.IsActive.HasValue)
        {
            query = query.Where(p => p.IsActive == request.IsActive);
        }

        var products = await query.ToListAsync();

        var result = new List<ListProductsByPriceTableResponse>();

        foreach (var product in products)
        {
            var priceTableProduct = priceTable.PriceTableProducts.FirstOrDefault(pp =>
                pp.ProductId == product.Id
            );
            var overridePrice = priceTableProduct?.OverrideSalePrice;

            decimal finalPrice = product.SalePrice;
            bool isPriceOverridden = false;

            // Chỉ áp dụng giá override khi bảng giá còn hiệu lực
            if (overridePrice.HasValue && isPriceTableEffective)
            {
                finalPrice = overridePrice.Value;
                isPriceOverridden = true;
            }

            result.Add(
                new ListProductsByPriceTableResponse
                {
                    Id = product.Id,
                    Code = product.Code,
                    Name = product.Name,
                    Category = product.Category?.Name,
                    SalePrice = product.SalePrice,
                    OverrideSalePrice = overridePrice,
                    FinalPrice = finalPrice,
                    IsActive = product.IsActive,
                    Images = product.Images,
                    Unit = product.Unit,
                    Stock = product.Stock,
                    IsPriceOverridden = isPriceOverridden,
                }
            );
        }

        return result.OrderBy(p => p.Name).ToList();
    }

    public async Task<List<ListProductResponse>> GetCurrentAppliedPriceAsync()
    {
        var now = DateTime.UtcNow;
        Console.WriteLine($"[DEBUG] Current time: {now}");

        // Bước 1: Tìm bảng giá đang kích hoạt
        var currentActivePriceTable = await _context
            .PriceTables.Include(pt => pt.PriceTableProducts)
            .Where(pt => pt.IsActive)
            .OrderByDescending(pt => pt.CreatedAt)
            .FirstOrDefaultAsync();

        Console.WriteLine(
            $"[DEBUG] Found active price table: {currentActivePriceTable?.Id}, Name: {currentActivePriceTable?.Name}"
        );
        if (currentActivePriceTable != null)
        {
            Console.WriteLine(
                $"[DEBUG] Price table EffectiveFrom: {currentActivePriceTable.EffectiveFrom}, EffectiveTo: {currentActivePriceTable.EffectiveTo}"
            );
        }

        // Bước 2: Kiểm tra xem bảng giá hiện tại có hết hiệu lực không
        if (
            currentActivePriceTable != null
            && currentActivePriceTable.EffectiveTo.HasValue
            && currentActivePriceTable.EffectiveTo.Value < now
        )
        {
            // Bảng giá hiện tại đã hết hiệu lực, tắt nó đi
            currentActivePriceTable.IsActive = false;

            // Tìm bảng giá tiếp theo có thời gian bắt đầu sau khi bảng cũ hết hiệu lực
            var nextPriceTable = await _context
                .PriceTables.Where(pt =>
                    !pt.IsActive
                    && pt.EffectiveFrom.HasValue
                    && pt.EffectiveFrom.Value >= currentActivePriceTable.EffectiveTo.Value
                    && (!pt.EffectiveTo.HasValue || pt.EffectiveTo.Value >= now)
                )
                .OrderBy(pt => pt.EffectiveFrom)
                .FirstOrDefaultAsync();

            // Nếu tìm thấy bảng giá tiếp theo phù hợp, kích hoạt nó
            if (nextPriceTable != null)
            {
                nextPriceTable.IsActive = true;
                currentActivePriceTable = nextPriceTable;
                // Load PriceTableProducts cho bảng giá mới
                await _context
                    .Entry(currentActivePriceTable)
                    .Collection(pt => pt.PriceTableProducts)
                    .LoadAsync();
            }
            else
            {
                // Không tìm thấy bảng giá tiếp theo, set null để dùng giá gốc
                currentActivePriceTable = null;
            }

            // Lưu thay đổi
            await _context.SaveChangesAsync();
        }

        // Bước 3: Nếu bảng giá hiện tại vẫn có hiệu lực, kiểm tra thời gian hiệu lực
        if (currentActivePriceTable != null)
        {
            // Kiểm tra xem bảng giá có đang trong thời gian hiệu lực không
            bool isCurrentlyEffective =
                (
                    !currentActivePriceTable.EffectiveFrom.HasValue
                    || currentActivePriceTable.EffectiveFrom.Value <= now
                )
                && (
                    !currentActivePriceTable.EffectiveTo.HasValue
                    || currentActivePriceTable.EffectiveTo.Value >= now
                );

            if (!isCurrentlyEffective)
            {
                Console.WriteLine($"[DEBUG] Price table not effective, setting to null");
                currentActivePriceTable = null;
            }
            else
            {
                Console.WriteLine($"[DEBUG] Price table is effective");
            }
        }

        Console.WriteLine($"[DEBUG] Final active price table: {currentActivePriceTable?.Id}");

        // Bước 4: Lấy tất cả sản phẩm đang kinh doanh và áp dụng giá
        // Chỉ lấy sản phẩm có IsActive = true (đang kinh doanh)
        var products = await _context.Products
            .Include(p => p.Category)
            .Where(p => p.IsActive)
            .ToListAsync();
        var result = new List<ListProductResponse>();

        foreach (var product in products)
        {
            Console.WriteLine(
                $"[DEBUG] Product {product.Name} - Original SalePrice: {product.SalePrice}"
            );

            // Mặc định sử dụng giá gốc
            decimal finalPrice = product.SalePrice;

            // Nếu có bảng giá kích hoạt và có hiệu lực, kiểm tra xem sản phẩm có giá override không
            if (currentActivePriceTable != null)
            {
                var priceTableProduct = currentActivePriceTable.PriceTableProducts.FirstOrDefault(
                    pp => pp.ProductId == product.Id
                );

                if (priceTableProduct != null && priceTableProduct.OverrideSalePrice.HasValue)
                {
                    finalPrice = priceTableProduct.OverrideSalePrice.Value;
                    Console.WriteLine($"[DEBUG] Applied override price: {finalPrice}");
                }
                else
                {
                    Console.WriteLine(
                        $"[DEBUG] No override found, using original price: {finalPrice}"
                    );
                }
            }
            else
            {
                Console.WriteLine(
                    $"[DEBUG] No active price table, using original price: {finalPrice}"
                );
            }

            result.Add(
                new ListProductResponse
                {
                    Id = product.Id,
                    Code = product.Code,
                    Name = product.Name,
                    Category = product.Category?.Name,
                    SalePrice = finalPrice, // Giá sau khi áp dụng bảng giá hoặc giá gốc
                    IsActive = product.IsActive,
                    IsDisplayOnWeb = product.IsDisplayOnWeb,
                    Stock = product.Stock,
                    Images = product.Images,
                }
            );
        }

        return result.OrderBy(p => p.Name).ToList();
    }

    private static string? ExtractFileNameFromUrl(string url)
    {
        if (string.IsNullOrWhiteSpace(url))
            return null;
        try
        {
            // Expect pattern: {PublicBaseUrl}/{bucket}/{object}
            var uri = new Uri(url);
            var segments = uri.AbsolutePath.Split('/', StringSplitOptions.RemoveEmptyEntries);
            if (segments.Length < 2)
                return null;
            // Combine everything after bucket as object key
            return string.Join('/', segments.Skip(1));
        }
        catch
        {
            return null;
        }
    }
}
