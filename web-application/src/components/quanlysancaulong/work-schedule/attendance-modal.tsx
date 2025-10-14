// Map màu trạng thái giống bên bảng
const statusMap = {
  NotYet: { color: "#faad14", text: "Chưa diễn ra" },
  Attended: { color: "#1890ff", text: "Đã chấm công" },
  Late: { color: "#9254de", text: "Đi muộn / Về sớm" },
  Missing: { color: "#bfbfbf", text: "Chấm công thiếu" },
  Absent: { color: "#ff4d4f", text: "Nghỉ làm" },
} as const;
import React, { useState } from "react";
import { Modal, Button, Input, Radio, Checkbox, DatePicker, Tabs, Tag, Select, message } from "antd";
import dayjs from "dayjs";
import { attendanceService } from "@/services/attendanceService";
import { AttendanceRequest } from "@/types-openapi/api";

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
  attendanceRecordId?: number | null;
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
  attendanceRecordId = null,
  onSave,
}) => {
  const [attendanceStatus, setAttendanceStatus] = useState<string>(status);
  const [attendanceNote, setAttendanceNote] = useState<string>("");
  const [checkInTime, setCheckInTime] = useState<string>("");
  const [checkOutTime, setCheckOutTime] = useState<string>("");
  const [checkInEnabled, setCheckInEnabled] = useState<boolean>(false);
  const [checkOutEnabled, setCheckOutEnabled] = useState<boolean>(false);
  const [initialData, setInitialData] = useState<any>(null);

  React.useEffect(() => {
    setAttendanceStatus(status ?? "NotYet");
    setAttendanceNote("");
    setCheckInTime("");
    setCheckOutTime("");
    setCheckInEnabled(false);
    setCheckOutEnabled(false);
    // Nếu attendanceRecordId có giá trị, fetch dữ liệu từ API
    if (attendanceRecordId) {
      attendanceService.getAttendanceById(attendanceRecordId).then((res) => {
        if (res?.data) {
          setAttendanceNote(res.data.notes ?? "");
          setCheckInTime(res.data.checkInTime ?? "");
          setCheckOutTime(res.data.checkOutTime ?? "");
          setCheckInEnabled(!!res.data.checkInTime);
          setCheckOutEnabled(!!res.data.checkOutTime);
          setInitialData({
            attendanceNote: res.data.notes ?? "",
            checkInTime: res.data.checkInTime ?? "",
            checkOutTime: res.data.checkOutTime ?? "",
            checkInEnabled: !!res.data.checkInTime,
            checkOutEnabled: !!res.data.checkOutTime,
          });
        }
      });
    } else {
      setInitialData({
        attendanceStatus: status ?? "NotYet",
        attendanceNote: "",
        checkInTime: "",
        checkOutTime: "",
        checkInEnabled: false,
        checkOutEnabled: false,
      });
    }
  }, [status, open, attendanceRecordId]);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const handleSave = async () => {
    setErrorMsg("");
    const formatTime = (t: string) => {
      if (!t) return undefined;
      const parts = t.split(":");
      if (parts.length === 3) return t;
      if (parts.length === 2) return `${t}:00`;
      return t;
    };
    if (checkInEnabled && checkOutEnabled && checkInTime && checkOutTime) {
      // So sánh giờ phút
      const inParts = checkInTime.split(":");
      const outParts = checkOutTime.split(":");
      const inMinutes = parseInt(inParts[0], 10) * 60 + parseInt(inParts[1], 10);
      const outMinutes = parseInt(outParts[0], 10) * 60 + parseInt(outParts[1], 10);
      if (inMinutes >= outMinutes) {
        setErrorMsg("Giờ vào phải nhỏ hơn giờ ra!");
        return;
      }
    }
    const payload: AttendanceRequest = {
      id: attendanceRecordId ?? undefined,
      staffId: staff?.id,
      date: date ? new Date(date) : undefined,
      notes: attendanceNote,
      checkInTime: checkInEnabled ? formatTime(checkInTime) : undefined,
      checkOutTime: checkOutEnabled ? formatTime(checkOutTime) : undefined,
    };
    await attendanceService.createOrUpdateAttendance(payload);
    message.success("Lưu chấm công thành công!");
    if (onSave) {
      onSave({});
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

      {errorMsg && <div style={{ color: "#ff4d4f", marginBottom: 8, textAlign: "right" }}>{errorMsg}</div>}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 24 }}>
        <Button onClick={onClose}>Bỏ qua</Button>
        <Button
          type="primary"
          onClick={handleSave}
          disabled={
            !initialData ||
            (attendanceStatus === initialData.attendanceStatus &&
              attendanceNote === initialData.attendanceNote &&
              checkInTime === initialData.checkInTime &&
              checkOutTime === initialData.checkOutTime &&
              checkInEnabled === initialData.checkInEnabled &&
              checkOutEnabled === initialData.checkOutEnabled)
          }
        >
          Lưu
        </Button>
      </div>
    </Modal>
  );
};

export default AttendanceModal;
