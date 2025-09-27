import React, { useState } from "react";
import { Modal, Button, Checkbox, Switch, DatePicker, Select, Tag } from "antd";
import dayjs from "dayjs";

const shifts = [
  { key: "morning", label: "Ca sáng", time: "08:00 - 12:00" },
  { key: "afternoon", label: "Ca chiều", time: "13:00 - 17:00" },
  { key: "evening", label: "Ca tối", time: "18:00 - 22:00" },
];

const daysOfWeek = [
  { label: "Thứ 2", value: 1 },
  { label: "Thứ 3", value: 2 },
  { label: "Thứ 4", value: 3 },
  { label: "Thứ 5", value: 4 },
  { label: "Thứ 6", value: 5 },
  { label: "Thứ 7", value: 6 },
  { label: "Chủ nhật", value: 0 },
];

interface ScheduleAssignModalProps {
  open: boolean;
  onClose: () => void;
  staff?: { id: number; fullName: string };
  date?: string;
  onSave?: (values: any) => void;
}

const ScheduleAssignModal: React.FC<ScheduleAssignModalProps> = ({ open, onClose, staff, date, onSave }) => {
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [repeatDays, setRepeatDays] = useState<number[]>([]);
  const [repeatEnd, setRepeatEnd] = useState<string | null>(null);
  const [workOnHoliday, setWorkOnHoliday] = useState(false);
  const [applyToOthers, setApplyToOthers] = useState(false);

  const handleShiftChange = (key: string, checked: boolean) => {
    setSelectedShifts((prev) => (checked ? [...prev, key] : prev.filter((k) => k !== key)));
  };

  const handleRepeatDayChange = (value: number) => {
    setRepeatDays((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  };

  const handleSelectAllDays = () => {
    setRepeatDays(daysOfWeek.map((d) => d.value));
  };

  const handleSave = () => {
    onSave?.({ selectedShifts, repeatWeekly, repeatDays, repeatEnd, workOnHoliday, applyToOthers });
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
      zIndex={2000}
      title={
        <div style={{ fontWeight: 700, fontSize: 20 }}>
          Thêm lịch làm việc
          <div style={{ fontWeight: 400, fontSize: 15, marginTop: 4 }}>
            <span style={{ marginRight: 12 }}>
              <Tag color="#1890ff">{staff?.fullName}</Tag>
            </span>
            <span>
              <Tag color="#1890ff">{date ? dayjs(date).format("dddd, DD/MM/YYYY") : ""}</Tag>
            </span>
          </div>
        </div>
      }
    >
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontWeight: 500, marginBottom: 8 }}>
          Chọn ca làm việc <Button type="link" icon={"+"} />
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          {shifts.map((shift) => (
            <div key={shift.key} style={{ minWidth: 120 }}>
              <Checkbox checked={selectedShifts.includes(shift.key)} onChange={(e) => handleShiftChange(shift.key, e.target.checked)}>
                {shift.label}
              </Checkbox>
              <div style={{ fontSize: 13, color: "#888" }}>{shift.time}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontWeight: 500, marginBottom: 8 }}>
          Lặp lại hàng tuần
          <Switch style={{ marginLeft: 12 }} checked={repeatWeekly} onChange={setRepeatWeekly} />
        </div>
        {repeatWeekly && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              {daysOfWeek.map((d) => (
                <Button
                  key={d.value}
                  type={repeatDays.includes(d.value) ? "primary" : "default"}
                  onClick={() => handleRepeatDayChange(d.value)}
                  style={{ borderRadius: 20, padding: "0 12px" }}
                >
                  {d.label}
                </Button>
              ))}
              <Button type="link" onClick={handleSelectAllDays}>
                Chọn tất cả
              </Button>
            </div>
            <div style={{ marginBottom: 8 }}>
              Lặp lại {repeatDays.length > 0 ? repeatDays.map((d) => daysOfWeek.find((day) => day.value === d)?.label).join(", ") : ""} hàng tuần
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span>Kết thúc</span>
              <Select style={{ width: 120 }} defaultValue="none">
                <Select.Option value="none">Chưa xác định</Select.Option>
                <Select.Option value="date">Chọn ngày</Select.Option>
              </Select>
              <DatePicker disabled style={{ width: 120 }} />
              <Checkbox checked={workOnHoliday} onChange={(e) => setWorkOnHoliday(e.target.checked)}>
                Làm việc cả ngày lễ tết
              </Checkbox>
            </div>
          </>
        )}
      </div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontWeight: 500, marginBottom: 8 }}>
          Thêm lịch tương tự cho nhân viên khác
          <Switch style={{ marginLeft: 12 }} checked={applyToOthers} onChange={setApplyToOthers} />
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <Button onClick={onClose}>Bỏ qua</Button>
        <Button type="primary" onClick={handleSave}>
          Lưu
        </Button>
      </div>
    </Modal>
  );
};

export default ScheduleAssignModal;
