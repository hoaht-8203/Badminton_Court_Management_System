using System;
using ApiApplication.Entities;

namespace ApiApplication.Processors;

public interface IAuthTokenProcessor
{
    (string jwtToken, DateTime expiresAtUtc) GenerateJwtToken(
        ApplicationUser user,
        IList<string> roles
    );
    string GenerateRefreshToken();
    void WriteAuthTokenAsHttpOnlyCookie(string cookieName, string token, DateTime expiration);
}
