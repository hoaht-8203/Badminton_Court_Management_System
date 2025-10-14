using System.Net;
using ApiApplication.Constants;
using ApiApplication.Data;
using ApiApplication.Dtos.Service;
using ApiApplication.Entities;
using ApiApplication.Exceptions;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Services.Impl;

public class ServiceService(ApplicationDbContext context, IMapper mapper) : IServiceService
{
    private readonly ApplicationDbContext _context = context;
    private readonly IMapper _mapper = mapper;

    public async Task<List<ListServiceResponse>> ListServiceAsync(ListServiceRequest request)
    {
        var query = _context.Services.AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Name))
        {
            query = query.Where(s => s.Name.ToLower().Contains(request.Name.ToLower()));
        }
        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            query = query.Where(s => s.Status == request.Status);
        }
        if (!string.IsNullOrWhiteSpace(request.Category))
        {
            query = query.Where(s => s.Category == request.Category);
        }

        query = query.OrderByDescending(s => s.CreatedAt);
        var services = await query.ToListAsync();
        return _mapper.Map<List<ListServiceResponse>>(services);
    }

    public async Task<DetailServiceResponse> DetailServiceAsync(DetailServiceRequest request)
    {
        var service = await _context.Services.FirstOrDefaultAsync(s => s.Id == request.Id);

        if (service == null)
        {
            throw new ApiException(
                $"Không tìm thấy dịch vụ với ID: {request.Id}",
                HttpStatusCode.BadRequest
            );
        }

        return _mapper.Map<DetailServiceResponse>(service);
    }

    public async Task<DetailServiceResponse> CreateServiceAsync(CreateServiceRequest request)
    {
        // Generate code if not provided
        string serviceCode = request.Code ?? await GenerateServiceCodeAsync();

        // Validate unique code
        if (await _context.Services.AnyAsync(s => s.Code == serviceCode))
        {
            throw new ApiException(
                $"Mã dịch vụ {serviceCode} đã được sử dụng",
                HttpStatusCode.BadRequest
            );
        }

        // Validate unique name
        if (await _context.Services.AnyAsync(s => s.Name == request.Name))
        {
            throw new ApiException(
                $"Tên dịch vụ {request.Name} đã được sử dụng",
                HttpStatusCode.BadRequest
            );
        }

        var entity = _mapper.Map<Service>(request);
        entity.Code = serviceCode;
        entity.Status = ServiceStatus.Active;

        var created = await _context.Services.AddAsync(entity);
        await _context.SaveChangesAsync();

        var reloaded = await _context.Services.FirstAsync(s => s.Id == created.Entity.Id);
        return _mapper.Map<DetailServiceResponse>(reloaded);
    }

    public async Task<DetailServiceResponse> UpdateServiceAsync(UpdateServiceRequest request)
    {
        var service = await _context.Services.FirstOrDefaultAsync(s => s.Id == request.Id);

        if (service == null)
        {
            throw new ApiException(
                $"Không tìm thấy dịch vụ với ID: {request.Id}",
                HttpStatusCode.BadRequest
            );
        }

        if (!string.IsNullOrEmpty(request.Code) && request.Code != service.Code)
        {
            var isExist = await _context.Services.AnyAsync(s =>
                s.Code == request.Code && s.Id != request.Id
            );
            if (isExist)
            {
                throw new ApiException(
                    $"Mã dịch vụ {request.Code} đã được sử dụng",
                    HttpStatusCode.BadRequest
                );
            }
        }

        if (!string.IsNullOrEmpty(request.Name) && request.Name != service.Name)
        {
            var isExist = await _context.Services.AnyAsync(s =>
                s.Name == request.Name && s.Id != request.Id
            );
            if (isExist)
            {
                throw new ApiException(
                    $"Tên dịch vụ {request.Name} đã được sử dụng",
                    HttpStatusCode.BadRequest
                );
            }
        }

        _mapper.Map(request, service);
        await _context.SaveChangesAsync();
        return _mapper.Map<DetailServiceResponse>(service);
    }

    public async Task<bool> DeleteServiceAsync(DeleteServiceRequest request)
    {
        var service = await _context.Services.FirstOrDefaultAsync(s => s.Id == request.Id);
        if (service == null)
        {
            throw new ApiException(
                $"Không tìm thấy dịch vụ với ID: {request.Id}",
                HttpStatusCode.BadRequest
            );
        }

        service.Status = ServiceStatus.Deleted;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<DetailServiceResponse> ChangeServiceStatusAsync(
        ChangeServiceStatusRequest request
    )
    {
        var service = await _context.Services.FirstOrDefaultAsync(s => s.Id == request.Id);
        if (service == null)
        {
            throw new ApiException("Dịch vụ không tồn tại", HttpStatusCode.BadRequest);
        }

        if (!request.IsValidStatus())
        {
            throw new ApiException(
                $"Trạng thái không hợp lệ: {request.Status}. Trạng thái hợp lệ là: Active, Inactive, Deleted",
                HttpStatusCode.BadRequest
            );
        }

        service.Status = request.Status;
        await _context.SaveChangesAsync();
        return _mapper.Map<DetailServiceResponse>(service);
    }

    public async Task<BookingServiceDto> AddBookingServiceAsync(AddBookingServiceRequest request)
    {
        var booking =
            await _context.BookingCourts.FirstOrDefaultAsync(b => b.Id == request.BookingId)
            ?? throw new ApiException("Không tìm thấy đặt sân", HttpStatusCode.BadRequest);
        var service =
            await _context.Services.FirstOrDefaultAsync(s => s.Id == request.ServiceId)
            ?? throw new ApiException("Không tìm thấy dịch vụ", HttpStatusCode.BadRequest);

        // Check if service already exists for this booking
        var existingBookingService = await _context.BookingServices.FirstOrDefaultAsync(bs =>
            bs.BookingId == request.BookingId && bs.ServiceId == request.ServiceId
        );

        if (existingBookingService != null)
        {
            // Update quantity
            existingBookingService.Quantity += request.Quantity;
            existingBookingService.TotalPrice =
                existingBookingService.Quantity
                * existingBookingService.UnitPrice
                * existingBookingService.Hours;
            await _context.SaveChangesAsync();
            return _mapper.Map<BookingServiceDto>(existingBookingService);
        }

        // Calculate hours based on booking duration
        var startTime = booking.StartTime;
        var endTime = booking.EndTime;
        var hours = (decimal)(endTime.ToTimeSpan() - startTime.ToTimeSpan()).TotalHours;

        var bookingService = new BookingService
        {
            Id = Guid.NewGuid(),
            BookingId = request.BookingId,
            ServiceId = request.ServiceId,
            Booking = booking,
            Service = service,
            Quantity = request.Quantity,
            UnitPrice = service.PricePerHour,
            Hours = hours,
            TotalPrice = request.Quantity * service.PricePerHour * hours,
            Notes = request.Notes,
            Status = BookingServiceStatus.Pending,
        };

        await _context.BookingServices.AddAsync(bookingService);
        await _context.SaveChangesAsync();

        // Reload with service information
        var reloaded = await _context
            .BookingServices.Include(bs => bs.Service)
            .FirstAsync(bs => bs.Id == bookingService.Id);

        return _mapper.Map<BookingServiceDto>(reloaded);
    }

    public async Task<bool> RemoveBookingServiceAsync(RemoveBookingServiceRequest request)
    {
        var bookingService = await _context.BookingServices.FirstOrDefaultAsync(bs =>
            bs.Id == request.Id
        );
        if (bookingService == null)
        {
            throw new ApiException("Không tìm thấy dịch vụ đặt sân", HttpStatusCode.BadRequest);
        }

        _context.BookingServices.Remove(bookingService);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<BookingServiceDto>> GetBookingServicesAsync(Guid bookingId)
    {
        var bookingServices = await _context
            .BookingServices.Include(bs => bs.Service)
            .Where(bs => bs.BookingId == bookingId)
            .OrderBy(bs => bs.CreatedAt)
            .ToListAsync();

        return _mapper.Map<List<BookingServiceDto>>(bookingServices);
    }

    private async Task<string> GenerateServiceCodeAsync()
    {
        // Get the latest service code
        var latestService = await _context
            .Services.Where(s => s.Code.StartsWith("DV"))
            .OrderByDescending(s => s.Code)
            .FirstOrDefaultAsync();

        if (latestService == null)
        {
            return "DV000001";
        }

        // Extract number from the latest code
        var codeNumber = latestService.Code.Substring(2); // Remove "DV" prefix
        if (int.TryParse(codeNumber, out int number))
        {
            return $"DV{(number + 1):D6}";
        }

        // If parsing fails, start from 1
        return "DV000001";
    }
}
