using System.Collections.Generic;

namespace FaceRecognation.Dtos
{
    public class CurrentUserResponse
    {
        public string? UserId { get; set; }
        public string? UserName { get; set; }
        public string? FullName { get; set; }
        public string? Email { get; set; }
        public bool EmailConfirmed { get; set; }
        public string? AvatarUrl { get; set; }
        public List<string>? Roles { get; set; }
    }
}
