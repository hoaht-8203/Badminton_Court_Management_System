"use client";
import React, { useState } from "react";
import { Table, Button, Input, Select, DatePicker, Tag, Tooltip } from "antd";
import AssignDrawer from "./assign-drawer";
import { PlusOutlined, FileExcelOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import { useListStaffs } from "@/hooks/useStaffs";
import { ListStaffRequestFromJSON } from "@/types-openapi/api/models/ListStaffRequest";
import { useListShifts } from "@/hooks/useShift";
import { useGetScheduleByShift } from "@/hooks/useSchedule";
dayjs.extend(weekOfYear);

interface ScheduleCell {
  name: string;
  status: keyof typeof statusMap;
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
  ON_TIME: { color: "#1890ff", text: "Đúng giờ" },
  LATE: { color: "#9254de", text: "Đi muộn / Về sớm" },
  MISSING: { color: "#ff4d4f", text: "Chấm công thiếu" },
  NOT_CHECKED: { color: "#faad14", text: "Chưa chấm công" },
  OFF: { color: "#bfbfbf", text: "Nghỉ làm" },
} as const;

const WorkScheduleTable: React.FC = () => {
  const [assignDrawerOpen, setAssignDrawerOpen] = useState(false);
  const [weekStart, setWeekStart] = useState(() => {
    const today = dayjs();
    return today.day() === 0 ? today.subtract(6, "day") : today.day(1);
  });
  const [searchParams, setSearchParams] = useState(ListStaffRequestFromJSON({}));
  const { data: staffs, isFetching: loadingStaffs, refetch: refetchStaffs } = useListStaffs(searchParams);
  const { data: shifts, isFetching, refetch } = useListShifts();

  const staffList =
    staffs?.data
      ?.filter((s) => typeof s.id === "number" && typeof s.fullName === "string")
      .map((s) => ({ id: s.id as number, fullName: s.fullName as string })) || [];
  const shiftList = shifts?.map((s) => ({ id: s.id, name: s.name, time: s.startTime?.substring(0, 5) + " - " + s.endTime?.substring(0, 5) })) || [];

  // Tính ngày bắt đầu và kết thúc tuần hiện tại
  const startDate = weekStart.format("YYYY-MM-DD");
  const endDate = weekStart.add(6, "day").format("YYYY-MM-DD");
  // Lấy lịch làm việc theo ca cho tuần hiện tại
  const { data: scheduleByShiftRaw, isFetching: loadingSchedule } = useGetScheduleByShift({ startDate, endDate });

  // Format lại dữ liệu trả về từ API thành dạng { [shiftId]: { [dayOfWeek]: ScheduleCell[] } }
  const scheduleByShift: Record<string, Record<number, ScheduleCell[]>> = React.useMemo(() => {
    const result: Record<string, Record<number, ScheduleCell[]>> = {};
    if (!scheduleByShiftRaw?.data) return result;
    for (const shiftItem of scheduleByShiftRaw.data) {
      if (!shiftItem?.shift?.id) continue;
      const shiftId = String(shiftItem.shift.id);
      result[shiftId] = {};
      if (!Array.isArray(shiftItem.days)) continue;
      for (const day of shiftItem.days) {
        if (typeof day?.dayOfWeek !== "number" || !Array.isArray(day?.staffs)) continue;
        result[shiftId][day.dayOfWeek] = day.staffs.map((staff: any) => ({
          name: staff?.fullName ?? "",
          status: "NOT_CHECKED", // hoặc lấy từ API nếu có trạng thái
        }));
      }
    }
    return result;
  }, [scheduleByShiftRaw]);
  return (
    <div style={{ background: "#fff", borderRadius: 8, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontWeight: 700, fontSize: 20, marginRight: 16 }}>Bảng chấm công</span>
        <Input placeholder="Tìm kiếm nhân viên" style={{ width: 240, marginRight: 8 }} />

        {/* Custom week selector giống drawer */}
        <div style={{ display: "flex", alignItems: "center", marginRight: 8 }}>
          <Button type="default" onClick={() => setWeekStart(weekStart.subtract(1, "week"))}>
            {"<"}
          </Button>
          <span style={{ fontWeight: 500, fontSize: 16, margin: "0 8px" }}>
            Tuần {weekStart.week()} - Th.{weekStart.month() + 1} {weekStart.year()}
          </span>
          <Button type="default" onClick={() => setWeekStart(weekStart.add(1, "week"))}>
            {">"}
          </Button>
        </div>

        <Button type="primary" icon={<FileExcelOutlined />} style={{ marginLeft: "auto" }}>
          Xuất file
        </Button>
        <Button type="primary" style={{ marginLeft: 8 }} onClick={() => setAssignDrawerOpen(true)}>
          Xếp lịch
        </Button>
      </div>
      {/* Tuần bắt đầu từ thứ 2 */}
      <div style={{ overflowX: "auto" }}>
        {/* IIFE tuần bắt đầu từ thứ 2 */}
        {(() => {
          const monday = weekStart;
          const currentWeek = monday;
          const weekDays = daysOfWeek.map((d, idx) => {
            const day = monday.add(idx, "day");
            return { ...d, date: day.date(), fullDate: day.format("YYYY-MM-DD") };
          });
          return (
            <>
              <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
                <thead>
                  <tr>
                    <th style={{ width: 140, textAlign: "left", padding: 8, background: "#fafafa", borderRight: "1px solid #f0f0f0" }}>
                      Ca làm việc
                    </th>
                    {weekDays.map((d, idx) => (
                      <th
                        key={d.value}
                        style={{
                          minWidth: 120,
                          textAlign: "center",
                          padding: 8,
                          background: idx === dayjs().day() - 1 ? "#e6f7ff" : "#fafafa",
                          borderRight: "1px solid #f0f0f0",
                        }}
                      >
                        {d.label} <span style={{ color: "#bfbfbf", fontSize: 12, marginLeft: 2 }}>{d.date}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shiftList.map((shift) => (
                    <tr key={shift.id}>
                      <td style={{ borderRight: "1px solid #f0f0f0", padding: 8, fontWeight: 600 }}>
                        <div>{shift.name}</div>
                        <div style={{ fontWeight: 400, fontSize: 13, color: "#888" }}>{shift.time}</div>
                      </td>
                      {weekDays.map((d) => {
                        // Lấy lịch làm việc từ API cho từng ca và ngày
                        const cellData = scheduleByShift?.[String(shift.id)]?.[d.value] || [];
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
                              background: "#fff",
                            }}
                          >
                            {cellData.map((item: ScheduleCell, idx: number) => (
                              <div
                                key={idx}
                                style={{
                                  background: "#fff7e6",
                                  borderRadius: 6,
                                  marginBottom: 6,
                                  padding: 6,
                                  fontSize: 14,
                                  border: "1px solid #ffd591",
                                }}
                              >
                                <div style={{ fontWeight: 500 }}>{item.name}</div>
                                <div style={{ fontSize: 12, color: "#888" }}>-- --</div>
                                <div style={{ fontSize: 12, color: statusMap[item.status]?.color || "#faad14" }}>
                                  {statusMap[item.status]?.text || "Chưa chấm công"}
                                </div>
                              </div>
                            ))}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          );
        })()}
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 20, justifyContent: "center" }}>
        <Tag color="#1890ff">Đúng giờ</Tag>
        <Tag color="#9254de">Đi muộn / Về sớm</Tag>
        <Tag color="#ff4d4f">Chấm công thiếu</Tag>
        <Tag color="#faad14">Chưa chấm công</Tag>
        <Tag color="#bfbfbf">Nghỉ làm</Tag>
      </div>
      <AssignDrawer
        open={assignDrawerOpen}
        onClose={() => setAssignDrawerOpen(false)}
        staffList={staffList}
        shiftList={shifts?.map((s) => ({ key: String(s.id), label: s.name || "" })) || []}
      />
    </div>
  );
};

export default WorkScheduleTable;
