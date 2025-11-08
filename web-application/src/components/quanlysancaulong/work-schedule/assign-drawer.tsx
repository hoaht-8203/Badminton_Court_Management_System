"use client";

import { Button, Drawer, Tag } from "antd";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import React, { useState, useMemo, useCallback } from "react";
import ScheduleAssignModal from "./schedule-assign-modal";
import { useGetScheduleByStaff } from "@/hooks/useSchedule";
import { ScheduleRequest } from "@/types-openapi/api";
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

// Danh sách 10 màu cố định
const shiftColors = ["#e6f7ff", "#e6ffed", "#fff7e6", "#f9e6ff", "#ffe6e6", "#e6f9ff", "#e6ffe6", "#fffbe6", "#e6e6ff", "#f6ffe6"];

const AssignDrawer: React.FC<AssignDrawerProps> = ({ open, onClose, staffList, shiftList }) => {
  // Map shiftId với màu, shiftList lấy từ props
  const getShiftColorById = useCallback(
    (shiftId: string) => {
      const idx = shiftList.findIndex((s: { key: string; label: string }) => String(s.key) === String(shiftId));
      return shiftColors[idx >= 0 ? idx % shiftColors.length : 0];
    },
    [shiftList],
  );

  const [hoverCell, setHoverCell] = useState<{ staffId: number; day: number } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStaff, setModalStaff] = useState<{ id: number; fullName: string } | null>(null);
  const [modalDate, setModalDate] = useState<string>("");
  // selected day of week should persist when iterating weeks (0..6, 0 = Sunday)
  const [selectedDay, setSelectedDay] = useState<number>(() => dayjs().day());

  // State tuần hiện tại (monday start)
  const [weekStart, setWeekStart] = useState(() => {
    const today = dayjs();
    return today.day() === 0 ? today.subtract(6, "day") : today.day(1);
  });

  const monday = weekStart;

  const weekDays = useMemo(() => {
    return daysOfWeek.map((d, idx) => {
      const day = monday.add(idx, "day");
      return { ...d, date: day.date(), fullDate: day.format("YYYY-MM-DD") };
    });
  }, [monday]);

  const { startDate, endDate, request } = useMemo(() => {
    const s = weekStart.toDate();
    const e = weekStart.add(6, "day").toDate();
    return { startDate: s, endDate: e, request: { startDate: s, endDate: e } as ScheduleRequest };
  }, [weekStart]);

  // Lấy dữ liệu lịch làm việc của tất cả nhân viên trong tuần hiện tại
  const { data: scheduleByStaffRaw } = useGetScheduleByStaff(request);

  const staffScheduleMap: Record<number, Record<number, string[]>> = useMemo(() => {
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

  // map shift label to index for fast lookup when rendering (avoid find in loop)
  const shiftLabelIndexMap = useMemo(() => {
    const m = new Map<string, number>();
    shiftList.forEach((s, i) => m.set(String(s.label), i));
    return m;
  }, [shiftList]);

  const handlePrevWeek = useCallback(() => setWeekStart((ws) => ws.subtract(1, "week")), []);
  const handleNextWeek = useCallback(() => setWeekStart((ws) => ws.add(1, "week")), []);

  const handleMouseEnter = useCallback((staffId: number, day: number) => () => setHoverCell({ staffId, day }), []);
  const handleMouseLeave = useCallback(() => setHoverCell(null), []);

  const openAssignModal = useCallback((staff: { id: number; fullName: string } | null, fullDate: string, dayValue?: number) => {
    if (typeof dayValue === "number") setSelectedDay(dayValue);
    setModalStaff(staff);
    setModalDate(fullDate);
    setModalOpen(true);
  }, []);

  // allow selecting day-of-week header; persist selectedDay across week navigation
  const selectDay = useCallback((dayValue: number) => setSelectedDay(dayValue), []);
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
          <Button type="default" style={{ marginRight: 8 }} onClick={handlePrevWeek}>
            {"<"}
          </Button>
          <span style={{ fontWeight: 500, fontSize: 16 }}>
            Tuần {monday.week()} - Th.{monday.month() + 1} {monday.year()}
          </span>
          <Button type="default" style={{ marginLeft: 8 }} onClick={handleNextWeek}>
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
                    onClick={() => selectDay(d.value)}
                    style={{
                      minWidth: 120,
                      textAlign: "center",
                      padding: 8,
                      cursor: "pointer",
                      background: d.value === selectedDay ? "#e6f7ff" : "#f5f5f5",
                      borderRight: "1px solid #f0f0f0",
                    }}
                  >
                    {d.label} <span style={{ color: "#1890ff", fontWeight: d.value === selectedDay ? 700 : 400 }}>{d.date}</span>
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
                    // shiftList: [{key, label}], staffScheduleMap lưu theo shift.name
                    // Để map màu đúng, cần lấy shiftId từ shiftList dựa vào tên ca
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
                        onMouseEnter={handleMouseEnter(staff.id, d.value)}
                        onMouseLeave={handleMouseLeave}
                      >
                        {shiftsOfDay.map((shiftName, idx2) => {
                          // get color by label index
                          const idxForLabel = shiftLabelIndexMap.get(String(shiftName));
                          const shiftId = typeof idxForLabel === "number" ? String(shiftList[idxForLabel].key) : String(idx2);
                          return (
                            <div
                              key={idx2}
                              style={{
                                background: getShiftColorById(shiftId),
                                borderRadius: 6,
                                marginBottom: 6,
                                padding: 6,
                                fontSize: 14,
                                border: "1px solid #b7eb8f",
                              }}
                            >
                              <span style={{ fontWeight: 500 }}>{shiftName}</span>
                            </div>
                          );
                        })}
                        {hoverCell && hoverCell.staffId === staff.id && hoverCell.day === d.value && (
                          <Button
                            type="link"
                            style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
                            onClick={() => openAssignModal({ id: staff.id, fullName: staff.fullName }, d.fullDate, d.value)}
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
        {/* thêm chú thích màu */}
        <div style={{ display: "flex", gap: 16, marginTop: 20, justifyContent: "center" }}>
          {shiftList.map((shift, idx) => (
            <Tag
              key={shift.key}
              color={shiftColors[idx % shiftColors.length]}
              style={{
                width: 120,
                textAlign: "center",
                fontWeight: 500,
                fontSize: 16,
                opacity: 1,
                background: shiftColors[idx % shiftColors.length],
                border: "none",
                padding: "8px 0",
                color: "#000",
              }}
            >
              {shift.label}
            </Tag>
          ))}
        </div>
      </Drawer>
      <ScheduleAssignModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        staff={modalStaff ?? undefined}
        date={modalDate}
        shiftList={shiftList}
        initialSelectedDay={selectedDay}
        onSave={(values) => {
          // TODO: Xử lý lưu lịch làm việc
          setModalOpen(false);
        }}
      />
    </>
  );
};

export default AssignDrawer;
