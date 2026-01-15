import React, { useEffect, useState } from "react";
import { Drawer, Tag, Spin, Empty } from "antd";
import dayjs from "dayjs";
import { attendanceService } from "@/services/attendanceService";
import { AttendanceResponse } from "@/types-openapi/api";

interface MyAttendanceDrawerProps {
  open: boolean;
  onClose: () => void;
  shift?: { id: number; name: string; time: string; startTime?: string; endTime?: string };
  date?: string; // YYYY-MM-DD
  status?: string;
}

const statusMap: Record<string, { color: string; text: string }> = {
  NotYet: { color: "#faad14", text: "Chưa diễn ra" },
  Attended: { color: "#1890ff", text: "Đã chấm công" },
  Late: { color: "#9254de", text: "Đi muộn / Về sớm" },
  Missing: { color: "#bfbfbf", text: "Chấm công thiếu" },
  Absent: { color: "#ff4d4f", text: "Nghỉ làm" },
};

const MyAttendanceDrawer: React.FC<MyAttendanceDrawerProps> = ({ open, onClose, shift, date, status = "NotYet" }) => {
  const [attendanceList, setAttendanceList] = useState<AttendanceResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAttendance = async () => {
    if (date) {
      setLoading(true);
      try {
        const res = await attendanceService.getMyAttendance(date);
        setAttendanceList(res?.data ?? []);
      } catch (error) {
        console.error("Error fetching attendance:", error);
        setAttendanceList([]);
      } finally {
        setLoading(false);
      }
    } else {
      setAttendanceList([]);
    }
  };

  useEffect(() => {
    if (open) {
      fetchAttendance();
    } else {
      setAttendanceList([]);
    }
  }, [open, date]);

  const formatTime = (time?: string | null) => {
    if (!time) return "--";
    // Nếu là HH:mm:ss thì lấy HH:mm
    if (/^\d{2}:\d{2}:\d{2}$/.test(time)) return time.substring(0, 5);
    return time;
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span>Chi tiết chấm công</span>
          <Tag color={statusMap[status]?.color || "orange"}>{statusMap[status]?.text || "Chưa xác định"}</Tag>
        </div>
      }
      width={500}
      footer={null}
      closable
      maskClosable
    >
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 24, marginBottom: 8 }}>
          <div>
            <span style={{ fontWeight: 500 }}>Ngày:</span>
            <span style={{ marginLeft: 8 }}>{date ? dayjs(date).format("dddd, DD/MM/YYYY") : "--"}</span>
          </div>
        </div>
        {shift && (
          <div>
            <span style={{ fontWeight: 500 }}>Ca làm việc:</span>
            <span style={{ marginLeft: 8 }}>
              {shift.name} ({shift.time})
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <Spin size="large" />
        </div>
      ) : attendanceList.length > 0 ? (
        <div style={{ marginBottom: 16 }}>
          <span style={{ fontWeight: 500 }}>Danh sách chấm công trong ngày:</span>
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 12 }}>
            {attendanceList.map((att, idx) => (
              <div
                key={att.id || idx}
                style={{ border: "1px solid #eee", borderRadius: 6, padding: 12, background: "#fafafa" }}
              >
                <div style={{ display: "flex", gap: 24, alignItems: "center", marginBottom: 8 }}>
                  <div>
                    <span style={{ fontWeight: 500, color: "#666" }}>Giờ vào:</span>
                    <span style={{ marginLeft: 8, fontSize: 16, fontWeight: 600, color: "#1890ff" }}>
                      {formatTime(att.checkInTime)}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontWeight: 500, color: "#666" }}>Giờ ra:</span>
                    <span style={{ marginLeft: 8, fontSize: 16, fontWeight: 600, color: "#52c41a" }}>
                      {formatTime(att.checkOutTime)}
                    </span>
                  </div>
                </div>
                {att.notes && (
                  <div>
                    <span style={{ fontWeight: 500, color: "#666" }}>Ghi chú:</span>
                    <p style={{ margin: "4px 0 0 0", color: "#333" }}>{att.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <Empty description="Không có dữ liệu chấm công" style={{ marginTop: 40 }} />
      )}
    </Drawer>
  );
};

export default MyAttendanceDrawer;
