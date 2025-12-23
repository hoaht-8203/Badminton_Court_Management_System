"use client";
import { useGetScheduleByShift } from "@/hooks/useSchedule";
import { useListShifts } from "@/hooks/useShift";
import { useListStaffs } from "@/hooks/useStaffs";
import { ListStaffRequestFromJSON } from "@/types-openapi/api/models/ListStaffRequest";
import { SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import { Button, Select, Tag } from "antd";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import React, { useState } from "react";
import AssignDrawer from "./assign-drawer";
import AttendanceModal from "./attendance-modal";
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
  NotYet: { color: "#faad14", text: "Chưa diễn ra" },
  Attended: { color: "#1890ff", text: "Đã chấm công" },
  Late: { color: "#9254de", text: "Đi muộn / Về sớm" },
  Missing: { color: "#bfbfbf", text: "Chấm công thiếu" },
  Absent: { color: "#ff4d4f", text: "Nghỉ làm" },
} as const;

const WorkScheduleTable: React.FC = () => {
  const [assignDrawerOpen, setAssignDrawerOpen] = useState(false);
  const [weekStart, setWeekStart] = useState(() => {
    const today = dayjs();
    return today.day() === 0 ? today.subtract(6, "day") : today.day(1);
  });
  const [searchParams, setSearchParams] = useState(ListStaffRequestFromJSON({}));
  const { data: staffs, isFetching: loadingStaffs, refetch: refetchStaffs } = useListStaffs(searchParams);
  // For AJAX search box
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStaffIds, setSelectedStaffIds] = useState<number[]>([]);
  const [appliedSelectedStaffIds, setAppliedSelectedStaffIds] = useState<number[]>([]);

  // Debounce searchQuery into searchParams.keyword
  React.useEffect(() => {
    const t = setTimeout(() => {
      setSearchParams((prev) => ({ ...prev, keyword: searchQuery || null }));
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);
  const { data: shifts, isFetching } = useListShifts();

  // State cho modal chấm công
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [attendanceModalData, setAttendanceModalData] = useState<any>(null);

  const staffList =
    staffs?.data
      ?.filter((s) => typeof s.id === "number" && typeof s.fullName === "string")
      .map((s) => ({ id: s.id as number, fullName: s.fullName as string })) || [];
  const shiftList =
    shifts?.map((s) => ({
      id: s.id,
      name: s.name,
      time: s.startTime?.substring(0, 5) + " - " + s.endTime?.substring(0, 5),
      startTime: s.startTime,
      endTime: s.endTime,
    })) || [];

  // Tính ngày bắt đầu và kết thúc tuần hiện tại
  const startDate = weekStart.toDate();
  const endDate = weekStart.add(6, "day").toDate();
  // Lấy lịch làm việc theo ca cho tuần hiện tại
  const {
    data: scheduleByShiftRaw,
    isFetching: loadingSchedule,
    refetch,
  } = useGetScheduleByShift({
    startDate,
    endDate,
    staffIds: appliedSelectedStaffIds.length > 0 ? appliedSelectedStaffIds : undefined,
  });

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
          ...staff,
          name: staff?.fullName ?? "",
          status: staff?.attendanceStatus ?? "NotYet", // lấy đúng status từ API
        }));
      }
    }
    return result;
  }, [scheduleByShiftRaw]);

  // Hàm mở modal chấm công
  const handleOpenAttendanceModal = (staff: any, shift: any, date: string) => {
    setAttendanceModalData({
      staff: {
        id: staff?.id,
        fullName: staff?.fullName,
        code: staff?.code,
      },
      shift: {
        id: shift?.id,
        name: shift?.name,
        time: shift?.time,
        startTime: shift?.startTime,
        endTime: shift?.endTime,
      },
      date,
      status: staff?.status ?? "NotYet",
      attendanceRecordId: staff?.attendanceRecordId ?? null,
    });
    setAttendanceModalOpen(true);
  };

  return (
    <div style={{ background: "#fff", borderRadius: 8, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontWeight: 700, fontSize: 20, marginRight: 16 }}>Bảng chấm công</span>
        <div style={{ display: "flex", alignItems: "center" }}>
          <Select
            showSearch
            mode="multiple"
            placeholder="Tìm kiếm nhân viên"
            style={{ width: 360, marginRight: 8 }}
            value={selectedStaffIds.map(String)}
            onSearch={(val) => setSearchQuery(val)}
            onChange={(values) => setSelectedStaffIds(values.map((v) => Number(v)))}
            filterOption={false}
            options={staffs?.data?.map((s: any) => ({ label: s.fullName ?? s.id?.toString(), value: String(s.id) })) || []}
            notFoundContent={loadingStaffs ? "Đang tìm..." : "Không tìm thấy"}
          />
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={() => {
              setAppliedSelectedStaffIds(selectedStaffIds);
            }}
            style={{ marginLeft: 8 }}
          >
            Tìm
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              setSelectedStaffIds([]);
              setAppliedSelectedStaffIds([]);
              setSearchQuery("");
            }}
            style={{ marginLeft: 8 }}
          >
            Reset
          </Button>
        </div>

        {/* week selector removed from top toolbar and moved to bottom center for better spacing */}

        <Button type="primary" style={{ marginLeft: "auto" }} onClick={() => setAssignDrawerOpen(true)}>
          Xếp lịch
        </Button>
      </div>
      {/* Centered week navigation placed above the status legend to free top toolbar space */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Button type="default" onClick={() => setWeekStart(weekStart.subtract(1, "week"))}>
            {"<"}
          </Button>
          <span style={{ fontWeight: 500, fontSize: 16 }}>
            Tuần {weekStart.week()} - Th.{weekStart.month() + 1} {weekStart.year()}
          </span>
          <Button type="default" onClick={() => setWeekStart(weekStart.add(1, "week"))}>
            {">"}
          </Button>
        </div>
      </div>
      <div style={{ overflowX: "auto" }}>
        {(() => {
          const monday = weekStart;
          const today = dayjs().format("YYYY-MM-DD");
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
                    {weekDays.map((d, idx) => {
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
                          <span style={{ color: isToday ? "#1890ff" : "#bfbfbf", fontSize: 12, marginLeft: 2, fontWeight: isToday ? 700 : 400 }}>
                            {d.date}
                          </span>
                        </th>
                      );
                    })}
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
                            {cellData.map((item: any, idx: number) => {
                              const statusKey = (item.status ?? "NotYet") as keyof typeof statusMap;
                              const statusInfo = statusMap[statusKey] || statusMap.NotYet;
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
                                  onClick={() => handleOpenAttendanceModal(item, shift, d.fullDate)}
                                >
                                  <div style={{ fontWeight: 500 }}>{item.name}</div>
                                  <div style={{ fontSize: 12, color: "#888" }}>-- --</div>
                                  <div style={{ fontSize: 12, color: statusInfo.color }}>{statusInfo.text}</div>
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
            </>
          );
        })()}
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 20, justifyContent: "center" }}>
        {Object.entries(statusMap).map(([key, value]) => (
          <Tag key={key} color={value.color}>
            {value.text}
          </Tag>
        ))}
      </div>
      <AssignDrawer
        open={assignDrawerOpen}
        onClose={() => setAssignDrawerOpen(false)}
        staffList={staffList}
        shiftList={shifts?.map((s) => ({ key: String(s.id), label: s.name || "" })) || []}
      />
      {/* Modal chấm công */}
      <AttendanceModal
        open={attendanceModalOpen}
        {...attendanceModalData}
        onClose={() => {
          setAttendanceModalOpen(false);
          refetch();
        }}
      />
    </div>
  );
};

export default WorkScheduleTable;
