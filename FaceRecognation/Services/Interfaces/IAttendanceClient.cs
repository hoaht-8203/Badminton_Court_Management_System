using System.Threading.Tasks;
using FaceRecognation.Dtos;

namespace FaceRecognation.Services.Interfaces
{
    public interface IAttendanceClient
    {
        Task<ApiResponse<bool>> CheckInAsync(int staffId);
        Task<ApiResponse<bool>> CheckOutAsync(int staffId);
    }
}
