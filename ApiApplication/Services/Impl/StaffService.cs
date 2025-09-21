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
                throw new Exception($"Staff with Id {id} not found");

            // Check uniqueness for IdentificationNumber
            if (!string.IsNullOrEmpty(request.IdentificationNumber))
            {
                var exists = await _context.Staffs.AnyAsync(s => s.IdentificationNumber == request.IdentificationNumber && s.Id != id);
                if (exists)
                    throw new Exception($"IdentificationNumber '{request.IdentificationNumber}' is already used by another staff.");
            }
            // Check uniqueness for PhoneNumber
            if (!string.IsNullOrEmpty(request.PhoneNumber))
            {
                var exists = await _context.Staffs.AnyAsync(s => s.PhoneNumber == request.PhoneNumber && s.Id != id);
                if (exists)
                    throw new Exception($"PhoneNumber '{request.PhoneNumber}' is already used by another staff.");
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
                        throw new Exception($"IdentificationNumber '{request.IdentificationNumber}' is already used by another staff.");
                }
                // Check uniqueness for PhoneNumber
                if (!string.IsNullOrEmpty(request.PhoneNumber))
                {
                    var exists = await _context.Staffs.AnyAsync(s => s.PhoneNumber == request.PhoneNumber);
                    if (exists)
                        throw new Exception($"PhoneNumber '{request.PhoneNumber}' is already used by another staff.");
                }

                var staff = _mapper.Map<Entities.Staff>(request);
                _context.Staffs.Add(staff);
                await _context.SaveChangesAsync();
            }

            public async Task DeleteStaffAsync(int staffId)
            {
                var staff = await _context.Staffs.FindAsync(staffId);
                if (staff == null)
                    throw new Exception($"Staff with Id {staffId} not found");
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

            public async Task<List<Dtos.StaffResponse>> GetAllStaffAsync()
            {
                var staffs = await _context.Staffs.Include(s => s.User).ToListAsync();
                return staffs.Select(s => _mapper.Map<Dtos.StaffResponse>(s)).ToList();
            }
    }
}