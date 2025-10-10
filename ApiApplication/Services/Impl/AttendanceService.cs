using System;
using ApiApplication.Data;
using ApiApplication.Dtos.Attendance;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

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
        var shift = await _context.Shifts.FindAsync(request.ShiftId);
        if (shift == null) return false;

        var statusByShift = Helpers.AttendanceHelper.DetermineStatusByShift(
            request.CheckInTime,
            request.CheckOutTime,
            shift
        );

        if (request.Id == null)
        {
            //Todo: check if staff is assigned to that shift on that date

            // var schedule = await _context.Schedules.FirstOrDefaultAsync(s =>
            //     s.StaffId == request.StaffId &&
            //     s.ShiftId == request.ShiftId &&
            //     s.StartDate <= DateOnly.FromDateTime(request.Date) &&
            //     (s.EndDate == null || s.EndDate >= DateOnly.FromDateTime(request.Date)) &&
            //     (s.IsFixedShift || s.StartDate == DateOnly.FromDateTime(request.Date))
            // );
            // if (schedule == null) return false;
            var newAttendanceRecord = _mapper.Map<Entities.AttendanceRecord>(request);
            newAttendanceRecord.Status = statusByShift;
            _context.AttendanceRecords.Add(newAttendanceRecord);
            await _context.SaveChangesAsync();
        }
        else
        {
            var attendanceRecord = await _context.AttendanceRecords.FindAsync(request.Id.Value);
            if (attendanceRecord == null) return false;

            if (request.CheckInTime == null && request.CheckOutTime == null && request.Notes == null)
                return false;
            
            attendanceRecord.Status = statusByShift;
            attendanceRecord.CheckInTime = request.CheckInTime ?? attendanceRecord.CheckInTime;
            attendanceRecord.CheckOutTime = request.CheckOutTime ?? attendanceRecord.CheckOutTime;
            attendanceRecord.Notes = request.Notes ?? attendanceRecord.Notes;
            _context.AttendanceRecords.Update(attendanceRecord);
            await _context.SaveChangesAsync();
        }
        return true;
    }
    public async Task<AttendanceResponse?> GetAttendanceRecordByIdAsync(int attendanceRecordId)
    {
        var attendanceRecord = await _context.AttendanceRecords.FindAsync(attendanceRecordId);
        if (attendanceRecord == null) return null;

        return _mapper.Map<AttendanceResponse>(attendanceRecord);
    }
}
