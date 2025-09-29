using ApiApplication.Data;
using ApiApplication.Dtos.Invoice;
using ApiApplication.Entities;
using ApiApplication.Entities.Shared;
using ApiApplication.Exceptions;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Services.Impl;

public class InvoiceService(ApplicationDbContext context, IMapper mapper) : IInvoiceService
{
	private readonly ApplicationDbContext _context = context;
	private readonly IMapper _mapper = mapper;

	public async Task<DetailInvoiceResponse> CreateInvocieAsync(CreateInvoiceRequest request)
	{
		var booking = await _context.BookingCourts
			.Include(b => b.Customer)
			.Include(b => b.Court)
			.FirstOrDefaultAsync(b => b.Id == request.BookingId);
		if (booking == null)
		{
			throw new ApiException($"Booking không tồn tại: {request.BookingId}");
		}

		var existed = await _context.Invoices.FirstOrDefaultAsync(i => i.BookingId == request.BookingId);
		if (existed != null)
		{
			return _mapper.Map<DetailInvoiceResponse>(existed);
		}

		var invoice = _mapper.Map<Invoice>(booking);
		invoice.Status = InvoiceStatus.Pending;
		invoice.Amount = await CalculateBookingAmountAsync(booking);

		// Generate formatted ID: HD-ddMMyyyy-000001
		invoice.Id = await GenerateNextInvoiceIdAsync();

		await _context.Invoices.AddAsync(invoice);

		// Best-effort retry in case of rare collision under concurrency
		for (var attempt = 0; attempt < 3; attempt++)
		{
			try
			{
				await _context.SaveChangesAsync();
				break;
			}
			catch (DbUpdateException)
			{
				// Regenerate and retry once more
				invoice.Id = await GenerateNextInvoiceIdAsync();
			}
		}

		return _mapper.Map<DetailInvoiceResponse>(invoice);
	}

	private async Task<string> GenerateNextInvoiceIdAsync()
	{
		var now = DateTime.Now;
		var prefix = $"HD-{now:ddMMyyyy}-";

		var lastId = await _context.Invoices
			.AsNoTracking()
			.Where(i => i.Id.StartsWith(prefix))
			.OrderByDescending(i => i.Id)
			.Select(i => i.Id)
			.FirstOrDefaultAsync();

		var next = 1;
		if (!string.IsNullOrEmpty(lastId))
		{
			var numericPart = lastId.Substring(prefix.Length);
			if (int.TryParse(numericPart, out var parsed))
			{
				next = parsed + 1;
			}
		}

		return $"{prefix}{next.ToString("D6")}";
	}

	public async Task<DetailInvoiceResponse?> DetailByBookingIdAsync(DetailInvoiceByBookingIdRequest request)
	{
		var invoice = await _context.Invoices
			.Include(i => i.Booking)!.ThenInclude(b => b!.Customer)
			.Include(i => i.Booking)!.ThenInclude(b => b!.Court)
			.FirstOrDefaultAsync(i => i.BookingId == request.BookingId);
		return invoice == null ? null : _mapper.Map<DetailInvoiceResponse>(invoice);
	}

	public async Task<DetailInvoiceResponse?> DetailInvoiceByIdAsync(DetailInvoiceRequest request)
	{
		var invoice = await _context.Invoices
			.Include(i => i.Booking)!.ThenInclude(b => b!.Customer)
			.Include(i => i.Booking)!.ThenInclude(b => b!.Court)
			.FirstOrDefaultAsync(i => i.Id == request.Id);
		return invoice == null ? null : _mapper.Map<DetailInvoiceResponse>(invoice);
	}

    private async Task<decimal> CalculateBookingAmountAsync(BookingCourt booking)
    {
        // Chuẩn: cộng theo phần giao giữa từng rule và khung giờ booking
        var dow = GetCustomDayOfWeek(booking.StartDate);

        var rules = await _context.CourtPricingRules
            .Where(r => r.CourtId == booking.CourtId
                && r.DaysOfWeek.Contains(dow)
                && r.EndTime > booking.StartTime
                && r.StartTime < booking.EndTime)
            .ToListAsync();

        if (rules.Count == 0)
        {
            return 0m;
        }

        var total = 0m;
        var bStart = booking.StartTime;
        var bEnd = booking.EndTime;

        foreach (var r in rules)
        {
            var overlapStart = Max(r.StartTime, bStart);
            var overlapEnd = Min(r.EndTime, bEnd);
            if (overlapEnd > overlapStart)
            {
                var hours = (decimal)(overlapEnd.ToTimeSpan() - overlapStart.ToTimeSpan()).TotalHours;
                total += r.PricePerHour * hours;
            }
        }

        return Math.Round(total, 2);
    }

    private static TimeOnly Max(TimeOnly a, TimeOnly b) => a > b ? a : b;
    private static TimeOnly Min(TimeOnly a, TimeOnly b) => a < b ? a : b;

	private static int GetCustomDayOfWeek(DateOnly date)
	{
		var sys = (int)date.DayOfWeek;
		return sys == 0 ? 8 : sys + 1; 
	}
}


