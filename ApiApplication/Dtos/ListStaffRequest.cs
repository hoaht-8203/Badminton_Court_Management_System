namespace ApiApplication.Dtos
{
    public class ListStaffRequest
    {
        public int? Status { get; set; }
        public List<int>? BranchIds { get; set; }
        public string? Keyword { get; set; }
    }
}
