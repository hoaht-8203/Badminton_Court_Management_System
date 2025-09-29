using System;
using ApiApplication.Dtos;
using ApiApplication.Entities;
using AutoMapper;

namespace ApiApplication.Mappings;

public class ScheduleMappingProfile : Profile
{
    public ScheduleMappingProfile()
    {
        CreateMap<ScheduleRequest, Schedule>()
            .ForMember(
                dest => dest.StartDate,
                opt => opt.MapFrom(src => DateOnly.FromDateTime(src.StartDate))
            )
            .ForMember(
                dest => dest.EndDate,
                opt =>
                    opt.MapFrom(src =>
                        src.EndDate.HasValue
                            ? DateOnly.FromDateTime(src.EndDate.Value)
                            : (DateOnly?)null
                    )
            );
        CreateMap<Schedule, ScheduleResponse>()
            .ForMember(
                dest => dest.Date,
                opt => opt.MapFrom(src => src.StartDate.ToDateTime(TimeOnly.MinValue))
            )
            .ForMember(dest => dest.DayOfWeek, opt => opt.MapFrom(src => src.StartDate.DayOfWeek));
    }
}
