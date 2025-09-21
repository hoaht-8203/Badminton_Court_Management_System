using System;

namespace ApiApplication.Dtos;

public class ListActivityRequest
{
    public string? UserName { get; set; }
    public string? Action { get; set; }
    public string? OrderType { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
}
