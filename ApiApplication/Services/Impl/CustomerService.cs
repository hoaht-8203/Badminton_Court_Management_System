using System.Net;
using System.Text.RegularExpressions;
using ApiApplication.Data;
using ApiApplication.Dtos.Customer;
using ApiApplication.Dtos.Pagination;
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

        if (!string.IsNullOrWhiteSpace(request.Keyword))
        {
            var kw = request.Keyword.Trim();
            query = query.Where(c =>
                (c.FullName != null && EF.Functions.ILike(c.FullName, $"%{kw}%"))
                || (c.PhoneNumber != null && EF.Functions.ILike(c.PhoneNumber, $"%{kw}%"))
                || (c.Email != null && EF.Functions.ILike(c.Email, $"%{kw}%"))
            );
        }

        query = query.OrderByDescending(c => c.CreatedAt);

        return await query.ToPagedResponseAsync<Customer, ListCustomerResponse>(
            new() { Page = request.Page, PageSize = request.PageSize },
            _mapper,
            cancellationToken
        );
    }

    public async Task<DetailCustomerResponse> GetCustomerByIdAsync(DetailCustomerRequest request)
    {
        var customer = await _context.Customers.FirstOrDefaultAsync(c => c.Id == request.Id);

        if (customer == null)
        {
            throw new ApiException(
                $"Not found customer with ID: {request.Id}",
                HttpStatusCode.BadRequest
            );
        }

        return _mapper.Map<DetailCustomerResponse>(customer);
    }

    public async Task<DetailCustomerResponse> CreateCustomerAsync(CreateCustomerRequest request)
    {
        // Validate email uniqueness
        var existingCustomerByEmail = await _context.Customers.FirstOrDefaultAsync(c =>
            c.Email == request.Email
        );

        if (existingCustomerByEmail != null)
        {
            throw new ApiException(
                $"Email {request.Email} đã được sử dụng bởi khách hàng khác.",
                HttpStatusCode.BadRequest
            );
        }

        // Validate phone number format
        if (!string.IsNullOrEmpty(request.PhoneNumber))
        {
            if (
                request.PhoneNumber.Length < 9
                || request.PhoneNumber.Length > 11
                || !Regex.IsMatch(request.PhoneNumber, @"^\d{9,11}$")
            )
            {
                throw new ApiException(
                    "Số điện thoại phải có từ 9 đến 11 chữ số",
                    HttpStatusCode.BadRequest
                );
            }

            // Check phone number uniqueness
            var existingCustomerByPhone = await _context.Customers.FirstOrDefaultAsync(c =>
                c.PhoneNumber == request.PhoneNumber
            );

            if (existingCustomerByPhone != null)
            {
                throw new ApiException(
                    $"Số điện thoại '{request.PhoneNumber}' đã được sử dụng bởi khách hàng khác.",
                    HttpStatusCode.BadRequest
                );
            }
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
            throw new ApiException(
                $"Not found customer with ID: {request.Id}",
                HttpStatusCode.BadRequest
            );
        }

        // Validate that required fields cannot be set to null/empty
        if (string.IsNullOrWhiteSpace(request.FullName))
        {
            throw new ApiException("Họ và tên không được để trống", HttpStatusCode.BadRequest);
        }

        if (string.IsNullOrWhiteSpace(request.PhoneNumber))
        {
            throw new ApiException("Số điện thoại không được để trống", HttpStatusCode.BadRequest);
        }

        if (string.IsNullOrWhiteSpace(request.Email))
        {
            throw new ApiException("Email không được để trống", HttpStatusCode.BadRequest);
        }

        if (!string.IsNullOrEmpty(request.Email) && request.Email != customer.Email)
        {
            var existingCustomer = await _context.Customers.FirstOrDefaultAsync(c =>
                c.Email == request.Email && c.Id != request.Id
            );

            if (existingCustomer != null)
            {
                throw new ApiException(
                    $"Email {request.Email} has been used by other customers",
                    HttpStatusCode.BadRequest
                );
            }
        }

        // Validate and check phone number uniqueness if provided and changed
        if (
            !string.IsNullOrEmpty(request.PhoneNumber)
            && request.PhoneNumber != customer.PhoneNumber
        )
        {
            // Validate phone number format
            if (
                request.PhoneNumber.Length < 9
                || request.PhoneNumber.Length > 11
                || !Regex.IsMatch(request.PhoneNumber, @"^\d{9,11}$")
            )
            {
                throw new ApiException(
                    "Số điện thoại phải có từ 9 đến 11 chữ số",
                    HttpStatusCode.BadRequest
                );
            }

            // Check phone number uniqueness
            var existingCustomerByPhone = await _context.Customers.FirstOrDefaultAsync(c =>
                c.PhoneNumber == request.PhoneNumber && c.Id != request.Id
            );

            if (existingCustomerByPhone != null)
            {
                throw new ApiException(
                    $"Số điện thoại '{request.PhoneNumber}' đã được sử dụng bởi khách hàng khác.",
                    HttpStatusCode.BadRequest
                );
            }
        }

        _mapper.Map(request, customer);
        await _context.SaveChangesAsync();
        return _mapper.Map<DetailCustomerResponse>(customer);
    }

    public async Task<bool> DeleteCustomerAsync(DeleteCustomerRequest request)
    {
        var customer = await _context.Customers.FirstOrDefaultAsync(c => c.Id == request.Id);

        if (customer == null)
        {
            throw new ApiException(
                $"Not found customer with ID: {request.Id}",
                HttpStatusCode.BadRequest
            );
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
