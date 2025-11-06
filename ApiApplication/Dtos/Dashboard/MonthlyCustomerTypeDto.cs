using System;

namespace ApiApplication.Dtos.Dashboard;

public class MonthlyCustomerTypeDto
{
    public DateTime Period { get; set; }
    public int FixedCustomers { get; set; }
    public int WalkinCustomers { get; set; }
}
