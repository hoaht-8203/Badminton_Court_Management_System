using System.Net;
using ApiApplication.Data;
using ApiApplication.Dtos.Slider;
using ApiApplication.Entities;
using ApiApplication.Exceptions;
using ApiApplication.Sessions;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Services.Impl;

public class SliderService(ApplicationDbContext context, IMapper mapper, ICurrentUser currentUser)
    : ISliderService
{
    private readonly ApplicationDbContext _context = context;
    private readonly IMapper _mapper = mapper;
    private readonly ICurrentUser _currentUser = currentUser;

    public async Task<List<ListSliderResponse>> ListSlidersAsync()
    {
        var query = await _context.Sliders.OrderByDescending(s => s.CreatedAt).ToListAsync();
        return _mapper.Map<List<ListSliderResponse>>(query);
    }

    public async Task<DetailSliderResponse> DetailSliderAsync(DetailSliderRequest request)
    {
        var slider = await _context.Sliders.FirstOrDefaultAsync(s => s.Id == request.Id);
        if (slider == null)
        {
            throw new ApiException(
                $"Không tìm thấy slider với ID: {request.Id}",
                HttpStatusCode.BadRequest
            );
        }
        return _mapper.Map<DetailSliderResponse>(slider);
    }

    public async Task<DetailSliderResponse> CreateSliderAsync(CreateSliderRequest request)
    {
        var slider = _mapper.Map<Slider>(request);
        _context.Sliders.Add(slider);
        await _context.SaveChangesAsync();
        return _mapper.Map<DetailSliderResponse>(slider);
    }

    public async Task<DetailSliderResponse> UpdateSliderAsync(UpdateSliderRequest request)
    {
        var entity = await _context.Sliders.FirstOrDefaultAsync(s => s.Id == request.Id);
        if (entity == null)
        {
            throw new ApiException(
                $"Không tìm thấy slider với ID: {request.Id}",
                HttpStatusCode.BadRequest
            );
        }

        _mapper.Map(request, entity);

        await _context.SaveChangesAsync();
        return _mapper.Map<DetailSliderResponse>(entity);
    }

    public async Task DeleteSliderAsync(DeleteSliderRequest request)
    {
        var entity = await _context.Sliders.FirstOrDefaultAsync(s => s.Id == request.Id);
        if (entity == null)
        {
            throw new ApiException(
                $"Không tìm thấy slider với ID: {request.Id}",
                HttpStatusCode.BadRequest
            );
        }

        _context.Sliders.Remove(entity);
        await _context.SaveChangesAsync();
    }
}
