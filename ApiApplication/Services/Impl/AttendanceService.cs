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

    // public async Task<bool> AddOrUpdateAttendanceRecordAsync(AttendanceRequest request)
    // {

    //     if (request.Id == null)
    //     {
    //         var newAttendanceRecord = _mapper.Map<Entities.AttendanceRecord>(request);
    //         _context.AttendanceRecords.Add(newAttendanceRecord);
    //         await _context.SaveChangesAsync();
    //     }
    //     else
    //     {
    //         var attendanceRecord = await _context.AttendanceRecords.FindAsync(request.Id.Value);
    //         if (attendanceRecord == null) return false;

    //         if (request.CheckInTime == null && request.CheckOutTime == null && request.Notes == null)
    //             return false;

    //         attendanceRecord.Status = statusByShift;
    //         attendanceRecord.CheckInTime = request.CheckInTime ?? attendanceRecord.CheckInTime;
    //         attendanceRecord.CheckOutTime = request.CheckOutTime ?? attendanceRecord.CheckOutTime;
    //         attendanceRecord.Notes = request.Notes ?? attendanceRecord.Notes;
    //         _context.AttendanceRecords.Update(attendanceRecord);
    //         await _context.SaveChangesAsync();
    //     }
    //     return true;
    // }
    // public async Task<AttendanceResponse?> GetAttendanceRecordByIdAsync(int attendanceRecordId)
    // {
    //     var attendanceRecord = await _context.AttendanceRecords.FindAsync(attendanceRecordId);
    //     if (attendanceRecord == null) return null;

    //     return _mapper.Map<AttendanceResponse>(attendanceRecord);
    // }

    public async Task<bool> AddAttendanceRecordAsync(AttendanceRequest request)
    {
        var newAttendanceRecord = _mapper.Map<Entities.AttendanceRecord>(request);
        _context.AttendanceRecords.Add(newAttendanceRecord);
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<bool> UpdateAttendanceRecordAsync(AttendanceRequest request)
    {
        if (request.Id == null)
        {
            return false;
        }
        var attendanceRecord = await _context.AttendanceRecords.FindAsync(request.Id.Value);
        if (attendanceRecord == null)
            return false;

        if (request.CheckInTime == null && request.CheckOutTime == null && request.Notes == null)
            return false;

        attendanceRecord.CheckInTime = request.CheckInTime ?? attendanceRecord.CheckInTime;
        attendanceRecord.CheckOutTime = request.CheckOutTime ?? attendanceRecord.CheckOutTime;
        attendanceRecord.Notes = request.Notes ?? attendanceRecord.Notes;
        _context.AttendanceRecords.Update(attendanceRecord);
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<List<AttendanceResponse>> GetAttendanceRecordsByStaffIdAsync(
        int staffId,
        DateTime date
    )
    {
        var dateOnly = DateOnly.FromDateTime(date);
        var attendanceRecords = await _context
            .AttendanceRecords.Where(ar => ar.StaffId == staffId && ar.Date == dateOnly)
            .ToListAsync();

        return _mapper.Map<List<AttendanceResponse>>(attendanceRecords);
    }

    public async Task<bool> DeleteAttendanceRecordAsync(int attendanceRecordId)
    {
        var attendanceRecord = await _context.AttendanceRecords.FindAsync(attendanceRecordId);
        if (attendanceRecord == null)
            return false;

        _context.AttendanceRecords.Remove(attendanceRecord);
        return await _context.SaveChangesAsync() > 0;
    }
}
