using System;
using ApiApplication.Entities.Shared;

namespace ApiApplication.Entities;

public class Schedule : BaseEntity
{
    public int Id { get; set; }
    public int? StaffId { get; set; }
    public Staff? Staff { get; set; }
    public int ShiftId { get; set; }
    public Shift? Shift { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public string[] ByDay { get; set; } = Array.Empty<string>();
    public bool IsFixedShift { get; set; } = false;
}
