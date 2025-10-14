using System.Net;

namespace ApiApplication.Exceptions;

public class UnsupportedMediaTypeException(string message = "Unsupported media type.")
    : ApiException(message, HttpStatusCode.UnsupportedMediaType) { }
