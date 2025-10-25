using System.Collections.Generic;

namespace FaceRecognation.Dtos
{
    public class ListStaffRequestDto
    {
        public int? Status { get; set; }
        public List<int>? DepartmentIds { get; set; }
        public List<int>? BranchIds { get; set; }
        public string? Keyword { get; set; }
    }
}
