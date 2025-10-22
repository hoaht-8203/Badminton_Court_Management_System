using ApiApplication.Data;
using ApiApplication.Dtos.Category;
using ApiApplication.Entities;
using ApiApplication.Exceptions;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Services.Impl;

public class CategoryService(ApplicationDbContext context, IMapper mapper) : ICategoryService
{
    private readonly ApplicationDbContext _context = context;
    private readonly IMapper _mapper = mapper;

    public async Task<List<ListCategoryResponse>> ListAsync(ListCategoryRequest request)
    {
        var query = _context.Categories.AsQueryable();

        if (request.Id.HasValue)
        {
            query = query.Where(c => c.Id == request.Id);
        }
        if (!string.IsNullOrWhiteSpace(request.Name))
        {
            var name = request.Name.ToLower();
            query = query.Where(c => c.Name.ToLower().Contains(name));
        }

        var items = await query.ToListAsync();
        return _mapper.Map<List<ListCategoryResponse>>(items);
    }

    public async Task<DetailCategoryResponse> DetailAsync(int id)
    {
        var item = await _context.Categories.FirstOrDefaultAsync(c => c.Id == id);
        if (item == null)
        {
            throw new ApiException(
                $"Nhóm hàng không tồn tại: {id}",
                System.Net.HttpStatusCode.NotFound
            );
        }
        return _mapper.Map<DetailCategoryResponse>(item);
    }

    public async Task CreateAsync(CreateCategoryRequest request)
    {
        var category = _mapper.Map<Category>(request);
        _context.Categories.Add(category);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(UpdateCategoryRequest request)
    {
        var category = await _context.Categories.FirstOrDefaultAsync(c => c.Id == request.Id);
        if (category == null)
        {
            throw new ApiException(
                $"Nhóm hàng không tồn tại: {request.Id}",
                System.Net.HttpStatusCode.NotFound
            );
        }

        category.Name = request.Name ?? string.Empty;
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(DeleteCategoryRequest request)
    {
        var category = await _context.Categories.FirstOrDefaultAsync(c => c.Id == request.Id);
        if (category == null)
        {
            throw new ApiException(
                $"Nhóm hàng không tồn tại: {request.Id}",
                System.Net.HttpStatusCode.NotFound
            );
        }

        // Check if category has products
        var hasProducts = await _context.Products.AnyAsync(p => p.CategoryId == request.Id);
        if (hasProducts)
        {
            throw new ApiException(
                "Không thể xóa nhóm hàng vì còn sản phẩm thuộc nhóm này",
                System.Net.HttpStatusCode.BadRequest
            );
        }

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();
    }
}
