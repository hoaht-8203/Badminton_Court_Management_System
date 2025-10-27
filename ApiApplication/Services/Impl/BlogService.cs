using System.Net;
using ApiApplication.Data;
using ApiApplication.Dtos.Blog;
using ApiApplication.Entities;
using ApiApplication.Entities.Shared;
using ApiApplication.Exceptions;
using ApiApplication.Services;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Services.Impl;

public class BlogService : IBlogService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public BlogService(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<List<ListBlogResponse>> GetBlogsAsync(ListBlogRequest request)
    {
        var query = _context.Blogs.AsQueryable();

        // Apply filters
        if (!string.IsNullOrEmpty(request.Title))
        {
            query = query.Where(b => b.Title.Contains(request.Title));
        }

        if (!string.IsNullOrEmpty(request.Status))
        {
            query = query.Where(b => b.Status == request.Status);
        }

        // Order by creation date descending
        query = query.OrderByDescending(b => b.CreatedAt);

        var blogs = await query.ToListAsync();
        return _mapper.Map<List<ListBlogResponse>>(blogs);
    }

    public async Task<DetailBlogResponse?> GetBlogByIdAsync(DetailBlogRequest request)
    {
        var blog = await _context.Blogs.FirstOrDefaultAsync(b => b.Id == request.Id);

        if (blog == null)
        {
            return null;
        }

        return _mapper.Map<DetailBlogResponse>(blog);
    }

    public async Task<DetailBlogResponse> CreateBlogAsync(CreateBlogRequest request)
    {
        var blog = _mapper.Map<Blog>(request);
        blog.Status = BlogStatus.Active; // Ensure default status

        await _context.Blogs.AddAsync(blog);
        await _context.SaveChangesAsync();

        return _mapper.Map<DetailBlogResponse>(blog);
    }

    public async Task<DetailBlogResponse> UpdateBlogAsync(UpdateBlogRequest request)
    {
        var blog = await _context.Blogs.FirstOrDefaultAsync(b => b.Id == request.Id);

        if (blog == null)
        {
            throw new ApiException("Không tìm thấy blog", HttpStatusCode.NotFound);
        }

        _mapper.Map(request, blog);
        await _context.SaveChangesAsync();

        return _mapper.Map<DetailBlogResponse>(blog);
    }

    public async Task<bool> DeleteBlogAsync(DeleteBlogRequest request)
    {
        var blog = await _context.Blogs.FirstOrDefaultAsync(b => b.Id == request.Id);

        if (blog == null)
        {
            return false;
        }

        _context.Blogs.Remove(blog);
        await _context.SaveChangesAsync();

        return true;
    }
}
