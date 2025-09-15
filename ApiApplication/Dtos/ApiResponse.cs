using System;

namespace ApiApplication.Dtos;

public class ApiResponse<T>(
    bool success = true,
    string message = "",
    T? data = default,
    Dictionary<string, string>? errors = null
)
{
    public bool Success { get; set; } = success;
    public string Message { get; set; } = message;
    public T? Data { get; set; } = data;
    public Dictionary<string, string>? Errors { get; set; } = errors;

    public static ApiResponse<T> SuccessResponse(T data, string message = "Get data successfully")
    {
        return new ApiResponse<T>(true, message, data);
    }

    public static ApiResponse<T> ErrorResponse(
        string message,
        Dictionary<string, string>? errors = null
    )
    {
        return new ApiResponse<T>(false, message, default, errors);
    }
}
