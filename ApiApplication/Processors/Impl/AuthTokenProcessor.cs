using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using ApiApplication.Entities;
using ApiApplication.Options;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace ApiApplication.Processors.Impl;

public class AuthTokenProcessor(
    IOptions<JwtOptions> jwtOptions,
    IHttpContextAccessor httpContextAccessor
) : IAuthTokenProcessor
{
    private readonly IHttpContextAccessor _httpContextAccessor = httpContextAccessor;
    private readonly JwtOptions _jwtOptions = jwtOptions.Value;

    public (string jwtToken, DateTime expiresAtUtc) GenerateJwtToken(
        ApplicationUser user,
        IList<string> roles
    )
    {
        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtOptions.Secret));

        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email!),
            new Claim(ClaimTypes.NameIdentifier, user.ToString()),
        }.Concat(roles.Select(r => new Claim(ClaimTypes.Role, r)));

        var expires = DateTime.UtcNow.AddMinutes(_jwtOptions.ExpirationTimeInMinutes);

        var token = new JwtSecurityToken(
            issuer: _jwtOptions.Issuer,
            audience: _jwtOptions.Audience,
            claims: claims,
            expires: expires,
            signingCredentials: credentials
        );

        var jwtToken = new JwtSecurityTokenHandler().WriteToken(token);

        return (jwtToken, expires);
    }

    public string GenerateRefreshToken()
    {
        var randomNumber = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    public void WriteAuthTokenAsHttpOnlyCookie(string cookieName, string token, DateTime expiration)
    {
        _httpContextAccessor.HttpContext?.Response.Cookies.Append(
            cookieName,
            token,
            new CookieOptions
            {
                HttpOnly = true,
                Expires = expiration,
                IsEssential = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
            }
        );
    }
}
