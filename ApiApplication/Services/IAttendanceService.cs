using System;
using ApiApplication.Dtos.Attendance;

namespace ApiApplication.Services;

public interface IAttendanceService
{
    // Task<bool> AddOrUpdateAttendanceRecordAsync(AttendanceRequest request);
    // Task<AttendanceResponse?> GetAttendanceRecordByIdAsync(int attendanceRecordId);

    Task<bool> AddAttendanceRecordAsync(AttendanceRequest request);
    Task<bool> UpdateAttendanceRecordAsync(AttendanceRequest request);
    Task<bool> DeleteAttendanceRecordAsync(int attendanceRecordId);
    Task<List<AttendanceResponse>> GetAttendanceRecordsByStaffIdAsync(int staffId, DateTime date);
}
