using System;
using ApiApplication.Constants;
using ApiApplication.Enums;

namespace ApiApplication.Helpers;

public class RoleHelper
{
    public static string GetIdentityRoleName(Role role)
    {
        return role switch
        {
            Role.Admin => IdentityRoleConstants.Admin,
            Role.Customer => IdentityRoleConstants.Customer,
            Role.Staff => IdentityRoleConstants.Staff,
            Role.WareHouse => IdentityRoleConstants.WarehouseStaff,
            Role.Receptionist => IdentityRoleConstants.Receptionist,
            _ => throw new ArgumentOutOfRangeException(
                nameof(role),
                role,
                "Provided role is not supported."
            ),
        };
    }
}
