using ApiApplication.Data;
using ApiApplication.Dtos;
using ApiApplication.Dtos.Minio;
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
        if (!string.IsNullOrWhiteSpace(request.MenuType))
        {
            var menu = request.MenuType.ToLower();
            query = query.Where(p => p.MenuType != null && p.MenuType.ToLower().Contains(menu));
        }
        if (!string.IsNullOrWhiteSpace(request.Category))
        {
            var cat = request.Category.ToLower();
            query = query.Where(p => p.Category != null && p.Category.Name.ToLower().Contains(cat));
        }
        if (request.IsDirectSale.HasValue)
        {
            query = query.Where(p => p.IsDirectSale == request.IsDirectSale);
        }

        var items = await query.OrderByDescending(p => p.CreatedAt).ToListAsync();
        return _mapper.Map<List<ListProductResponse>>(items);
    }

    public async Task<DetailProductResponse> DetailAsync(int id)
    {
        var item = await _context.Products.Include(p => p.Category).FirstOrDefaultAsync(p => p.Id == id);
        if (item == null)
        {
            throw new ApiException($"Sản phẩm không tồn tại: {id}", System.Net.HttpStatusCode.NotFound);
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
                    throw new ApiException($"Mã hàng đã tồn tại: {request.Code}", System.Net.HttpStatusCode.BadRequest);
                }
            }
            if (!string.IsNullOrWhiteSpace(request.Name))
            {
                var existedName = await _context.Products.AnyAsync(p => p.Name == request.Name);
                if (existedName)
                {
                    throw new ApiException($"Tên hàng đã tồn tại: {request.Name}", System.Net.HttpStatusCode.BadRequest);
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
            throw new ApiException($"Sản phẩm không tồn tại: {request.Id}", System.Net.HttpStatusCode.NotFound);
        }

        if (!string.IsNullOrWhiteSpace(request.Code) && request.Code != entity.Code)
        {
            var existed = await _context.Products.AnyAsync(p =>
                p.Code == request.Code && p.Id != request.Id
            );
            if (existed)
            {
                throw new ApiException($"Mã hàng đã tồn tại: {request.Code}", System.Net.HttpStatusCode.BadRequest);
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
                throw new ApiException($"Tên hàng đã tồn tại: {request.Name}", System.Net.HttpStatusCode.BadRequest);
            }
        }

        try
        {
            _mapper.Map(request, entity);
            await _context.SaveChangesAsync();
            
            // Kiểm tra và tạo phiếu kiểm kho tự động nếu cần
            
            // Trường hợp 1: Sản phẩm mới bắt đầu quản lý tồn kho với tồn ban đầu > 0
            if (entity.ManageInventory && !previousManageInventory && entity.Stock > 0)
            {
                await CreateInitialInventoryCheckAsync(entity);
            }
            
            // Trường hợp 1b: Tồn kho được cập nhật thủ công (thay đổi so với trước) -> tạo phiếu cân bằng
            if (entity.ManageInventory && entity.Stock != previousStock)
            {
                await CreateBalancedInventoryCheckOnUpdateAsync(entity, previousStock);
            }
            
            // Trường hợp 2: Tồn kho được cập nhật và thấp hơn mức tồn kho tối thiểu
            if (entity.ManageInventory && entity.MinStock > 0 && entity.Stock < entity.MinStock)
            {
                await CreateLowStockInventoryCheckAsync(entity);
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
            throw new ApiException($"Sản phẩm không tồn tại: {request.Id}", System.Net.HttpStatusCode.NotFound);
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
            throw new ApiException($"Sản phẩm không tồn tại: {request.Id}", System.Net.HttpStatusCode.NotFound);
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
            throw new ApiException($"Sản phẩm không tồn tại: {id}", System.Net.HttpStatusCode.NotFound);
        }

        entity.IsActive = isActive;
        await _context.SaveChangesAsync();
    }

    private async Task<string> GenerateNextInventoryCodeAsync()
    {
        var last = await _context.InventoryChecks
            .OrderByDescending(x => x.Id)
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
                    ActualQuantity = product.Stock
                }
            }
        };
        _context.InventoryChecks.Add(check);
        await _context.SaveChangesAsync();
    }

    // Tạo phiếu kiểm kê kho tự động khi thêm sản phẩm mới với tồn kho > 0
    private async Task CreateInitialInventoryCheckAsync(Product product)
    {
        var code = await GenerateNextInventoryCodeAsync();
        var note = $"Phiếu kiểm kho được tạo tự động khi thêm mới Hàng hóa:{product.Code ?? product.Id.ToString()}";
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
                    ActualQuantity = product.Stock
                }
            }
        };
        _context.InventoryChecks.Add(check);
        await _context.SaveChangesAsync();
    }
    
    // Tạo phiếu kiểm kê kho tự động khi tồn kho thấp hơn mức tối thiểu
    private async Task CreateLowStockInventoryCheckAsync(Product product)
    {
        var code = await GenerateNextInventoryCodeAsync();
        var note = $"Cảnh báo: Tồn kho thấp cho sản phẩm {product.Name} ({product.Code ?? product.Id.ToString()}). " +
                   $"Hiện tại: {product.Stock}, Tối thiểu: {product.MinStock}";
                   
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
                    ActualQuantity = product.Stock // Giá trị ban đầu giống nhau, người dùng sẽ điều chỉnh
                }
            }
        };
        _context.InventoryChecks.Add(check);
        await _context.SaveChangesAsync();
    }

    // Kiểm tra tồn kho thấp và tạo phiếu kiểm kho nếu cần
    public async Task<int> CheckLowStockAndCreateInventoryChecksAsync(string? branch = null)
    {
        // Tìm tất cả sản phẩm quản lý tồn kho, có tồn kho thấp hơn mức tối thiểu
        var query = _context.Products
            .Where(p => p.ManageInventory && p.MinStock > 0 && p.Stock < p.MinStock);
            
        // Lọc theo chi nhánh nếu được chỉ định
        // Ở đây chúng ta giả định cùng một sản phẩm có thể có các mức tồn kho khác nhau ở các chi nhánh khác nhau
        // Nhưng vì thiết kế hiện tại không có trường branch trong Product nên tạm bỏ qua
            
        var lowStockProducts = await query.ToListAsync();
        
        int count = 0;
        foreach (var product in lowStockProducts)
        {
            await CreateLowStockInventoryCheckAsync(product);
            count++;
        }
        
        return count;
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
