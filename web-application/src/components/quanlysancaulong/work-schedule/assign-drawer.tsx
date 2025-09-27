import React, { useState } from "react";
import ScheduleAssignModal from "./schedule-assign-modal";
import { Drawer, Button, Tag } from "antd";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
dayjs.extend(weekOfYear);

interface AssignDrawerProps {
  open: boolean;
  onClose: () => void;
  staffList: Array<{ id: number; fullName: string; code?: string }>;
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

// Dummy schedule data for demo
const dummySchedule: Record<number, Record<number, string[]>> = {
  1: { 1: ["morning", "afternoon"], 2: [], 3: [], 4: [], 5: [], 6: [], 0: [] }, // Hậu
  2: { 1: ["morning", "evening"], 2: [], 3: [], 4: [], 5: [], 6: [], 0: [] }, // Khánh
};

const AssignDrawer: React.FC<AssignDrawerProps> = ({ open, onClose, staffList, shiftList, date, onAssign }) => {
  const [hoverCell, setHoverCell] = useState<{ staffId: number; day: number } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStaff, setModalStaff] = useState<{ id: number; fullName: string } | null>(null);
  const [modalDate, setModalDate] = useState<string>("");

  // Lấy ngày đầu tuần là thứ 2
  const currentWeek = dayjs();
  const monday = currentWeek.day() === 0 ? currentWeek.subtract(6, "day") : currentWeek.day(1);
  const weekDays = daysOfWeek.map((d, idx) => {
    // Tính ngày thực tế của từng thứ trong tuần, bắt đầu từ thứ 2
    const day = monday.add(idx, "day");
    return { ...d, date: day.date(), fullDate: day.format("YYYY-MM-DD") };
  });

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
          <Button type="default" style={{ marginRight: 8 }}>
            {"<"}
          </Button>
          <span style={{ fontWeight: 500, fontSize: 16 }}>
            Tuần {monday.week()} - Th.{monday.month() + 1} {monday.year()}
          </span>
          <Button type="default" style={{ marginLeft: 8 }}>
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
                      background: idx === currentWeek.day() - 1 ? "#e6f7ff" : "#f5f5f5",
                      borderRight: "1px solid #f0f0f0",
                    }}
                  >
                    {d.label} <span style={{ color: "#1890ff", fontWeight: idx === currentWeek.day() - 1 ? 700 : 400 }}>{d.date}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staffList.map((staff) => (
                <tr key={staff.id}>
                  <td style={{ borderRight: "1px solid #f0f0f0", padding: 8 }}>
                    <div style={{ fontWeight: 600 }}>{staff.fullName}</div>
                    <div style={{ fontSize: 13, color: "#888" }}>{staff.code || `NV${String(staff.id).padStart(6, "0")}`}</div>
                  </td>
                  {weekDays.map((d, idx) => {
                    const shiftsOfDay = dummySchedule[staff.id]?.[d.value] || [];
                    return (
                      <td
                        key={d.value}
                        style={{ minHeight: 60, padding: 4, verticalAlign: "top", position: "relative" }}
                        onMouseEnter={() => setHoverCell({ staffId: staff.id, day: d.value })}
                        onMouseLeave={() => setHoverCell(null)}
                      >
                        {shiftsOfDay.map((shiftKey, idx2) => (
                          <div key={idx2} style={{ background: shiftColors[shiftKey], borderRadius: 6, marginBottom: 6, padding: 6, fontSize: 14 }}>
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
        onSave={(values) => {
          // TODO: Xử lý lưu lịch làm việc
          setModalOpen(false);
        }}
      />
    </>
  );
};

export default AssignDrawer;
