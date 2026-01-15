"use client";

import React, { useMemo, useState } from "react";
import { Empty, Tabs, Badge, Card, Typography, Spin, Button, Tag } from "antd";
import { UnorderedListOutlined, ClockCircleOutlined, TableOutlined } from "@ant-design/icons";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { useGetMySchedule } from "@/hooks/useSchedule";
import { ScheduleResponse } from "@/types-openapi/api";
import MyAttendanceDrawer from "./MyAttendanceDrawer";
import "./work-schedule.css";

dayjs.extend(weekOfYear);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const { Text } = Typography;

interface WorkScheduleTabProps {
  loading?: boolean;
}

const daysOfWeek = [
  { label: "Thứ 2", value: 1 },
  { label: "Thứ 3", value: 2 },
  { label: "Thứ 4", value: 3 },
  { label: "Thứ 5", value: 4 },
  { label: "Thứ 6", value: 5 },
  { label: "Thứ 7", value: 6 },
  { label: "Chủ nhật", value: 0 },
];

const statusMap = {
  NotYet: { color: "#faad14", text: "Chưa diễn ra" },
  Attended: { color: "#1890ff", text: "Đã chấm công" },
  Late: { color: "#9254de", text: "Đi muộn / Về sớm" },
  Missing: { color: "#bfbfbf", text: "Chấm công thiếu" },
  Absent: { color: "#ff4d4f", text: "Nghỉ làm" },
} as const;

