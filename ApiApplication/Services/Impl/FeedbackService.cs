using ApiApplication.Data;
using ApiApplication.Dtos.Feedback;
using ApiApplication.Entities;
using ApiApplication.Entities.Shared;
using ApiApplication.Exceptions;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ApiApplication.Sessions;

namespace ApiApplication.Services.Impl;

public class FeedbackService(
    ApplicationDbContext context,
    IMapper mapper,
    ICurrentUser currentUser
) : IFeedbackService
{
    private readonly ApplicationDbContext _context = context;
    private readonly IMapper _mapper = mapper;
    private readonly ICurrentUser _currentUser = currentUser;


    public async Task<DetailFeedbackResponse> CreateFeedBackAsync(CreateFeedbackRequest request)
    {
        if (_currentUser.UserId == Guid.Empty)
        {
            throw new ApiException("Không được phép truy cập", System.Net.HttpStatusCode.Unauthorized);
        }
        var customer = await _context.Customers.FirstOrDefaultAsync(c => c.UserId == _currentUser.UserId);

        // Xác thực sự tồn tại và đã hoàn thành việc đặt chỗ
        var occurrence = await _context
            .BookingCourtOccurrences.Include(x => x.BookingCourt)
            .FirstOrDefaultAsync(x => x.Id == request.BookingCourtOccurrenceId);
        if (occurrence == null)
        {
            throw new ApiException($"BookingCourtOccurrence không tồn tại: {request.BookingCourtOccurrenceId}", System.Net.HttpStatusCode.NotFound);
        }
        if (!string.Equals(occurrence.Status, BookingCourtOccurrenceStatus.Completed, StringComparison.Ordinal))
        {
            throw new ApiException("Chỉ có thể đánh giá khi lịch đã Completed", System.Net.HttpStatusCode.BadRequest);
        }

        // Dự phòng: nếu người dùng hiện tại không được liên kết với khách hàng (ví dụ: nhân viên), hãy sử dụng khách hàng của đơn đặt phòng
        if (customer == null)
        {
            if (occurrence.BookingCourt == null)
            {
                throw new ApiException("Không xác định được khách hàng của lịch đặt", System.Net.HttpStatusCode.BadRequest);
            }
            customer = await _context.Customers.FirstOrDefaultAsync(c => c.Id == occurrence.BookingCourt.CustomerId)
                ?? throw new ApiException("Khách hàng của lịch đặt không tồn tại", System.Net.HttpStatusCode.NotFound);
        }

        if (!string.Equals(customer.Status, CustomerStatus.Active, StringComparison.Ordinal))
        {
            throw new ApiException("Tài khoản khách hàng không hoạt động", System.Net.HttpStatusCode.Forbidden);
        }
        // Xác thực rằng người tạo phản hồi là chủ sở hữu của lần đặt phòng này
        if (occurrence.BookingCourt == null || occurrence.BookingCourt.CustomerId != customer.Id)
        {
            throw new ApiException("Khách hàng không sở hữu lịch đặt này", System.Net.HttpStatusCode.Forbidden);
        }

        // Prevent duplicate feedback for the same (CustomerId, BookingCourtOccurrenceId)
        var duplicated = await _context.Feedbacks.AnyAsync(f =>
            f.CustomerId == customer.Id && f.BookingCourtOccurrenceId == request.BookingCourtOccurrenceId && f.Status != FeedbackStatus.Deleted
        );
        if (duplicated)
        {
            throw new ApiException("Bạn đã đánh giá lịch này rồi", System.Net.HttpStatusCode.BadRequest);
        }

        // Validate rating fields (1..5)
        if (request.Rating is < 1 or > 5)
            throw new ApiException("Rating phải từ 1 đến 5", System.Net.HttpStatusCode.BadRequest);
        if (request.CourtQuality is < 1 or > 5)
            throw new ApiException("CourtQuality phải từ 1 đến 5", System.Net.HttpStatusCode.BadRequest);
        if (request.StaffService is < 1 or > 5)
            throw new ApiException("StaffService phải từ 1 đến 5", System.Net.HttpStatusCode.BadRequest);
        if (request.Cleanliness is < 1 or > 5)
            throw new ApiException("Cleanliness phải từ 1 đến 5", System.Net.HttpStatusCode.BadRequest);
        if (request.Lighting is < 1 or > 5)
            throw new ApiException("Lighting phải từ 1 đến 5", System.Net.HttpStatusCode.BadRequest);
        if (request.ValueForMoney is < 1 or > 5)
            throw new ApiException("ValueForMoney phải từ 1 đến 5", System.Net.HttpStatusCode.BadRequest);

        // Validate comment length (<= 2000 - matching db config)
        if (request.Comment != null && request.Comment.Length > 2000)
            throw new ApiException("Comment tối đa 2000 ký tự", System.Net.HttpStatusCode.BadRequest);

        // Validate and sanitize media
        if (request.MediaUrl != null)
        {
            // Trim, remove empty, distinct, and enforce max 3
            var cleaned = request.MediaUrl
                .Where(s => !string.IsNullOrWhiteSpace(s))
                .Select(s => s.Trim())
                .Distinct()
                .Take(3)
                .ToArray();
            if (cleaned.Length != request.MediaUrl.Length && request.MediaUrl.Length > 3)
            {
                // If more than 3 provided, inform user explicitly
                throw new ApiException("Tối đa 3 media cho feedback", System.Net.HttpStatusCode.BadRequest);
            }
            request.MediaUrl = cleaned;
        }

        var entity = _mapper.Map<Feedback>(request);
        entity.AdminReply = null; // AdminReply không được set khi tạo bởi khách hàng
        entity.Status = FeedbackStatus.Active;
        entity.CustomerId = customer.Id;
        _context.Feedbacks.Add(entity);
        await _context.SaveChangesAsync();

        return _mapper.Map<DetailFeedbackResponse>(entity);
    }

    public async Task<DetailFeedbackResponse> DetailFeedBackAsync(DetailFeedbackRequest request)
    {
        var entity = await _context.Feedbacks.FirstOrDefaultAsync(f => f.Id == request.Id);
        if (entity == null)
        {
            throw new ApiException($"Feedback không tồn tại: {request.Id}", System.Net.HttpStatusCode.NotFound);
        }
        return _mapper.Map<DetailFeedbackResponse>(entity);
    }

    public async Task<DetailFeedbackResponse> UpdateFeedBackAsync(UpdateFeedbackRequest request)
    {
        var entity = await _context.Feedbacks.FirstOrDefaultAsync(f => f.Id == request.Id);
        if (entity == null)
        {
            throw new ApiException($"Feedback không tồn tại: {request.Id}", System.Net.HttpStatusCode.NotFound);
        }
        if (string.Equals(entity.Status, FeedbackStatus.Deleted, StringComparison.Ordinal))
        {
            throw new ApiException("Feedback đã bị xoá, không thể cập nhật", System.Net.HttpStatusCode.BadRequest);
        }

        // Ensure related occurrence still valid and Completed
        var occurrence = await _context.BookingCourtOccurrences.FirstOrDefaultAsync(x => x.Id == entity.BookingCourtOccurrenceId);
        if (occurrence == null)
        {
            throw new ApiException("BookingCourtOccurrence không tồn tại", System.Net.HttpStatusCode.NotFound);
        }
        if (!string.Equals(occurrence.Status, BookingCourtOccurrenceStatus.Completed, StringComparison.Ordinal))
        {
            throw new ApiException("Chỉ có thể cập nhật đánh giá khi lịch đã Completed", System.Net.HttpStatusCode.BadRequest);
        }

        // Validate fields if provided
        if (request.Rating.HasValue && (request.Rating.Value < 1 || request.Rating.Value > 5))
            throw new ApiException("Rating phải từ 1 đến 5", System.Net.HttpStatusCode.BadRequest);
        if (request.CourtQuality.HasValue && (request.CourtQuality.Value < 1 || request.CourtQuality.Value > 5))
            throw new ApiException("CourtQuality phải từ 1 đến 5", System.Net.HttpStatusCode.BadRequest);
        if (request.StaffService.HasValue && (request.StaffService.Value < 1 || request.StaffService.Value > 5))
            throw new ApiException("StaffService phải từ 1 đến 5", System.Net.HttpStatusCode.BadRequest);
        if (request.Cleanliness.HasValue && (request.Cleanliness.Value < 1 || request.Cleanliness.Value > 5))
            throw new ApiException("Cleanliness phải từ 1 đến 5", System.Net.HttpStatusCode.BadRequest);
        if (request.Lighting.HasValue && (request.Lighting.Value < 1 || request.Lighting.Value > 5))
            throw new ApiException("Lighting phải từ 1 đến 5", System.Net.HttpStatusCode.BadRequest);
        if (request.ValueForMoney.HasValue && (request.ValueForMoney.Value < 1 || request.ValueForMoney.Value > 5))
            throw new ApiException("ValueForMoney phải từ 1 đến 5", System.Net.HttpStatusCode.BadRequest);

        if (request.Comment != null && request.Comment.Length > 2000)
            throw new ApiException("Comment tối đa 2000 ký tự", System.Net.HttpStatusCode.BadRequest);

        if (request.MediaUrl != null)
        {
            var cleaned = request.MediaUrl
                .Where(s => !string.IsNullOrWhiteSpace(s))
                .Select(s => s.Trim())
                .Distinct()
                .Take(3)
                .ToArray();
            if (cleaned.Length != request.MediaUrl.Length && request.MediaUrl.Length > 3)
            {
                throw new ApiException("Tối đa 3 media cho feedback", System.Net.HttpStatusCode.BadRequest);
            }
            request.MediaUrl = cleaned;
        }

        var originalReply = entity.AdminReply;
        _mapper.Map(request, entity);

        // Set AdminReplyAt when AdminReply is updated from null/empty to non-empty
        if (string.IsNullOrWhiteSpace(originalReply) && !string.IsNullOrWhiteSpace(entity.AdminReply))
        {
            entity.AdminReplyAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return _mapper.Map<DetailFeedbackResponse>(entity);
    }

    public async Task<bool> DeleteFeedBackAsync(DeleteFeedbackRequest request)
    {
        var entity = await _context.Feedbacks.FirstOrDefaultAsync(f => f.Id == request.Id);
        if (entity == null)
        {
            throw new ApiException($"Feedback không tồn tại: {request.Id}", System.Net.HttpStatusCode.NotFound);
        }
        entity.Status = FeedbackStatus.Deleted;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<ListFeedbackResponse>> ListFeedBackAsync(ListFeedbackRequest request)
    {
        var query = _context.Feedbacks.AsQueryable();

        if (request.Id.HasValue)
            query = query.Where(f => f.Id == request.Id);
        if (request.CustomerId.HasValue)
            query = query.Where(f => f.CustomerId == request.CustomerId);
        if (request.BookingCourtOccurrenceId.HasValue)
            query = query.Where(f => f.BookingCourtOccurrenceId == request.BookingCourtOccurrenceId);
        if (request.Rating.HasValue)
            query = query.Where(f => f.Rating == request.Rating);
        if (!string.IsNullOrWhiteSpace(request.Status))
            query = query.Where(f => f.Status == request.Status);
        if (request.From.HasValue)
            query = query.Where(f => f.CreatedAt >= request.From.Value);
        if (request.To.HasValue)
            query = query.Where(f => f.CreatedAt <= request.To.Value);

        var items = await query.OrderByDescending(f => f.CreatedAt).ToListAsync();
        return _mapper.Map<List<ListFeedbackResponse>>(items);
    }

    public async Task<List<ListFeedbackResponse>> ListFeedBackByBookingOccurrenceAsync(ListFeedbackByBookingRequest request)
    {
        var items = await _context
            .Feedbacks.Where(f => f.BookingCourtOccurrenceId == request.BookingCourtOccurrenceId)
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync();
        return _mapper.Map<List<ListFeedbackResponse>>(items);
    }

    public async Task<List<ListFeedbackResponse>> ListFeedBackByCustomerAsync(ListFeedbackByCustomerRequest request)
    {
        var items = await _context
            .Feedbacks.Where(f => f.CustomerId == request.CustomerId)
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync();
        return _mapper.Map<List<ListFeedbackResponse>>(items);
    }
}


