import React, { useState } from "react";
import ScheduleAssignModal from "./schedule-assign-modal";
import { Drawer, Button, Tag } from "antd";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";

import { useGetScheduleByStaff } from "@/hooks/useSchedule";
dayjs.extend(weekOfYear);

interface AssignDrawerProps {
  open: boolean;
  onClose: () => void;
  staffList: Array<{ id: number; fullName: string }>;
  shiftList: Array<{ key: string; label: string }>;
  date?: string;
  onAssign?: (params: { staffId: number; date: string; shiftKey: string }) => void;
}

const daysOfWeek = [
  { label: "Thứ hai", value: 1 },
  { label: "Thứ ba", value: 2 },
  { label: "Thứ tư", value: 3 },
  { label: "Thứ năm", value: 4 },
  { label: "Thứ sáu", value: 5 },
  { label: "Thứ bảy", value: 6 },
  { label: "Chủ nhật", value: 0 },
];

const shiftColors: Record<string, string> = {
  morning: "#e6f7ff",
  afternoon: "#e6ffed",
  evening: "#fff7e6",
};

const shiftLabels: Record<string, string> = {
  morning: "Ca sáng",
  afternoon: "Ca chiều",
  evening: "Ca tối",
};

const AssignDrawer: React.FC<AssignDrawerProps> = ({ open, onClose, staffList, shiftList }) => {
  const [hoverCell, setHoverCell] = useState<{ staffId: number; day: number } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStaff, setModalStaff] = useState<{ id: number; fullName: string } | null>(null);
  const [modalDate, setModalDate] = useState<string>("");
  // State tuần hiện tại
  const [weekStart, setWeekStart] = useState(() => {
    const today = dayjs();
    return today.day() === 0 ? today.subtract(6, "day") : today.day(1);
  });
  const monday = weekStart;
  const weekDays = daysOfWeek.map((d, idx) => {
    const day = monday.add(idx, "day");
    return { ...d, date: day.date(), fullDate: day.format("YYYY-MM-DD") };
  });
  const startDate = weekStart.format("YYYY-MM-DD");
  const endDate = weekStart.add(6, "day").format("YYYY-MM-DD");
  const { data: scheduleByStaffRaw } = useGetScheduleByStaff({ startDate, endDate });

  const staffScheduleMap: Record<number, Record<number, string[]>> = React.useMemo(() => {
    const result: Record<number, Record<number, string[]>> = {};
    if (!scheduleByStaffRaw?.data) return result;
    for (const staffItem of scheduleByStaffRaw.data) {
      const staffId = staffItem?.staff?.id;
      if (typeof staffId !== "number") continue;
      result[staffId] = {};
      if (!Array.isArray(staffItem.days)) continue;
      for (const day of staffItem.days) {
        if (typeof day?.dayOfWeek !== "number" || !Array.isArray(day?.shifts)) continue;
        result[staffId][day.dayOfWeek] = day.shifts.map((shift: any) => shift.name);
      }
    }
    return result;
  }, [scheduleByStaffRaw]);

  return (
    <>
      <Drawer
        open={open}
        title={<span style={{ fontWeight: 700, fontSize: 20 }}>Xếp lịch làm việc</span>}
        onClose={onClose}
        width={1200}
        destroyOnClose
        footer={
          <div style={{ textAlign: "right" }}>
            <Button onClick={onClose}>Xong</Button>
          </div>
        }
      >
        <div style={{ marginBottom: 24 }}>
          <Button type="default" style={{ marginRight: 8 }} onClick={() => setWeekStart(weekStart.subtract(1, "week"))}>
            {"<"}
          </Button>
          <span style={{ fontWeight: 500, fontSize: 16 }}>
            Tuần {monday.week()} - Th.{monday.month() + 1} {monday.year()}
          </span>
          <Button type="default" style={{ marginLeft: 8 }} onClick={() => setWeekStart(weekStart.add(1, "week"))}>
            {">"}
          </Button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
            <thead>
              <tr>
                <th style={{ width: 180, textAlign: "left", padding: 8, background: "#f5f5f5", borderRight: "1px solid #f0f0f0" }}>Nhân viên</th>
                {weekDays.map((d, idx) => (
                  <th
                    key={d.value}
                    style={{
                      minWidth: 120,
                      textAlign: "center",
                      padding: 8,
                      background: idx === weekStart.day() - 1 ? "#e6f7ff" : "#f5f5f5",
                      borderRight: "1px solid #f0f0f0",
                    }}
                  >
                    {d.label} <span style={{ color: "#1890ff", fontWeight: idx === weekStart.day() - 1 ? 700 : 400 }}>{d.date}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staffList.map((staff) => (
                <tr key={staff.id}>
                  <td style={{ borderRight: "1px solid #f0f0f0", padding: 8 }}>
                    <div style={{ fontWeight: 600 }}>{staff.fullName}</div>
                    <div style={{ fontSize: 13, color: "#888" }}>{`NV${String(staff.id).padStart(6, "0")}`}</div>
                  </td>
                  {weekDays.map((d, idx) => {
                    const shiftsOfDay = staffScheduleMap[staff.id]?.[d.value] || [];
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
                        onMouseEnter={() => setHoverCell({ staffId: staff.id, day: d.value })}
                        onMouseLeave={() => setHoverCell(null)}
                      >
                        {shiftsOfDay.map((shiftKey, idx2) => (
                          <div
                            key={idx2}
                            style={{
                              background: shiftColors[shiftKey],
                              borderRadius: 6,
                              marginBottom: 6,
                              padding: 6,
                              fontSize: 14,
                              border: "1px solid #b7eb8f",
                            }}
                          >
                            <span style={{ fontWeight: 500 }}>{shiftLabels[shiftKey]}</span>
                          </div>
                        ))}
                        {hoverCell && hoverCell.staffId === staff.id && hoverCell.day === d.value && (
                          <Button
                            type="link"
                            style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
                            onClick={() => {
                              setModalStaff({ id: staff.id, fullName: staff.fullName });
                              setModalDate(d.fullDate);
                              setModalOpen(true);
                            }}
                          >
                            + Thêm lịch
                          </Button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 20, justifyContent: "center" }}>
          <Tag color="#e6f7ff">Ca sáng</Tag>
          <Tag color="#e6ffed">Ca chiều</Tag>
          <Tag color="#fff7e6">Ca tối</Tag>
        </div>
      </Drawer>
      <ScheduleAssignModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        staff={modalStaff ?? undefined}
        date={modalDate}
        shiftList={shiftList}
        onSave={(values) => {
          // TODO: Xử lý lưu lịch làm việc
          setModalOpen(false);
        }}
      />
    </>
  );
};

export default AssignDrawer;
