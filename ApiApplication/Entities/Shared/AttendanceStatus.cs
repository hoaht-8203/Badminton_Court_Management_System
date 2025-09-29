using System;

namespace ApiApplication.Entities.Shared;

public class AttendanceStatus
{
    public const string NotYet = "NotYet";
    public const string Attended = "Attended";
    public const string Late = "Late";
    public const string Absent = "Absent";
    public const string InComplete = "InComplete";

    public static readonly string[] ValidAttendanceStatus =
    [
        NotYet,
        Attended,
        Late,
        Absent,
        InComplete,
    ];
}
