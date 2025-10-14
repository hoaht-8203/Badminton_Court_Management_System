using ApiApplication.Data;
using ApiApplication.Dtos;
using ApiApplication.Entities.Shared;
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
            var entity = _mapper.Map<Entities.Schedule>(request);
            _context.Schedules.Add(entity);
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<List<ScheduleByShiftResponse>> GetScheduleOfWeekByShiftAsync(
            ScheduleRequest request
        )
        {
            var startDate = DateOnly.FromDateTime(request.StartDate);
            var endDate = request.EndDate.HasValue
                ? DateOnly.FromDateTime(request.EndDate.Value)
                : default;
            var notFixedSchedules = await _context
                .Schedules.Where(s =>
                    !s.IsFixedShift && s.StartDate >= startDate && s.StartDate <= endDate
                )
                .Include(s => s.Shift)
                .Include(s => s.Staff)
                .ToListAsync();
            var fixedSchedules = await _context
                .Schedules.Where(s =>
                    s.IsFixedShift
                    && s.StartDate <= endDate
                    && (s.EndDate >= startDate || s.EndDate == null)
                )
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

            var attendanceRecords = await _context.AttendanceRecords
                .Where(ar => ar.Date >= startDate && ar.Date <= endDate)
                .ToListAsync();

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
                            Staffs = dayGroup.Select(x =>
                            {
                                
                                var attendances = attendanceRecords.Where(ar =>
                                    ar.StaffId == x.Staff.Id &&
                                    ar.Date == DateOnly.FromDateTime(x.Date)
                                ).ToList();
                                var statusByDate = Helpers.AttendanceHelper.DetermineStatusOfShift(
                                    attendances,
                                    x.Shift
                                );
                                if(x.Date > DateTime.Now)
                                {
                                    statusByDate = AttendanceStatus.NotYet;
                                }
                                return new StaffAttendanceResponse
                                {
                                    Id = x.Staff.Id,
                                    FullName = x.Staff.FullName,
                                    AvatarUrl = x.Staff.AvatarUrl,
                                    AttendanceStatus = statusByDate,
                                };
                            }).ToList(),
                        })
                        .ToList(),
                })
                .ToList();

            return grouped;
        }

        public async Task<List<ScheduleByStaffResponse>> GetScheduleOfWeekByStaffAsync(
            ScheduleRequest request
        )
        {
            var startDate = DateOnly.FromDateTime(request.StartDate);
            var endDate = request.EndDate.HasValue
                ? DateOnly.FromDateTime(request.EndDate.Value)
                : default;
            var notFixedSchedules = await _context
                .Schedules.Where(s =>
                    !s.IsFixedShift && s.StartDate >= startDate && s.StartDate <= endDate
                )
                .Include(s => s.Shift)
                .Include(s => s.Staff)
                .ToListAsync();
            var fixedSchedules = await _context
                .Schedules.Where(s =>
                    s.StartDate <= endDate && (s.EndDate >= startDate || s.EndDate == null)
                )
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
            var schedule = await _context.Schedules.FirstOrDefaultAsync(s =>
                s.StaffId == request.StaffId
                && s.ShiftId == request.ShiftId
                && s.StartDate == DateOnly.FromDateTime(request.StartDate)
            );
            if (schedule != null)
            {
                _context.Schedules.Remove(schedule);
                return await _context.SaveChangesAsync() > 0;
            }
            _context.CancelledShifts.Add(
                new Entities.CancelledShift
                {
                    StaffId = request.StaffId,
                    ShiftId = request.ShiftId,
                    Date = DateOnly.FromDateTime(request.StartDate),
                }
            );
            return await _context.SaveChangesAsync() > 0;
        }
    }
}
