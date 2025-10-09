using System;
using ApiApplication.Dtos.Attendance;

namespace ApiApplication.Services;

public interface IAttendanceService
{
    Task<bool> AddOrUpdateAttendanceRecordAsync(AttendanceRequest request);
    Task<AttendanceResponse?> GetAttendanceRecordByIdAsync(int attendanceRecordId);
}
