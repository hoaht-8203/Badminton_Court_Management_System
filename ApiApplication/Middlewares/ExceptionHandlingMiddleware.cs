using System;
using System.Text.Json;
using ApiApplication.Dtos;
using ApiApplication.Exceptions;

namespace ApiApplication.Middlewares;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    private readonly JsonSerializerOptions _jsonOptions;

    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger
    )
    {
        _next = next;
        _logger = logger;
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DictionaryKeyPolicy = JsonNamingPolicy.CamelCase,
        };
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception error)
        {
            var response = context.Response;
            response.ContentType = "application/json";

            var errorResponse = new ApiResponse<object> { Success = false };

            switch (error)
            {
                case UnsupportedMediaTypeException unsupportedMediaTypeEx:
                    response.StatusCode = StatusCodes.Status415UnsupportedMediaType;
                    errorResponse.Message = unsupportedMediaTypeEx.Message;
                    break;
                case ApiException apiEx:
                    response.StatusCode = (int)apiEx.StatusCode;
                    errorResponse.Message = apiEx.Message;
                    errorResponse.Errors = apiEx.Errors;
                    break;
                default:
                    response.StatusCode = StatusCodes.Status500InternalServerError;
                    errorResponse.Message = "An internal server error occurred.";
                    break;
            }

            _logger.LogError(error, error.Message);

            var result = JsonSerializer.Serialize(errorResponse, _jsonOptions);
            await response.WriteAsync(result);
        }
    }
}
