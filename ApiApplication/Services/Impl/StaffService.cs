using ApiApplication.Data;
using ApiApplication.Sessions;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Services.Impl
{
    public class StaffService(
        ApplicationDbContext context,
        IMapper mapper,
        ICurrentUser currentUser
    ) : IStaffService
    {
        private readonly ApplicationDbContext _context = context;
        private readonly IMapper _mapper = mapper;
        private readonly ICurrentUser _currentUser = currentUser;

        public async Task UpdateStaffAsync(Dtos.StaffRequest request, int id)
        {
            var staff = await _context.Staffs.FindAsync(id);
            if (staff == null)
                throw new Exception($"Nhân viên với Id {id} không tồn tại");

            // Check uniqueness for IdentificationNumber
            if (!string.IsNullOrEmpty(request.IdentificationNumber))
            {
                var exists = await _context.Staffs.AnyAsync(s => s.IdentificationNumber == request.IdentificationNumber && s.Id != id);
                if (exists)
                    throw new Exception($"CCCD '{request.IdentificationNumber}' đã được sử dụng bởi nhân viên khác.");
            }
            // Check uniqueness for PhoneNumber
            if (!string.IsNullOrEmpty(request.PhoneNumber))
            {
                var exists = await _context.Staffs.AnyAsync(s => s.PhoneNumber == request.PhoneNumber && s.Id != id);
                if (exists)
                    throw new Exception($"Số điện thoại '{request.PhoneNumber}' đã được sử dụng bởi nhân viên khác.");
            }

            _mapper.Map(request, staff);
            _context.Staffs.Update(staff);
            await _context.SaveChangesAsync();
        }

            public async Task CreateStaffAsync(Dtos.StaffRequest request)
            {
                // Check uniqueness for IdentificationNumber
                if (!string.IsNullOrEmpty(request.IdentificationNumber))
                {
                    var exists = await _context.Staffs.AnyAsync(s => s.IdentificationNumber == request.IdentificationNumber);
                    if (exists)
                        throw new Exception($"CCCD '{request.IdentificationNumber}' đã được sử dụng bởi nhân viên khác.");
                }
                // Check uniqueness for PhoneNumber
                if (!string.IsNullOrEmpty(request.PhoneNumber))
                {
                    var exists = await _context.Staffs.AnyAsync(s => s.PhoneNumber == request.PhoneNumber);
                    if (exists)
                        throw new Exception($"Số điện thoại '{request.PhoneNumber}' đã được sử dụng bởi nhân viên khác.");
                }

                var staff = _mapper.Map<Entities.Staff>(request);
                _context.Staffs.Add(staff);
                await _context.SaveChangesAsync();
            }

            public async Task DeleteStaffAsync(int staffId)
            {
                var staff = await _context.Staffs.FindAsync(staffId);
                if (staff == null)
                    throw new Exception($"Nhân viên với Id {staffId} không tồn tại");
                _context.Staffs.Remove(staff);
                await _context.SaveChangesAsync();
            }

            public async Task<Dtos.StaffResponse?> GetStaffByIdAsync(int staffId)
            {
                var staff = await _context.Staffs
                    .Include(s => s.User)
                    .FirstOrDefaultAsync(s => s.Id == staffId);
                if (staff == null) return null;
                return _mapper.Map<Dtos.StaffResponse>(staff);
            }

            public async Task<List<Dtos.StaffResponse>> GetAllStaffAsync(Dtos.ListStaffRequest request)
            {
                var query = _context.Staffs.Include(s => s.User).AsQueryable();

                if (request.Status.HasValue)
                {
                    // 1: active, 0: inactive
                    if (request.Status.Value == 1)
                        query = query.Where(s => s.IsActive);
                    else if (request.Status.Value == 0)
                        query = query.Where(s => !s.IsActive);
                }
                if (request.DepartmentIds != null && request.DepartmentIds.Any())
                {
                    query = query.Where(s => s.DepartmentId.HasValue && request.DepartmentIds.Contains(s.DepartmentId.Value));
                }
                if (request.BranchIds != null && request.BranchIds.Any())
                {
                    query = query.Where(s => s.BranchId.HasValue && request.BranchIds.Contains(s.BranchId.Value));
                }
                if (!string.IsNullOrWhiteSpace(request.Keyword))
                {
                    query = query.Where(s => (s.FullName != null && s.FullName.Contains(request.Keyword)) ||
                                             (s.PhoneNumber != null && s.PhoneNumber.Contains(request.Keyword)) ||
                                             (s.IdentificationNumber != null && s.IdentificationNumber.Contains(request.Keyword)));
                }

                var staffs = await query.ToListAsync();
                return staffs.Select(s => _mapper.Map<Dtos.StaffResponse>(s)).ToList();
            }
    }
}