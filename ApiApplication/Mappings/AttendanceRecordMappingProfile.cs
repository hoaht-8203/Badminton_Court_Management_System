using System;

namespace ApiApplication.Mappings;

public class AttendanceRecordMappingProfile : AutoMapper.Profile
{
    public AttendanceRecordMappingProfile()
    {
        CreateMap<Entities.AttendanceRecord, Dtos.Attendance.AttendanceResponse>()
            .ForMember(dest => dest.Date, opt => opt.MapFrom(src => src.Date.ToDateTime(TimeOnly.MinValue)))
            .ForMember(dest => dest.Staff, opt => opt.MapFrom(src => src.Staff))
            .ForMember(dest => dest.Shift, opt => opt.MapFrom(src => src.Shift));
        CreateMap<Dtos.Attendance.AttendanceRequest, Entities.AttendanceRecord>()
            .ForMember(dest => dest.Date, opt => opt.MapFrom(src => DateOnly.FromDateTime(src.Date)));
    }
}
