using System;
using System.Net;
using ApiApplication.Data;
using ApiApplication.Dtos;
using ApiApplication.Entities;
using ApiApplication.Entities.Shared;
using ApiApplication.Exceptions;
using ApiApplication.Sessions;
using AutoMapper;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Services.Impl;

public class SupplierService(ApplicationDbContext context, IMapper mapper, ICurrentUser currentUser)
    : ISupplierService
{
    private readonly ApplicationDbContext _context = context;
    private readonly IMapper _mapper = mapper;

    public async Task<List<ListSupplierResponse>> ListSupplierAsync(ListSupplierRequest request)
    {
        var query = _context
            .Suppliers.Where(s => s.Status != SupplierStatus.Deleted)
            .OrderByDescending(s => s.CreatedAt)
            .AsQueryable();

        if (!string.IsNullOrEmpty(request.Name))
        {
            var keyword = request.Name.ToLower();
            query = query.Where(p =>
                p.Name != null
                && p.Name.Contains(keyword, StringComparison.CurrentCultureIgnoreCase)
            );
        }

        if (request.Id.HasValue)
        {
            query = query.Where(p => p.Id == request.Id.Value);
        }

        if (!string.IsNullOrEmpty(request.Phone))
        {
            var phone = request.Phone.ToLower();
            query = query.Where(p => p.Phone != null && p.Phone.ToLower().Contains(phone));
        }
        if (!string.IsNullOrEmpty(request.Status))
        {
            var status = request.Status.ToLower();
            query = query.Where(p => p.Status != null && p.Status.ToLower().Contains(status));
        }

        var suppliers = await query.ToListAsync();

        return _mapper.Map<List<ListSupplierResponse>>(suppliers);
    }

    public async Task<DetailSupplierResponse> GetSupplierByIdAsync(int id)
    {
        var supplierDetail = await _context.Suppliers.FirstOrDefaultAsync(c => c.Id == id);

        if (supplierDetail == null)
        {
            throw new ArgumentException($"Nhà cung cấp không tồn tại: {id}");
        }

        return _mapper.Map<DetailSupplierResponse>(supplierDetail);
    }

    public async Task CreateSupplierAsync(CreateSupplierRequest request)
    {
        var existingSupplier = await _context.Suppliers.FirstOrDefaultAsync(s =>
            s.Email == request.Email
        );
        if (existingSupplier != null)
        {
            throw new ArgumentException($"Email {request.Email} đã tồn tại");
        }
        var supplier = _mapper.Map<Supplier>(request);
        supplier.Status = SupplierStatus.Active;

        _context.Suppliers.Add(supplier);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateSupplierAsync(UpdateSupplierRequest request)
    {
        var supplier = await _context.Suppliers.FirstOrDefaultAsync(c => c.Id == request.Id);

        if (supplier == null)
        {
            throw new ArgumentException($"Nhà cung cấp không tồn tại: {request.Id}");
        }

        if (!string.IsNullOrEmpty(request.Email) && request.Email != supplier.Email)
        {
            var existingSupplier = await _context.Suppliers.FirstOrDefaultAsync(c =>
                c.Email == request.Email && c.Id != request.Id
            );

            if (existingSupplier != null)
            {
                throw new ArgumentException($"Email {request.Email} đã tồn tại");
            }
        }

        _mapper.Map(request, supplier);

        await _context.SaveChangesAsync();
    }

    public async Task DeleteSupplierAsync(DeleteSupplierRequest request)
    {
        var supplier = await _context.Suppliers.FirstOrDefaultAsync(c => c.Id == request.Id);

        if (supplier == null)
        {
            throw new ArgumentException($"Nhà cung cấp không tồn tại: {request.Id}");
        }

        supplier.Status = SupplierStatus.Deleted;
        await _context.SaveChangesAsync();
    }

    public async Task ChangeSupplierStatusAsync(ChangeSupplierStatusRequest request)
    {
        var supplier = await _context.Suppliers.FirstOrDefaultAsync(s => s.Id == request.Id);

        if (supplier == null)
        {
            throw new ApiException("Nhà cung cấp không tồn tại", HttpStatusCode.BadRequest);
        }

        var validSupplierStatus = SupplierStatus.ValidSupplierStatus;
        if (!validSupplierStatus.Contains(request.Status))
        {
            throw new ApiException(
                "Trạng thái nhà cung cấp không hợp lệ",
                HttpStatusCode.BadRequest
            );
        }

        supplier.Status = request.Status;
        await _context.SaveChangesAsync();
    }
}
