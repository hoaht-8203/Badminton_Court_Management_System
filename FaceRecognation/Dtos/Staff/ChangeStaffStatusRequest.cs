namespace FaceRecognation.Dtos
{
    public class ChangeStaffStatusRequest
    {
        public int StaffId { get; set; }
        public bool IsActive { get; set; }
    }
}
