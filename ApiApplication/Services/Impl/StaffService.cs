using System.Net;
using System.Text.Json;
using ApiApplication.Data;
using ApiApplication.Exceptions;
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

        /// <summary>
        /// Validates if a string is valid JSON format
        /// </summary>
        private bool IsValidJson(string input)
        {
            if (string.IsNullOrWhiteSpace(input))
                return false;

            try
            {
                JsonDocument.Parse(input);
                return true;
            }
            catch (JsonException)
            {
                return false;
            }
        }

        public async Task UpdateStaffAsync(Dtos.StaffRequest request, int id)
        {
            var staff = await _context.Staffs.FindAsync(id);
            if (staff == null)
            {
                throw new ApiException(
                    $"Nhân viên với Id {id} không tồn tại",
                    HttpStatusCode.NotFound
                );
            }

            // Validate SalarySettings JSON
            if (!IsValidJson(request.SalarySettings))
            {
                throw new ApiException(
                    "Cài đặt lương phải là JSON hợp lệ",
                    HttpStatusCode.BadRequest
                );
            }

            // Validate format for IdentificationNumber
            if (!string.IsNullOrEmpty(request.IdentificationNumber))
            {
                if (request.IdentificationNumber.Length != 12 || !System.Text.RegularExpressions.Regex.IsMatch(request.IdentificationNumber, @"^\d{12}$"))
                {
                    throw new ApiException(
                        "Căn cước công dân phải có đúng 12 chữ số",
                        HttpStatusCode.BadRequest
                    );
                }

                // Check uniqueness for IdentificationNumber
                var exists = await _context.Staffs.AnyAsync(s =>
                    s.IdentificationNumber == request.IdentificationNumber && s.Id != id
                );
                if (exists)
                {
                    throw new ApiException(
                        $"CCCD '{request.IdentificationNumber}' đã được sử dụng bởi nhân viên khác.",
                        HttpStatusCode.BadRequest
                    );
                }
            }

            // Validate format for PhoneNumber
            if (!string.IsNullOrEmpty(request.PhoneNumber))
            {
                if (request.PhoneNumber.Length < 9 || request.PhoneNumber.Length > 11 || !System.Text.RegularExpressions.Regex.IsMatch(request.PhoneNumber, @"^\d{9,11}$"))
                {
                    throw new ApiException(
                        "Số điện thoại phải có từ 9 đến 11 chữ số",
                        HttpStatusCode.BadRequest
                    );
                }

                // Check uniqueness for PhoneNumber
                var exists = await _context.Staffs.AnyAsync(s =>
                    s.PhoneNumber == request.PhoneNumber && s.Id != id
                );
                if (exists)
                {
                    throw new ApiException(
                        $"Số điện thoại '{request.PhoneNumber}' đã được sử dụng bởi nhân viên khác.",
                        HttpStatusCode.BadRequest
                    );
                }
            }

            _mapper.Map(request, staff);
            _context.Staffs.Update(staff);
            await _context.SaveChangesAsync();
        }

        public async Task CreateStaffAsync(Dtos.StaffRequest request)
        {
            // Validate SalarySettings JSON
            if (!IsValidJson(request.SalarySettings))
            {
                throw new ApiException(
                    "Cài đặt lương phải là JSON hợp lệ",
                    HttpStatusCode.BadRequest
                );
            }

            // Validate format for IdentificationNumber
            if (!string.IsNullOrEmpty(request.IdentificationNumber))
            {
                if (request.IdentificationNumber.Length != 12 || !System.Text.RegularExpressions.Regex.IsMatch(request.IdentificationNumber, @"^\d{12}$"))
                {
                    throw new ApiException(
                        "Căn cước công dân phải có đúng 12 chữ số",
                        HttpStatusCode.BadRequest
                    );
                }

                // Check uniqueness for IdentificationNumber
                var exists = await _context.Staffs.AnyAsync(s =>
                    s.IdentificationNumber == request.IdentificationNumber
                );
                if (exists)
                {
                    throw new ApiException(
                        $"CCCD '{request.IdentificationNumber}' đã được sử dụng bởi nhân viên khác.",
                        HttpStatusCode.BadRequest
                    );
                }
            }

            // Validate format for PhoneNumber
            if (!string.IsNullOrEmpty(request.PhoneNumber))
            {
                if (request.PhoneNumber.Length < 9 || request.PhoneNumber.Length > 11 || !System.Text.RegularExpressions.Regex.IsMatch(request.PhoneNumber, @"^\d{9,11}$"))
                {
                    throw new ApiException(
                        "Số điện thoại phải có từ 9 đến 11 chữ số",
                        HttpStatusCode.BadRequest
                    );
                }

                // Check uniqueness for PhoneNumber
                var exists = await _context.Staffs.AnyAsync(s =>
                    s.PhoneNumber == request.PhoneNumber
                );
                if (exists)
                {
                    throw new ApiException(
                        $"Số điện thoại '{request.PhoneNumber}' đã được sử dụng bởi nhân viên khác.",
                        HttpStatusCode.BadRequest
                    );
                }
            }

            var staff = _mapper.Map<Entities.Staff>(request);
            _context.Staffs.Add(staff);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteStaffAsync(int staffId)
        {
            var staff = await _context.Staffs.FindAsync(staffId);
            if (staff == null)
            {
                throw new ApiException(
                    $"Nhân viên với Id {staffId} không tồn tại",
                    HttpStatusCode.NotFound
                );
            }
            _context.Staffs.Remove(staff);
            await _context.SaveChangesAsync();
        }

        public async Task<Dtos.StaffResponse?> GetStaffByIdAsync(int staffId)
        {
            var staff = await _context
                .Staffs.Include(s => s.User)
                .FirstOrDefaultAsync(s => s.Id == staffId);
            if (staff == null)
            {
                throw new ApiException(
                    $"Nhân viên với Id {staffId} không tồn tại",
                    HttpStatusCode.NotFound
                );
            }
            return _mapper.Map<Dtos.StaffResponse>(staff);
        }

        public async Task<List<Dtos.StaffResponse>> GetAllStaffAsync(Dtos.ListStaffRequest request)
        {
            var query = _context.Staffs.OrderBy(s => s.Id).Include(s => s.User).AsQueryable();

            if (request.Status.HasValue)
            {
                // 1: active, 0: inactive
                if (request.Status.Value == 1)
                    query = query.Where(s => s.IsActive);
                else if (request.Status.Value == 0)
                    query = query.Where(s => !s.IsActive);
            }
            // if (request.DepartmentIds != null && request.DepartmentIds.Any())
            // {
            //     query = query.Where(s =>
            //         s.DepartmentId.HasValue && request.DepartmentIds.Contains(s.DepartmentId.Value)
            //     );
            // }
            // if (request.BranchIds != null && request.BranchIds.Any())
            // {
            //     query = query.Where(s =>
            //         s.BranchId.HasValue && request.BranchIds.Contains(s.BranchId.Value)
            //     );
            // }
            if (!string.IsNullOrWhiteSpace(request.Keyword))
            {
                // Use case-insensitive search. For PostgreSQL/Npgsql this translates to ILIKE via EF.Functions.ILike
                var kw = $"%{request.Keyword}%";
                query = query.Where(s =>
                    (s.FullName != null && EF.Functions.ILike(s.FullName, kw))
                    || (s.PhoneNumber != null && EF.Functions.ILike(s.PhoneNumber, kw))
                    || (
                        s.IdentificationNumber != null
                        && EF.Functions.ILike(s.IdentificationNumber, kw)
                    )
                );
            }

            var staffs = await query.ToListAsync();
            return staffs.Select(s => _mapper.Map<Dtos.StaffResponse>(s)).ToList();
        }

        public async Task ChangeStaffStatusAsync(Dtos.ChangeStaffStatusRequest request)
        {
            var staff = await _context.Staffs.FindAsync(request.StaffId);
            if (staff == null)
            {
                throw new ApiException(
                    $"Nhân viên với Id {request.StaffId} không tồn tại",
                    System.Net.HttpStatusCode.NotFound
                );
            }
            staff.IsActive = request.IsActive;
            _context.Staffs.Update(staff);
            await _context.SaveChangesAsync();
        }
    }
}
