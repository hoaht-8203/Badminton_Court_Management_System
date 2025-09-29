using ApiApplication.Dtos.Pagination;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Extensions;

public static class QueryableExtensions
{
    public static async Task<PagedResponse<TDest>> ToPagedResponseAsync<TSource, TDest>(
        this IQueryable<TSource> query,
        PaginationRequest request,
        IMapper mapper,
        CancellationToken cancellationToken = default
    )
    {
        var (page, pageSize) = Normalize(request.Page, request.PageSize);

        var totalItems = await query.LongCountAsync(cancellationToken);
        if (totalItems == 0)
        {
            return Empty<TDest>(page, pageSize);
        }

        var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);
        if (page > totalPages)
            page = totalPages;

        var projected = query.ProjectTo<TDest>(mapper.ConfigurationProvider);

        var items = await projected
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResponse<TDest>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalItems = totalItems,
            TotalPages = totalPages,
        };
    }

    private static (int page, int pageSize) Normalize(int page, int pageSize)
    {
        var p = page <= 0 ? 1 : page;
        var ps = pageSize <= 0 ? 10 : pageSize;
        return (p, ps);
    }

    private static PagedResponse<T> Empty<T>(int page, int pageSize)
    {
        return new PagedResponse<T>
        {
            Items = new List<T>(),
            Page = page,
            PageSize = pageSize,
            TotalItems = 0,
            TotalPages = 0,
        };
    }
}
