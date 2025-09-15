using System;

namespace ApiApplication.Options;

public class JwtOptions
{
    public const string JwtOptionsKey = "JwtOptions";

    public required string Secret { get; set; }
    public required string Issuer { get; set; }
    public required string Audience { get; set; }
    public int ExpirationTimeInMinutes { get; set; }
}