const WorkScheduleTableView: React.FC<{ schedules: ScheduleResponse[] }> = ({ schedules }) => {
  const [weekStart, setWeekStart] = useState(() => {
    const today = dayjs();
    return today.day() === 0 ? today.subtract(6, "day") : today.day(1);
  });
  const [attendanceDrawerOpen, setAttendanceDrawerOpen] = useState(false);
  const [attendanceDrawerData, setAttendanceDrawerData] = useState<any>(null);

  // Group schedules by shift and day
  const scheduleByShift: Record<string, Record<number, ScheduleResponse[]>> = useMemo(() => {
    const result: Record<string, Record<number, ScheduleResponse[]>> = {};

    const weekStartDate = weekStart.toDate();
    const weekEndDate = weekStart.add(6, "day").toDate();

    // Filter schedules for current week
    const weekSchedules = schedules.filter((s) => {
      if (!s.date) return false;
      const scheduleDate = dayjs(s.date);
      return scheduleDate.isSameOrAfter(weekStart, "day") && scheduleDate.isSameOrBefore(weekStart.add(6, "day"), "day");
    });

    weekSchedules.forEach((schedule) => {
      if (!schedule.shift?.id || !schedule.date) return;

      const shiftId = String(schedule.shift.id);
      const dayOfWeek = dayjs(schedule.date).day();

      if (!result[shiftId]) {
        result[shiftId] = {};
      }
      if (!result[shiftId][dayOfWeek]) {
        result[shiftId][dayOfWeek] = [];
      }
      result[shiftId][dayOfWeek].push(schedule);
    });

    return result;
  }, [schedules, weekStart]);

  // Get unique shifts
  const shifts = useMemo(() => {
    const shiftMap = new Map();
    schedules.forEach((s) => {
      if (s.shift?.id && !shiftMap.has(s.shift.id)) {
        shiftMap.set(s.shift.id, s.shift);
      }
    });
    return Array.from(shiftMap.values());
  }, [schedules]);

  const handleOpenAttendanceDrawer = (schedule: ScheduleResponse, date: string) => {
    setAttendanceDrawerData({
      shift: {
        id: schedule.shift?.id,
        name: schedule.shift?.name,
        time:
          schedule.shift?.startTime && schedule.shift?.endTime
            ? `${schedule.shift.startTime.substring(0, 5)} - ${schedule.shift.endTime.substring(0, 5)}`
            : "",
        startTime: schedule.shift?.startTime,
        endTime: schedule.shift?.endTime,
      },
      date,
      status: (schedule as any).attendanceStatus ?? "NotYet",
    });
    setAttendanceDrawerOpen(true);
  };

  const monday = weekStart;
  const today = dayjs().format("YYYY-MM-DD");
  const weekDays = daysOfWeek.map((d, idx) => {
    const day = monday.add(idx, "day");
    return { ...d, date: day.date(), fullDate: day.format("YYYY-MM-DD") };
  });

  return (
    <div>
      {/* Week navigation */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Button type="default" onClick={() => setWeekStart(weekStart.subtract(1, "week"))}>
            {"<"}
          </Button>
          <span style={{ fontWeight: 500, fontSize: 16 }}>
            Tuần {weekStart.week()} - Tháng {weekStart.month() + 1}, {weekStart.year()}
          </span>
          <Button type="default" onClick={() => setWeekStart(weekStart.add(1, "week"))}>
            {">"}
          </Button>
        </div>
      </div>

      {/* Schedule table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
          <thead>
            <tr>
              <th
                style={{
                  width: 140,
                  textAlign: "left",
                  padding: 8,
                  background: "#fafafa",
                  borderRight: "1px solid #f0f0f0",
                }}
              >
                Ca làm việc
              </th>
              {weekDays.map((d) => {
                const isToday = d.fullDate === today;
                return (
                  <th
                    key={d.value}
                    style={{
                      minWidth: 120,
                      textAlign: "center",
                      padding: 8,
                      background: isToday ? "#bae7ff" : "#fafafa",
                      borderRight: "1px solid #f0f0f0",
                      borderBottom: "1px solid #f0f0f0",
                    }}
                  >
                    {d.label}{" "}
                    <span
                      style={{
                        color: isToday ? "#1890ff" : "#bfbfbf",
                        fontSize: 12,
                        marginLeft: 2,
                        fontWeight: isToday ? 700 : 400,
                      }}
                    >
                      {d.date}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {shifts.map((shift) => (
              <tr key={shift.id}>
                <td style={{ borderRight: "1px solid #f0f0f0", padding: 8, fontWeight: 600 }}>
                  <div>{shift.name}</div>
                  <div style={{ fontWeight: 400, fontSize: 13, color: "#888" }}>
                    {shift.startTime?.substring(0, 5)} - {shift.endTime?.substring(0, 5)}
                  </div>
                </td>
                {weekDays.map((d) => {
                  const cellData = scheduleByShift?.[String(shift.id)]?.[d.value] || [];
                  const isToday = d.fullDate === today;
                  return (
                    <td
                      key={d.value}
                      style={{
                        minHeight: 60,
                        padding: 4,
                        verticalAlign: "top",
                        position: "relative",
                        border: "1px solid #e0e0e0",
                        boxSizing: "border-box",
                        background: isToday ? "#f0f9ff" : "#fff",
                      }}
                    >
                      {cellData.map((schedule, idx) => {
                        // Determine status
                        const statusKey = (schedule as any)?.attendanceStatus || "NotYet";
                        const statusInfo = statusMap[statusKey as keyof typeof statusMap] || statusMap.NotYet;

                        return (
                          <div
                            key={idx}
                            style={{
                              background: statusInfo.color + "22",
                              borderRadius: 6,
                              marginBottom: 6,
                              padding: 6,
                              fontSize: 14,
                              border: `1px solid ${statusInfo.color}`,
                              cursor: "pointer",
                            }}
                            onClick={() => handleOpenAttendanceDrawer(schedule, d.fullDate)}
                          >
                            <div style={{ fontWeight: 500, fontSize: 12, color: statusInfo.color }}>{statusInfo.text}</div>
                            {schedule.isFixedShift && <div style={{ fontSize: 11, color: "#9254de", marginTop: 2 }}>Ca cố định</div>}
                          </div>
                        );
                      })}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 12, marginTop: 20, justifyContent: "center", flexWrap: "wrap" }}>
        {Object.entries(statusMap).map(([key, value]) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                background: value.color,
              }}
            />
            <span style={{ fontSize: 12, color: "#666" }}>{value.text}</span>
          </div>
        ))}
      </div>

      {/* Attendance Drawer */}
      <MyAttendanceDrawer
        open={attendanceDrawerOpen}
        onClose={() => setAttendanceDrawerOpen(false)}
        shift={attendanceDrawerData?.shift}
        date={attendanceDrawerData?.date}
        status={attendanceDrawerData?.status}
      />
    </div>
  );
};

const WorkScheduleListView: React.FC<{ schedules: ScheduleResponse[] }> = ({ schedules }) => {
  const [weekStart, setWeekStart] = useState(() => {
    const today = dayjs();
    return today.day() === 0 ? today.subtract(6, "day") : today.day(1);
  });
  const [attendanceDrawerOpen, setAttendanceDrawerOpen] = useState(false);
  const [attendanceDrawerData, setAttendanceDrawerData] = useState<any>(null);

  const handleOpenAttendanceDrawer = (schedule: ScheduleResponse, date: string) => {
    setAttendanceDrawerData({
      shift: {
        id: schedule.shift?.id,
        name: schedule.shift?.name,
        time:
          schedule.shift?.startTime && schedule.shift?.endTime
            ? `${schedule.shift.startTime.substring(0, 5)} - ${schedule.shift.endTime.substring(0, 5)}`
            : "",
        startTime: schedule.shift?.startTime,
        endTime: schedule.shift?.endTime,
      },
      date,
      status: (schedule as any).attendanceStatus ?? "NotYet",
    });
    setAttendanceDrawerOpen(true);
  };

  // Filter schedules for current week
  const weekSchedules = useMemo(() => {
    return schedules.filter((s) => {
      if (!s.date) return false;
      const scheduleDate = dayjs(s.date);
      return scheduleDate.isSameOrAfter(weekStart, "day") && scheduleDate.isSameOrBefore(weekStart.add(6, "day"), "day");
    });
  }, [schedules, weekStart]);

  const sortedSchedules = useMemo(() => {
    return [...weekSchedules].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateA - dateB;
    });
  }, [weekSchedules]);

  // Group by date
  const groupedByDate = useMemo(() => {
    return sortedSchedules.reduce(
      (acc, schedule) => {
        if (!schedule.date) return acc;
        const dateKey = dayjs(schedule.date).format("YYYY-MM-DD");
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push(schedule);
        return acc;
      },
      {} as Record<string, ScheduleResponse[]>,
    );
  }, [sortedSchedules]);

  return (
    <div>
      {/* Week navigation */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Button type="default" onClick={() => setWeekStart(weekStart.subtract(1, "week"))}>
            {"<"}
          </Button>
          <span style={{ fontWeight: 500, fontSize: 16 }}>
            Tuần {weekStart.week()} - Tháng {weekStart.month() + 1}, {weekStart.year()}
          </span>
          <Button type="default" onClick={() => setWeekStart(weekStart.add(1, "week"))}>
            {">"}
          </Button>
        </div>
      </div>

      {Object.keys(groupedByDate).length === 0 ? (
        <Empty description="Không có lịch làm việc trong tuần này" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedByDate).map(([dateKey, daySchedules]) => (
            <Card
              key={dateKey}
              size="small"
              title={
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{dayjs(dateKey).format("dddd, DD/MM/YYYY")}</span>
                  <Badge count={daySchedules.length} style={{ backgroundColor: "#52c41a" }} />
                </div>
              }
            >
              <div className="space-y-2">
                {daySchedules.map((schedule) => {
                  // Determine status - for now using NotYet as default since ScheduleResponse doesn't have status field
                  // This can be updated when API includes attendanceStatus
                  const statusKey = (schedule as any)?.attendanceStatus || "NotYet";
                  const statusInfo = statusMap[statusKey as keyof typeof statusMap] || statusMap.NotYet;

                  return (
                    <div
                      key={schedule.id}
                      className="flex items-center justify-between rounded-lg p-3 transition-all hover:shadow-sm"
                      style={{
                        background: statusInfo.color + "22",
                        border: `1px solid ${statusInfo.color}`,
                        cursor: "pointer",
                      }}
                      onClick={() => handleOpenAttendanceDrawer(schedule, dateKey)}
                    >
                      <div className="flex-1">
                        <div className="text-base font-medium text-gray-900">{schedule.shift?.name || "N/A"}</div>
                        <div className="mt-2 flex flex-wrap items-center gap-4">
                          <div className="flex items-center gap-1 text-sm" style={{ color: statusInfo.color }}>
                            {statusInfo.text}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <ClockCircleOutlined />
                            <span>
                              {schedule.shift?.startTime?.substring(0, 5)} - {schedule.shift?.endTime?.substring(0, 5)}
                            </span>
                          </div>
                          {schedule.isFixedShift && <div className="rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-700">Ca cố định</div>}
                        </div>
                      </div>
                      <div
                        className="ml-4 flex-shrink-0 rounded px-3 py-2"
                        style={{ background: statusInfo.color + "22", border: `1px solid ${statusInfo.color}` }}
                      >
                        <span className="text-sm font-medium" style={{ color: statusInfo.color }}>
                          {schedule.shift?.startTime && schedule.shift?.endTime
                            ? Math.abs(
                                dayjs(schedule.shift.endTime, "HH:mm:ss").diff(dayjs(schedule.shift.startTime, "HH:mm:ss"), "hour", true),
                              ).toFixed(1)
                            : 0}
                          h
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Status legend */}
      <div style={{ display: "flex", gap: 12, marginTop: 20, justifyContent: "center", flexWrap: "wrap" }}>
        {Object.entries(statusMap).map(([key, value]) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                background: value.color,
              }}
            />
            <span style={{ fontSize: 12, color: "#666" }}>{value.text}</span>
          </div>
        ))}
      </div>

      {/* Attendance Drawer */}
      <MyAttendanceDrawer
        open={attendanceDrawerOpen}
        onClose={() => setAttendanceDrawerOpen(false)}
        shift={attendanceDrawerData?.shift}
        date={attendanceDrawerData?.date}
        status={attendanceDrawerData?.status}
      />
    </div>
  );
};

const WorkScheduleTab: React.FC<WorkScheduleTabProps> = () => {
  // Get schedules for current month (from start to end of month)
  const startDate = useMemo(() => dayjs().startOf("month").format("YYYY-MM-DD"), []);
  const endDate = useMemo(() => dayjs().endOf("month").format("YYYY-MM-DD"), []);

  const { data: scheduleData, isLoading } = useGetMySchedule({ startDate, endDate });

  const schedules = useMemo(() => scheduleData?.data || [], [scheduleData]);

  const items = [
    {
      key: "table",
      label: (
        <span>
          <TableOutlined className="mr-2" />
          Bảng tuần
        </span>
      ),
      children: isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spin size="large" />
        </div>
      ) : (
        <WorkScheduleTableView schedules={schedules} />
      ),
    },
    {
      key: "list",
      label: (
        <span>
          <UnorderedListOutlined className="mr-2" />
          Danh sách
        </span>
      ),
      children: isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spin size="large" />
        </div>
      ) : (
        <WorkScheduleListView schedules={schedules} />
      ),
    },
  ];

  return (
    <div>
      <Tabs items={items} defaultActiveKey="table" />
    </div>
  );
};

export default WorkScheduleTab;
