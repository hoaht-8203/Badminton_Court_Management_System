// Map màu trạng thái giống bên bảng
const statusMap = {
  NotYet: { color: "#faad14", text: "Chưa diễn ra" },
  Attended: { color: "#1890ff", text: "Đã chấm công" },
  Late: { color: "#9254de", text: "Đi muộn / Về sớm" },
  Missing: { color: "#bfbfbf", text: "Chấm công thiếu" },
  Absent: { color: "#ff4d4f", text: "Nghỉ làm" },
} as const;
import React, { useState } from "react";
import { Modal, Button, Input, Radio, Checkbox, DatePicker, Tabs, Tag, Select } from "antd";
import dayjs from "dayjs";

interface AttendanceModalProps {
  open: boolean;
  onClose: () => void;
  staff?: {
    id: number;
    fullName: string;
  };
  shift?: {
    id: number;
    name: string;
    time: string;
  };
  date?: string; // YYYY-MM-DD
  status?: "Attended" | "Absent" | "NotYet";
  note?: string;
  checkIn?: string; // HH:mm
  checkOut?: string; // HH:mm
  onSave?: (data: any) => void;
}

const statusOptions = [
  { label: "Chưa diễn ra", value: "NotYet" },
  { label: "Đã chấm công", value: "Attended" },
  { label: "Đi muộn / Về sớm", value: "Late" },
  { label: "Chấm công thiếu", value: "Missing" },
  { label: "Nghỉ làm", value: "Absent" },
];

const AttendanceModal: React.FC<AttendanceModalProps> = ({
  open,
  onClose,
  staff,
  shift,
  date,
  status = "NotYet",
  note = "",
  checkIn = "",
  checkOut = "",
  onSave,
}) => {
  const [attendanceStatus, setAttendanceStatus] = useState<string>(status);
  const [attendanceNote, setAttendanceNote] = useState<string>(note);
  const [checkInTime, setCheckInTime] = useState<string>(checkIn);
  const [checkOutTime, setCheckOutTime] = useState<string>(checkOut);
  const [checkInEnabled, setCheckInEnabled] = useState<boolean>(!!checkIn);
  const [checkOutEnabled, setCheckOutEnabled] = useState<boolean>(!!checkOut);

  React.useEffect(() => {
    setAttendanceStatus(status ?? "NotYet");
  }, [status, open]);

  const handleSave = () => {
    if (onSave) {
      onSave({
        staff,
        shift,
        date,
        status: attendanceStatus,
        note: attendanceNote,
        checkIn: checkInEnabled ? checkInTime : "",
        checkOut: checkOutEnabled ? checkOutTime : "",
      });
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span>Chấm công</span>
          {staff?.fullName && (
            <span style={{ fontWeight: 500 }}>
              <Tag color="blue">{staff.fullName}</Tag>
            </span>
          )}
          {/* Hiển thị label trạng thái với màu tương ứng */}
          <Tag color={statusMap[attendanceStatus as keyof typeof statusMap]?.color || "orange"}>
            {statusOptions.find((s) => s.value === attendanceStatus)?.label || "Chưa chấm công"}
          </Tag>
        </div>
      }
      width={600}
    >
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 24, marginBottom: 8 }}>
          <div>
            <span style={{ fontWeight: 500 }}>Thời gian:</span>
            <span style={{ marginLeft: 8 }}>{date ? dayjs(date).format("dddd, DD/MM/YYYY") : "--"}</span>
          </div>
          <div>
            <span style={{ fontWeight: 500 }}>Ca làm việc:</span>
            <span style={{ marginLeft: 8 }}>
              {shift?.name} ({shift?.time})
            </span>
          </div>
        </div>
        <Input.TextArea placeholder="Ghi chú" value={attendanceNote} onChange={(e) => setAttendanceNote(e.target.value)} rows={2} />
      </div>
      <div>
        <div style={{ display: "flex", gap: 32, marginBottom: 16 }}>
          <Checkbox checked={checkInEnabled} onChange={(e) => setCheckInEnabled(e.target.checked)}>
            Vào
          </Checkbox>
          <Input type="time" value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} disabled={!checkInEnabled} style={{ width: 120 }} />
          <Checkbox checked={checkOutEnabled} onChange={(e) => setCheckOutEnabled(e.target.checked)}>
            Ra
          </Checkbox>
          <Input
            type="time"
            value={checkOutTime}
            onChange={(e) => setCheckOutTime(e.target.value)}
            disabled={!checkOutEnabled}
            style={{ width: 120 }}
          />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 24 }}>
        <Button onClick={onClose}>Bỏ qua</Button>
        <Button type="primary" onClick={handleSave}>
          Lưu
        </Button>
      </div>
    </Modal>
  );
};

export default AttendanceModal;
