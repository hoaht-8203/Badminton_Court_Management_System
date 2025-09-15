using System;
using System.Net;

namespace ApiApplication.Exceptions;

public class ApiException(
    string message,
    HttpStatusCode statusCode = HttpStatusCode.InternalServerError,
    Dictionary<string, string>? errors = null
) : Exception(message)
{
    public HttpStatusCode StatusCode { get; set; } = statusCode;
    public Dictionary<string, string>? Errors { get; set; } = errors;
}
