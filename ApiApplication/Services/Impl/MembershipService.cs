using ApiApplication.Data;
using ApiApplication.Dtos.Membership;
using ApiApplication.Entities;
using ApiApplication.Entities.Shared;
using ApiApplication.Exceptions;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Services.Impl;

public class MembershipService(ApplicationDbContext context, IMapper mapper) : IMembershipService
{
    private readonly ApplicationDbContext _context = context;
    private readonly IMapper _mapper = mapper;

    public async Task<List<ListMembershipResponse>> ListAsync(ListMembershipRequest request)
    {
        var query = _context.Memberships.OrderByDescending(x => x.CreatedAt).AsQueryable();

        if (request.Id.HasValue)
        {
            query = query.Where(x => x.Id == request.Id.Value);
        }
        if (!string.IsNullOrWhiteSpace(request.Name))
        {
            var name = request.Name.ToLower();
            query = query.Where(x => x.Name.ToLower().Contains(name));
        }
        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            var status = request.Status.ToLower();
            query = query.Where(x => x.Status.ToLower() == status);
        }

        var items = await query.ToListAsync();
        return _mapper.Map<List<ListMembershipResponse>>(items);
    }

    public async Task<DetailMembershipResponse> DetailAsync(int id)
    {
        var item = await _context.Memberships.FirstOrDefaultAsync(x => x.Id == id);
        if (item == null)
        {
            throw new ApiException(
                $"Gói hội viên không tồn tại: {id}",
                System.Net.HttpStatusCode.NotFound
            );
        }
        return _mapper.Map<DetailMembershipResponse>(item);
    }

    public async Task CreateAsync(CreateMembershipRequest request)
    {
        var entity = _mapper.Map<Membership>(request);
        entity.Status = string.IsNullOrWhiteSpace(request.Status) ? "Active" : request.Status!;
        _context.Memberships.Add(entity);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(UpdateMembershipRequest request)
    {
        var entity = await _context.Memberships.FirstOrDefaultAsync(x => x.Id == request.Id);
        if (entity == null)
        {
            throw new ApiException(
                $"Gói hội viên không tồn tại: {request.Id}",
                System.Net.HttpStatusCode.NotFound
            );
        }

        entity.Name = request.Name ?? entity.Name;
        entity.Price = request.Price;
        entity.DiscountPercent = request.DiscountPercent;
        entity.Description = request.Description;
        entity.DurationDays = request.DurationDays;
        entity.Status = request.Status ?? entity.Status;
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(DeleteMembershipRequest request)
    {
        var entity = await _context.Memberships.FirstOrDefaultAsync(x => x.Id == request.Id);
        if (entity == null)
        {
            throw new ApiException(
                $"Gói hội viên không tồn tại: {request.Id}",
                System.Net.HttpStatusCode.NotFound
            );
        }

        var isReferenced = await _context.UserMemberships.AnyAsync(um =>
            um.MembershipId == entity.Id
        );
        if (isReferenced)
        {
            throw new ApiException(
                "Không thể xóa vì đang có khách hàng sử dụng gói này",
                System.Net.HttpStatusCode.BadRequest
            );
        }

        _context.Memberships.Remove(entity);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateStatusAsync(UpdateMemberShipStatusRequest request)
    {
        var entity =
            await _context.Memberships.FirstOrDefaultAsync(x => x.Id == request.Id)
            ?? throw new ApiException(
                $"Gói hội viên không tồn tại: {request.Id}",
                System.Net.HttpStatusCode.NotFound
            );

        if (!MemebershipStatus.ValidStatuses.Contains(request.Status))
        {
            throw new ApiException(
                $"Trạng thái không hợp lệ",
                System.Net.HttpStatusCode.BadRequest
            );
        }

        entity.Status = request.Status;
        await _context.SaveChangesAsync();
    }
}
