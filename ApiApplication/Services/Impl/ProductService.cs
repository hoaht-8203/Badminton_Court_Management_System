using ApiApplication.Data;
using ApiApplication.Dtos;
using ApiApplication.Dtos.Minio;
using ApiApplication.Entities;
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
        var query = _context.Products.AsQueryable();

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
            query = query.Where(p => p.Category != null && p.Category.ToLower().Contains(cat));
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
        var item = await _context.Products.FirstOrDefaultAsync(p => p.Id == id);
        if (item == null)
        {
            throw new ArgumentException($"Sản phẩm không tồn tại: {id}");
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
                    throw new ArgumentException($"Mã hàng đã tồn tại: {request.Code}");
                }
            }
            if (!string.IsNullOrWhiteSpace(request.Name))
            {
                var existedName = await _context.Products.AnyAsync(p => p.Name == request.Name);
                if (existedName)
                {
                    throw new ArgumentException($"Tên hàng đã tồn tại: {request.Name}");
                }
            }

            var entity = _mapper.Map<Product>(request);
            _context.Products.Add(entity);
            await _context.SaveChangesAsync();
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
            throw new ArgumentException($"Sản phẩm không tồn tại: {request.Id}");
        }

        if (!string.IsNullOrWhiteSpace(request.Code) && request.Code != entity.Code)
        {
            var existed = await _context.Products.AnyAsync(p =>
                p.Code == request.Code && p.Id != request.Id
            );
            if (existed)
            {
                throw new ArgumentException($"Mã hàng đã tồn tại: {request.Code}");
            }
        }
        if (!string.IsNullOrWhiteSpace(request.Name) && request.Name != entity.Name)
        {
            var existedName = await _context.Products.AnyAsync(p =>
                p.Name == request.Name && p.Id != request.Id
            );
            if (existedName)
            {
                throw new ArgumentException($"Tên hàng đã tồn tại: {request.Name}");
            }
        }

        try
        {
            _mapper.Map(request, entity);
            await _context.SaveChangesAsync();
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
            throw new ArgumentException($"Sản phẩm không tồn tại: {request.Id}");
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
            throw new ArgumentException($"Sản phẩm không tồn tại: {request.Id}");
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
            throw new ArgumentException($"Sản phẩm không tồn tại: {id}");
        }

        entity.IsActive = isActive;
        await _context.SaveChangesAsync();
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
