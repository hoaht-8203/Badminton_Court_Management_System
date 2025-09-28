using System.Net;
using ApiApplication.Data;
using ApiApplication.Dtos;
using ApiApplication.Dtos.Customer;
using ApiApplication.Entities;
using ApiApplication.Entities.Shared;
using ApiApplication.Exceptions;
using ApiApplication.Extensions;
using ApiApplication.Sessions;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Services.Impl;

public class CustomerService(ApplicationDbContext context, IMapper mapper, ICurrentUser currentUser)
    : ICustomerService
{
    private readonly ApplicationDbContext _context = context;
    private readonly IMapper _mapper = mapper;
    private readonly ICurrentUser _currentUser = currentUser;

    public async Task<List<ListCustomerResponse>> ListCustomersAsync(ListCustomerRequest request)
    {
        var query = _context.Customers.AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.FullName))
        {
            var name = request.FullName.ToLower();
            query = query.Where(c => c.FullName.ToLower().Contains(name));
        }

        if (!string.IsNullOrWhiteSpace(request.Phone))
        {
            var phone = request.Phone;
            query = query.Where(c => c.PhoneNumber.Contains(phone));
        }

        if (!string.IsNullOrWhiteSpace(request.Gender))
        {
            var gender = request.Gender.ToLower();
            query = query.Where(c => c.Gender != null && c.Gender.ToLower() == gender);
        }

        if (!string.IsNullOrWhiteSpace(request.City))
        {
            var city = request.City.ToLower();
            query = query.Where(c => c.City != null && c.City!.ToLower().Contains(city));
        }

        if (!string.IsNullOrWhiteSpace(request.Address))
        {
            var address = request.Address.ToLower();
            query = query.Where(c => c.Address != null && c.Address!.ToLower().Contains(address));
        }

        if (!string.IsNullOrWhiteSpace(request.District))
        {
            var district = request.District.ToLower();
            query = query.Where(c =>
                c.District != null && c.District!.ToLower().Contains(district)
            );
        }

        if (!string.IsNullOrWhiteSpace(request.Ward))
        {
            var ward = request.Ward.ToLower();
            query = query.Where(c => c.Ward != null && c.Ward!.ToLower().Contains(ward));
        }

        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            var status = request.Status;
            query = query.Where(c => c.Status == status);
        }

        query = query.OrderByDescending(c => c.CreatedAt);

        var customers = await query.ToListAsync();
        return _mapper.Map<List<ListCustomerResponse>>(customers);
    }

    public async Task<PagedResponse<ListCustomerResponse>> ListCustomersPagedAsync(
        ListCustomerPagedRequest request,
        CancellationToken cancellationToken = default
    )
    {
        var query = _context.Customers.AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.FullName))
        {
            var name = request.FullName.ToLower();
            query = query.Where(c => c.FullName.ToLower().Contains(name));
        }

        if (!string.IsNullOrWhiteSpace(request.Phone))
        {
            var phone = request.Phone;
            query = query.Where(c => c.PhoneNumber.Contains(phone));
        }

        if (!string.IsNullOrWhiteSpace(request.Gender))
        {
            var gender = request.Gender.ToLower();
            query = query.Where(c => c.Gender != null && c.Gender.ToLower() == gender);
        }

        if (!string.IsNullOrWhiteSpace(request.City))
        {
            var city = request.City.ToLower();
            query = query.Where(c => c.City != null && c.City!.ToLower().Contains(city));
        }

        if (!string.IsNullOrWhiteSpace(request.Address))
        {
            var address = request.Address.ToLower();
            query = query.Where(c => c.Address != null && c.Address!.ToLower().Contains(address));
        }

        if (!string.IsNullOrWhiteSpace(request.District))
        {
            var district = request.District.ToLower();
            query = query.Where(c =>
                c.District != null && c.District!.ToLower().Contains(district)
            );
        }

        if (!string.IsNullOrWhiteSpace(request.Ward))
        {
            var ward = request.Ward.ToLower();
            query = query.Where(c => c.Ward != null && c.Ward!.ToLower().Contains(ward));
        }

        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            var status = request.Status;
            query = query.Where(c => c.Status == status);
        }

        query = query.OrderByDescending(c => c.CreatedAt);

        return await query.ToPagedResponseAsync<Entities.Customer, ListCustomerResponse>(
            new ApiApplication.Dto.PaginationRequest
            {
                Page = request.Page,
                PageSize = request.PageSize,
            },
            _mapper,
            cancellationToken
        );
    }

    public async Task<DetailCustomerResponse> GetCustomerByIdAsync(DetailCustomerRequest request)
    {
        var customer = await _context.Customers.FirstOrDefaultAsync(c => c.Id == request.Id);

        if (customer == null)
        {
            throw new ArgumentException($"Not found customer with ID: {request.Id}");
        }

        return _mapper.Map<DetailCustomerResponse>(customer);
    }

    public async Task<DetailCustomerResponse> CreateCustomerAsync(CreateCustomerRequest request)
    {
        var existingCustomer = await _context.Customers.FirstOrDefaultAsync(c =>
            c.Email == request.Email
        );

        if (existingCustomer != null)
        {
            throw new ArgumentException($"Email {request.Email} has been used by other customers");
        }

        var customer = _mapper.Map<Customer>(request);
        customer.Status = CustomerStatus.Active;

        await _context.Customers.AddAsync(customer);
        await _context.SaveChangesAsync();

        return _mapper.Map<DetailCustomerResponse>(customer);
    }

    public async Task<DetailCustomerResponse> UpdateCustomerAsync(UpdateCustomerRequest request)
    {
        var customer = await _context.Customers.FirstOrDefaultAsync(c => c.Id == request.Id);

        if (customer == null)
        {
            throw new ArgumentException($"Not found customer with ID: {request.Id}");
        }

        if (!string.IsNullOrEmpty(request.Email) && request.Email != customer.Email)
        {
            var existingCustomer = await _context.Customers.FirstOrDefaultAsync(c =>
                c.Email == request.Email && c.Id != request.Id
            );

            if (existingCustomer != null)
            {
                throw new ArgumentException(
                    $"Email {request.Email} has been used by other customers"
                );
            }
        }

        _mapper.Map(request, customer);

        if (request.Gender != null && string.IsNullOrEmpty(request.Gender))
            customer.Gender = null;
        if (request.Address != null && string.IsNullOrEmpty(request.Address))
            customer.Address = null;
        if (request.City != null && string.IsNullOrEmpty(request.City))
            customer.City = null;
        if (request.District != null && string.IsNullOrEmpty(request.District))
            customer.District = null;
        if (request.Ward != null && string.IsNullOrEmpty(request.Ward))
            customer.Ward = null;
        if (request.IDCard != null && string.IsNullOrEmpty(request.IDCard))
            customer.IDCard = null;
        if (request.Note != null && string.IsNullOrEmpty(request.Note))
            customer.Note = null;
        if (request.AvatarUrl != null && string.IsNullOrEmpty(request.AvatarUrl))
            customer.AvatarUrl = null;

        await _context.SaveChangesAsync();

        return _mapper.Map<DetailCustomerResponse>(customer);
    }

    public async Task<bool> DeleteCustomerAsync(DeleteCustomerRequest request)
    {
        var customer = await _context.Customers.FirstOrDefaultAsync(c => c.Id == request.Id);

        if (customer == null)
        {
            throw new ArgumentException($"Not found customer with ID: {request.Id}");
        }

        customer.Status = CustomerStatus.Deleted;
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<DetailCustomerResponse> ChangeCustomerStatusAsync(
        ChangeCustomerStatusRequest request
    )
    {
        var customer = await _context.Customers.FirstOrDefaultAsync(c => c.Id == request.Id);

        if (customer == null)
        {
            throw new ApiException("Customer does not exist", HttpStatusCode.BadRequest);
        }

        if (!request.IsValidStatus())
        {
            throw new ApiException(
                $"Invalid status: {request.Status}. Valid statuses are: Active, Inactive, Deleted",
                HttpStatusCode.BadRequest
            );
        }

        customer.Status = request.Status;

        await _context.SaveChangesAsync();

        return _mapper.Map<DetailCustomerResponse>(customer);
    }
}
