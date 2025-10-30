using System.Net;
using ApiApplication.Data;
using ApiApplication.Exceptions;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace ApiApplication.Services.Impl
{
    public class DepartmentService(ApplicationDbContext context, IMapper mapper)
        : IDepartmentService
    {
        private readonly ApplicationDbContext _context = context;
        private readonly IMapper _mapper = mapper;

        public async Task CreateDepartmentAsync(Dtos.DepartmentRequest request)
        {
            var dept = _mapper.Map<Entities.Department>(request);
            _context.Departments.Add(dept);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateDepartmentAsync(Dtos.DepartmentRequest request, int id)
        {
            var dept = await _context.Departments.FindAsync(id);
            if (dept == null)
            {
                throw new ApiException(
                    $"Phòng ban với Id {id} không tồn tại",
                    HttpStatusCode.NotFound
                );
            }
            _mapper.Map(request, dept);
            _context.Departments.Update(dept);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteDepartmentAsync(int departmentId)
        {
            var dept = await _context.Departments.FindAsync(departmentId);
            if (dept == null)
            {
                throw new ApiException(
                    $"Phòng ban với Id {departmentId} không tồn tại",
                    HttpStatusCode.NotFound
                );
            }
            _context.Departments.Remove(dept);
            await _context.SaveChangesAsync();
        }

        public async Task<Dtos.DepartmentResponse?> GetDepartmentByIdAsync(int departmentId)
        {
            var dept = await _context.Departments.FindAsync(departmentId);
            if (dept == null)
                return null;
            return _mapper.Map<Dtos.DepartmentResponse>(dept);
        }

        public async Task<List<Dtos.DepartmentResponse>> GetAllDepartmentsAsync(
            Dtos.ListDepartmentRequest request
        )
        {
            var query = _context.Departments.AsQueryable();
            if (request.IsActive.HasValue)
            {
                query = query.Where(d => d.IsActive == request.IsActive.Value);
            }
            if (!string.IsNullOrWhiteSpace(request.Keyword))
            {
                query = query.Where(d => d.Name != null && d.Name.Contains(request.Keyword));
            }
            var list = await query.OrderBy(d => d.Id).ToListAsync();
            return list.Select(d => _mapper.Map<Dtos.DepartmentResponse>(d)).ToList();
        }
    }
}
