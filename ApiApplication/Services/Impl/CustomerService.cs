using System.Net;
using ApiApplication.Data;
using ApiApplication.Dtos.Customer;
using ApiApplication.Entities;
using ApiApplication.Entities.Shared;
using ApiApplication.Exceptions;
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

    private string GetCurrentUsername()
    {
        return _currentUser.Username ?? "System";
    }

    public async Task<List<ListCustomerResponse>> ListCustomersAsync(ListCustomerRequest request)
    {
        var query = _context.Customers.AsQueryable();

        if (!string.IsNullOrEmpty(request.FullName))
        {
            query = query.Where(c => c.FullName.Contains(request.FullName));
        }

        var customers = await query.ToListAsync();
        return _mapper.Map<List<ListCustomerResponse>>(customers);
    }

    public async Task<DetailCustomerResponse> GetCustomerByIdAsync(int id)
    {
        var customer = await _context.Customers.FirstOrDefaultAsync(c => c.Id == id);

        if (customer == null)
        {
            throw new ArgumentException($"Not found customer with ID: {id}");
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
        customer.CreatedAt = DateTime.UtcNow;
        customer.CreatedBy = GetCurrentUsername();

        _context.Customers.Add(customer);
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

        customer.UpdatedAt = DateTime.UtcNow;
        customer.UpdatedBy = GetCurrentUsername();

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
        customer.UpdatedAt = DateTime.UtcNow;
        customer.UpdatedBy = GetCurrentUsername();
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
        customer.UpdatedAt = DateTime.UtcNow;
        customer.UpdatedBy = GetCurrentUsername();

        await _context.SaveChangesAsync();

        return _mapper.Map<DetailCustomerResponse>(customer);
    }
}
