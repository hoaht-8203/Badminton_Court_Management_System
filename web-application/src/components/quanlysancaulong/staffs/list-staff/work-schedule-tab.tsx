import { scheduleService } from "@/services/schechuleService";
import { shiftService } from "@/services/shiftService";
import type { ScheduleResponse } from "@/types-openapi/api/models/ScheduleResponse";
import type { ShiftResponse } from "@/types-openapi/api/models/ShiftResponse";
import { Button, Card, Spin } from "antd";
import dayjs from "dayjs";
import React from "react";

const daysOfWeek = [
  { label: "Thứ hai", value: 1 },
  { label: "Thứ ba", value: 2 },
  { label: "Thứ tư", value: 3 },
  { label: "Thứ năm", value: 4 },
  { label: "Thứ sáu", value: 5 },
  { label: "Thứ bảy", value: 6 },
  { label: "Chủ nhật", value: 0 },
];

const WorkScheduleTab = ({ staff }: { staff: any }) => {
  const [loading, setLoading] = React.useState(true);
  const [schedules, setSchedules] = React.useState<ScheduleResponse[]>([]);
  const [shifts, setShifts] = React.useState<ShiftResponse[]>([]);
  const [weekStart, setWeekStart] = React.useState(() => {
    const today = dayjs();
    return today.day() === 0 ? today.subtract(6, "day") : today.day(1);
  });

  const startDate = weekStart.format("YYYY-MM-DD");
  const endDate = weekStart.add(6, "day").format("YYYY-MM-DD");

  React.useEffect(() => {
    if (!staff?.id) return;
    setLoading(true);
    Promise.all([scheduleService.getScheduleByStaffId(staff.id, { startDate, endDate }), shiftService.list()])
      .then(([scheduleRes, shiftRes]) => {
        setSchedules(Array.isArray(scheduleRes.data) ? scheduleRes.data : []);
        setShifts(Array.isArray(shiftRes.data) ? shiftRes.data : []);
      })
      .finally(() => setLoading(false));
  }, [staff?.id, startDate, endDate]);

  // Tạo danh sách ngày trong tuần
  const weekDays = daysOfWeek.map((d, idx) => {
    const day = weekStart.add(idx, "day");
    return { ...d, date: day.date(), fullDate: day.format("YYYY-MM-DD") };
  });

  // Chuẩn bị dữ liệu cho bảng: mỗi ngày là một cột, mỗi ca là một dòng
  // Nhưng ở đây, mỗi dòng là một ca, mỗi cột là một ngày
  // Sắp xếp lịch làm việc theo ngày và ca
  const scheduleMap: Record<string, Record<string, boolean>> = {};
  for (const shift of shifts) {
    const shiftKey = String(shift.id);
    scheduleMap[shiftKey] = {};
    for (const d of weekDays) {
      scheduleMap[shiftKey][d.fullDate] = false;
    }
  }
  for (const s of schedules) {
    if (s.shift?.id && s.date) {
      const shiftKey = String(s.shift.id);
      const dateStr = dayjs(s.date).format("YYYY-MM-DD");
      if (scheduleMap[shiftKey] && scheduleMap[shiftKey][dateStr] !== undefined) {
        scheduleMap[shiftKey][dateStr] = true;
      }
    }
  }

  return (
    <Card
      title={
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <Button type="default" onClick={() => setWeekStart(weekStart.subtract(1, "week"))}>
            {"<"}
          </Button>
          <span>{`Lịch làm việc tuần ${weekStart.week()} - Th.${weekStart.month() + 1} ${weekStart.year()} (${weekStart.format("DD/MM")}-${weekStart.add(6, "day").format("DD/MM")})`}</span>
          <Button type="default" onClick={() => setWeekStart(weekStart.add(1, "week"))}>
            {">"}
          </Button>
        </div>
      }
    >
      {loading ? (
        <Spin />
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
            <thead>
              <tr>
                <th style={{ width: 120, textAlign: "left", padding: 8, background: "#f5f5f5", borderRight: "1px solid #f0f0f0" }}>Ca</th>
                {weekDays.map((d) => (
                  <th
                    key={d.fullDate}
                    style={{ minWidth: 120, textAlign: "center", padding: 8, background: "#f5f5f5", borderRight: "1px solid #f0f0f0" }}
                  >
                    {d.label} <span style={{ color: "#1890ff" }}>{d.date}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shifts.map((shift) => {
                const shiftKey = String(shift.id);
                return (
                  <tr key={shiftKey}>
                    <td style={{ borderRight: "1px solid #f0f0f0", padding: 8, fontWeight: 600 }}>{shift.name}</td>
                    {weekDays.map((d) => (
                      <td key={d.fullDate} style={{ textAlign: "center", padding: 4, border: "1px solid #e0e0e0" }}>
                        {scheduleMap[shiftKey][d.fullDate] ? <span style={{ fontSize: 20, color: "#52c41a", fontWeight: 900 }}>&#10003;</span> : null}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

export default WorkScheduleTab;
