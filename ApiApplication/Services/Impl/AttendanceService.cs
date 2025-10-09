using System;
using ApiApplication.Data;
using ApiApplication.Dtos.Attendance;
using AutoMapper;

namespace ApiApplication.Services.Impl;

public class AttendanceService : IAttendanceService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    public AttendanceService(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }
    public async Task<bool> AddOrUpdateAttendanceRecordAsync(AttendanceRequest request)
    {
        if (request.Id == null)
        {
            var schedule = await _context.Schedules.FindAsync(request.StaffId, request.ShiftId, DateOnly.FromDateTime(request.Date));
            if (schedule == null) return false;
            var newAttendanceRecord = _mapper.Map<Entities.AttendanceRecord>(request);
            await _context.AttendanceRecords.AddAsync(newAttendanceRecord);
        }
        else
        {
            var attendanceRecord = await _context.AttendanceRecords.FindAsync(request.Id.Value);
            if (attendanceRecord == null) return false;

            if (request.CheckInTime == null && request.CheckOutTime == null && request.Notes == null)
            return false;

            attendanceRecord.CheckInTime = request.CheckInTime ?? attendanceRecord.CheckInTime;
            attendanceRecord.CheckOutTime = request.CheckOutTime ?? attendanceRecord.CheckOutTime;
            attendanceRecord.Notes = request.Notes ?? attendanceRecord.Notes;

        }
        await _context.SaveChangesAsync();
        return true;
    }
    public async Task<AttendanceResponse?> GetAttendanceRecordByIdAsync(int attendanceRecordId)
    {
        var attendanceRecord = await _context.AttendanceRecords.FindAsync(attendanceRecordId);
        if (attendanceRecord == null) return null;

        return _mapper.Map<AttendanceResponse>(attendanceRecord);
    }
}
