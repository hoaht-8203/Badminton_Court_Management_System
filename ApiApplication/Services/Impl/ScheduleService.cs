using ApiApplication.Data;
using ApiApplication.Dtos;
using ApiApplication.Entities.Shared;
using ApiApplication.Exceptions;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Services.Impl
{
    public class ScheduleService(ApplicationDbContext context, IMapper mapper) : IScheduleService
    {
        private readonly ApplicationDbContext _context = context;
        private readonly IMapper _mapper = mapper;

        public async Task<bool> AssignShiftToStaffAsync(ScheduleRequest request)
        {
            // Check if there's a cancelled shift for this assignment
            var assignDate = DateOnly.FromDateTime(request.StartDate);
            var cancelledShift = await _context.CancelledShifts.FirstOrDefaultAsync(cs =>
                cs.StaffId == request.StaffId
                && cs.ShiftId == request.ShiftId
                && cs.Date == assignDate
            );

            // If there's a cancelled shift, remove it
            if (cancelledShift != null)
            {
                _context.CancelledShifts.Remove(cancelledShift);
                return await _context.SaveChangesAsync() > 0;
            }

            var entity = _mapper.Map<Entities.Schedule>(request);
            _context.Schedules.Add(entity);
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<List<ScheduleByShiftResponse>> GetScheduleOfWeekByShiftAsync(
            WeeklyScheduleRequest request
        )
        {
            var startDate = DateOnly.FromDateTime(request.StartDate);
            var endDate = DateOnly.FromDateTime(request.EndDate);

            // Filter by StaffIds if provided
            var hasStaffFilter = request.StaffIds != null && request.StaffIds.Count > 0;
            var staffIds = request.StaffIds ?? new List<int>();

            var notFixedSchedulesQuery = _context.Schedules.Where(s =>
                !s.IsFixedShift && s.StartDate >= startDate && s.StartDate <= endDate
            );
            if (hasStaffFilter)
            {
                notFixedSchedulesQuery = notFixedSchedulesQuery.Where(s =>
                    s.StaffId.HasValue && staffIds.Contains(s.StaffId.Value)
                );
            }

            var notFixedSchedules = await notFixedSchedulesQuery
                .Include(s => s.Shift)
                .Include(s => s.Staff)
                .ToListAsync();

            var fixedSchedulesQuery = _context.Schedules.Where(s =>
                s.IsFixedShift
                && s.StartDate <= endDate
                && (s.EndDate >= startDate || s.EndDate == null)
            );
            if (hasStaffFilter)
            {
                fixedSchedulesQuery = fixedSchedulesQuery.Where(s =>
                    s.StaffId.HasValue && staffIds.Contains(s.StaffId.Value)
                );
            }

            var fixedSchedules = await fixedSchedulesQuery
                .Include(s => s.Shift)
                .Include(s => s.Staff)
                .ToListAsync();

            var allSchedules = notFixedSchedules.Concat(fixedSchedules).ToList();
            var standardizedSchedules = Helpers.ScheduleHelper.StandardizeSchedule(
                allSchedules,
                startDate,
                endDate,
                _mapper
            );

            //remove the cancelled shifts schedules from the standardized schedules
            var cancelledShifts = await _context
                .CancelledShifts.Where(cs => cs.Date >= startDate && cs.Date <= endDate)
                .ToListAsync();

            // Filter out cancelled shifts from standardized schedules
            standardizedSchedules = standardizedSchedules
                .Where(s =>
                    !cancelledShifts.Any(cs =>
                        cs.StaffId == s.Staff.Id
                        && cs.ShiftId == s.Shift.Id
                        && cs.Date == DateOnly.FromDateTime(s.Date)
                    )
                )
                .ToList();

            var attendanceRecordsQuery = _context.AttendanceRecords.Where(ar =>
                ar.Date >= startDate && ar.Date <= endDate
            );
            if (hasStaffFilter)
            {
                attendanceRecordsQuery = attendanceRecordsQuery.Where(ar =>
                    staffIds.Contains(ar.StaffId)
                );
            }

            var attendanceRecords = await attendanceRecordsQuery.ToListAsync();

            // Group by Shift
            var grouped = standardizedSchedules
                .GroupBy(s => s.Shift.Id)
                .Select(g => new ScheduleByShiftResponse
                {
                    Shift = g.First().Shift,
                    Days = g.GroupBy(x => x.Date)
                        .Select(dayGroup => new ShiftAssignmentDto
                        {
                            Date = dayGroup.Key,
                            DayOfWeek = dayGroup.First().DayOfWeek,
                            Staffs = dayGroup
                                .Select(x =>
                                {
                                    var attendances = attendanceRecords
                                        .Where(ar =>
                                            ar.StaffId == x.Staff.Id
                                            && ar.Date == DateOnly.FromDateTime(x.Date)
                                        )
                                        .ToList();

                                    // Determine if shift has started by comparing shift start time with current time
                                    var shiftStartDateTime = DateOnly
                                        .FromDateTime(x.Date)
                                        .ToDateTime(x.Shift.StartTime);
                                    var now = DateTime.Now;

                                    string statusByDate;
                                    if (shiftStartDateTime > now)
                                    {
                                        // Shift hasn't started yet
                                        statusByDate = AttendanceStatus.NotYet;
                                    }
                                    else
                                    {
                                        // Shift has started or passed, check attendance
                                        statusByDate =
                                            Helpers.AttendanceHelper.DetermineStatusOfShift(
                                                attendances,
                                                x.Shift
                                            );
                                    }

                                    return new StaffAttendanceResponse
                                    {
                                        Id = x.Staff.Id,
                                        FullName = x.Staff.FullName,
                                        AvatarUrl = x.Staff.AvatarUrl,
                                        AttendanceStatus = statusByDate,
                                    };
                                })
                                .ToList(),
                        })
                        .ToList(),
                })
                .ToList();

            return grouped;
        }

        public async Task<List<ScheduleByStaffResponse>> GetScheduleOfWeekByStaffAsync(
            WeeklyScheduleRequest request
        )
        {
            var startDate = DateOnly.FromDateTime(request.StartDate);
            var endDate = DateOnly.FromDateTime(request.EndDate);

            // Filter by StaffIds if provided
            var hasStaffFilter = request.StaffIds != null && request.StaffIds.Count > 0;
            var staffIds = request.StaffIds ?? new List<int>();

            var notFixedSchedulesQuery = _context.Schedules.Where(s =>
                !s.IsFixedShift && s.StartDate >= startDate && s.StartDate <= endDate
            );
            if (hasStaffFilter)
            {
                notFixedSchedulesQuery = notFixedSchedulesQuery.Where(s =>
                    s.StaffId.HasValue && staffIds.Contains(s.StaffId.Value)
                );
            }

            var notFixedSchedules = await notFixedSchedulesQuery
                .Include(s => s.Shift)
                .Include(s => s.Staff)
                .ToListAsync();

            var fixedSchedulesQuery = _context.Schedules.Where(s =>
                s.IsFixedShift
                && s.StartDate <= endDate
                && (s.EndDate >= startDate || s.EndDate == null)
            );
            if (hasStaffFilter)
            {
                fixedSchedulesQuery = fixedSchedulesQuery.Where(s =>
                    s.StaffId.HasValue && staffIds.Contains(s.StaffId.Value)
                );
            }

            var fixedSchedules = await fixedSchedulesQuery
                .Include(s => s.Shift)
                .Include(s => s.Staff)
                .ToListAsync();

            var allSchedules = notFixedSchedules.Concat(fixedSchedules).ToList();
            var standardizedSchedules = Helpers.ScheduleHelper.StandardizeSchedule(
                allSchedules,
                startDate,
                endDate,
                _mapper
            );
            //remove the cancelled shifts schedules from the standardized schedules
            var cancelledShifts = await _context
                .CancelledShifts.Where(cs => cs.Date >= startDate && cs.Date <= endDate)
                .ToListAsync();

            // Filter out cancelled shifts from standardized schedules
            standardizedSchedules = standardizedSchedules
                .Where(s =>
                    !cancelledShifts.Any(cs =>
                        cs.StaffId == s.Staff.Id
                        && cs.ShiftId == s.Shift.Id
                        && cs.Date == DateOnly.FromDateTime(s.Date)
                    )
                )
                .ToList();

            // Group by Staff
            var grouped = standardizedSchedules
                .GroupBy(s => s.Staff.Id)
                .Select(g => new ScheduleByStaffResponse
                {
                    Staff = g.First().Staff,
                    Days = g.GroupBy(x => x.Date)
                        .Select(dayGroup => new StaffShiftDto
                        {
                            Date = dayGroup.Key,
                            DayOfWeek = dayGroup.First().DayOfWeek,
                            Shifts = dayGroup.Select(x => x.Shift).ToList(),
                        })
                        .ToList(),
                })
                .ToList();

            return grouped;
        }

        public async Task<List<ScheduleResponse>> GetScheduleOfWeekByStaffIdAsync(
            ScheduleRequest request,
            int staffId
        )
        {
            var startDate = DateOnly.FromDateTime(request.StartDate);
            var endDate = request.EndDate.HasValue
                ? DateOnly.FromDateTime(request.EndDate.Value)
                : default;
            var result = await _context
                .Schedules.Where(s => s.StaffId == staffId)
                .Include(s => s.Shift)
                .Include(s => s.Staff)
                .ToListAsync();
            return Helpers.ScheduleHelper.StandardizeSchedule(result, startDate, endDate, _mapper);
        }

        public async Task<bool> RemoveStaffFromShiftAsync(ScheduleRequest request)
        {
            var requestDate = DateOnly.FromDateTime(request.StartDate);

            // Check attendance first - if there's attendance that overlaps with shift time, throw error
            var attendances = await _context
                .AttendanceRecords.Where(ar =>
                    ar.StaffId == request.StaffId && ar.Date == requestDate
                )
                .ToListAsync();

            if (attendances.Any())
            {
                // Get shift to check time overlap
                var shift = await _context.Shifts.FindAsync(request.ShiftId);
                if (shift != null)
                {
                    var shiftResponse = _mapper.Map<ShiftResponse>(shift);
                    var status = Helpers.AttendanceHelper.DetermineStatusOfShift(
                        attendances,
                        shiftResponse
                    );

                    // Only allow removal if status is NotYet or Absent
                    // NotYet: shift hasn't happened yet, safe to remove
                    // Absent: employee didn't attend, safe to remove
                    if (status != AttendanceStatus.NotYet && status != AttendanceStatus.Absent)
                    {
                        throw new ApiException(
                            "Không thể xóa lịch làm việc vì đã có điểm danh",
                            System.Net.HttpStatusCode.BadRequest
                        );
                    }
                }
            }

            // Find schedules that apply to this date
            var schedules = await _context
                .Schedules.Where(s =>
                    s.StaffId == request.StaffId
                    && s.ShiftId == request.ShiftId
                    && (
                        // Non-fixed shift with exact start date
                        (!s.IsFixedShift && s.StartDate == requestDate)
                        ||
                        // Fixed shift that covers this date
                        (
                            s.IsFixedShift
                            && s.StartDate <= requestDate
                            && (s.EndDate == null || s.EndDate >= requestDate)
                        )
                    )
                )
                .ToListAsync();

            // If there's a fixed shift covering this date
            var fixedSchedule = schedules.FirstOrDefault(s => s.IsFixedShift);
            if (fixedSchedule != null)
            {
                // For fixed shifts, don't delete the schedule record
                // Instead, add to CancelledShifts to exclude this specific date
                _context.CancelledShifts.Add(
                    new Entities.CancelledShift
                    {
                        StaffId = request.StaffId,
                        ShiftId = request.ShiftId,
                        Date = requestDate,
                    }
                );
                var cancelledShiftSaved = await _context.SaveChangesAsync() > 0;
                if (!cancelledShiftSaved)
                {
                    throw new ApiException(
                        "Không thể hủy lịch làm việc",
                        System.Net.HttpStatusCode.InternalServerError
                    );
                }
                return true;
            }

            // If there's a non-fixed shift with exact start date
            var nonFixedSchedule = schedules.FirstOrDefault(s => !s.IsFixedShift);
            if (nonFixedSchedule != null)
            {
                // For non-fixed shifts, delete the schedule record directly
                _context.Schedules.Remove(nonFixedSchedule);
                var scheduleSaved = await _context.SaveChangesAsync() > 0;
                if (!scheduleSaved)
                {
                    throw new ApiException(
                        "Không thể xóa lịch làm việc",
                        System.Net.HttpStatusCode.InternalServerError
                    );
                }
                return true;
            }

            return true;
        }
    }
}
