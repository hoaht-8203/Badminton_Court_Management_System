namespace ApiApplication.Constants
{
    public static class DoWMapping
    {
        public static readonly Dictionary<DayOfWeek, string> DayOfWeekToString = new()
        {
            { DayOfWeek.Monday, "T2" },
            { DayOfWeek.Tuesday, "T3" },
            { DayOfWeek.Wednesday, "T4" },
            { DayOfWeek.Thursday, "T5" },
            { DayOfWeek.Friday, "T6" },
            { DayOfWeek.Saturday, "T7" },
            { DayOfWeek.Sunday, "CN" },
        };

        public static readonly Dictionary<string, DayOfWeek> StringToDayOfWeek = new()
        {
            { "T2", DayOfWeek.Monday },
            { "T3", DayOfWeek.Tuesday },
            { "T4", DayOfWeek.Wednesday },
            { "T5", DayOfWeek.Thursday },
            { "T6", DayOfWeek.Friday },
            { "T7", DayOfWeek.Saturday },
            { "CN", DayOfWeek.Sunday },
        };
    }
    // Usage: DoWMapping.DayOfWeekToString[DayOfWeek.Monday] => "T2"
    // Usage: DoWMapping.StringToDayOfWeek["T2"] => DayOfWeek.Monday
}
