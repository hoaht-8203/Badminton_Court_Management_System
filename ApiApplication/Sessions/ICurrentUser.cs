using System;

namespace ApiApplication.Sessions;

public interface ICurrentUser
{
    string? Username { get; }
    Guid? UserId { get; }
}
