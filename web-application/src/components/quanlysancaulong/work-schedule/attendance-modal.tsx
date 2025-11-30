import React, { useEffect, useState } from "react";
import { Drawer, Button, Input, Tag, message, Modal } from "antd";
import dayjs from "dayjs";
import { attendanceService } from "@/services/attendanceService";

interface AttendanceModalProps {
  open: boolean;
  onClose: () => void;
  onSave?: () => void;
  staff?: { id: number; fullName: string };
  shift?: { id: number; name: string; time: string; startTime?: string; endTime?: string };
  date?: string; // YYYY-MM-DD
  status?: "Attended" | "Absent" | "NotYet";
}

const statusMap = {
  NotYet: { color: "#faad14", text: "Chưa diễn ra" },
  Attended: { color: "#1890ff", text: "Đã chấm công" },
  Late: { color: "#9254de", text: "Đi muộn / Về sớm" },
  Missing: { color: "#bfbfbf", text: "Chấm công thiếu" },
  Absent: { color: "#ff4d4f", text: "Nghỉ làm" },
} as const;

const AttendanceDrawer: React.FC<AttendanceModalProps> = ({ open, onClose, onSave, staff, shift, date, status = "NotYet" }) => {
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Kiểm tra xem ngày có phải là tương lai không (so với ngày hiện tại, bỏ qua giờ)
  const isFutureDate = (dateStr?: string): boolean => {
    if (!dateStr) return false;
    const today = dayjs().startOf("day");
    const targetDate = dayjs(dateStr).startOf("day");
    return targetDate.isAfter(today);
  };

  // Hàm xác nhận khi thao tác với ngày trong tương lai
  const confirmFutureDateAction = (action: () => void | Promise<void>, actionName: string): void => {
    if (isFutureDate(date)) {
      Modal.confirm({
        title: "Cảnh báo",
        content: `Bạn đang ${actionName} chấm công cho một ngày trong tương lai. Trạng thái chấm công sẽ được cập nhật tự động khi ca làm việc kết thúc. Bạn có chắc chắn muốn tiếp tục?`,
        okText: "Xác nhận",
        cancelText: "Hủy",
        onOk: async () => {
          const result = action();
          if (result instanceof Promise) {
            await result;
          }
        },
      });
    } else {
      const result = action();
      if (result instanceof Promise) {
        result.catch((error) => {
          console.error("Error in action:", error);
        });
      }
    }
  };

  const fetchAttendance = async () => {
    if (staff?.id && date) {
      setLoading(true);
      const res = await attendanceService.getAttendanceRecordsByStaffId(staff.id, date);
      setAttendanceList(res?.data ?? []);
      setLoading(false);
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
  }, [open, staff?.id, date]);

  const handleChange = (idx: number, field: string, value: any) => {
    const newList = [...attendanceList];
    newList[idx] = { ...newList[idx], [field]: value, _changed: true };
    setAttendanceList(newList);
  };

  const formatTime = (t?: string) => {
    if (!t) return "";
    // Nếu là HH:mm thì thêm :00
    if (/^\d{2}:\d{2}$/.test(t)) return t + ":00";
    // Nếu đã là HH:mm:ss thì giữ nguyên
    if (/^\d{2}:\d{2}:\d{2}$/.test(t)) return t;
    return t; // fallback
  };

  const handleSave = async (idx: number) => {
    const att = attendanceList[idx];
    const saveAction = async () => {
      setLoading(true);
      const payload: any = {
        id: att.id,
        staffId: staff?.id,
        date: date ? new Date(date) : undefined,
        notes: att.notes,
      };
      const checkIn = formatTime(att.checkInTime);
      if (checkIn) payload.checkInTime = checkIn;
      const checkOut = formatTime(att.checkOutTime);
      if (checkOut) payload.checkOutTime = checkOut;
      if (att.id) {
        await attendanceService.updateAttendance(payload); // update
        message.success("Đã cập nhật chấm công!");
      } else {
        await attendanceService.createAttendance({ ...payload, id: undefined }); // create
        message.success("Đã thêm chấm công!");
      }
      await fetchAttendance();
      setLoading(false);
      if (onSave) onSave();
    };

    const actionName = att.id ? "cập nhật" : "thêm";
    confirmFutureDateAction(saveAction, actionName);
  };

  const handleDelete = async (idx: number) => {
    const att = attendanceList[idx];
    const deleteAction = async () => {
      if (att.id) {
        await attendanceService.deleteAttendanceRecord(att.id);
        message.success("Đã xoá chấm công!");
        await fetchAttendance();
        if (onSave) onSave();
      } else {
        const newList = attendanceList.filter((_, i) => i !== idx);
        setAttendanceList(newList);
      }
    };

    confirmFutureDateAction(deleteAction, "xóa");
  };

  const handleAdd = () => {
    const addAction = () => {
      setAttendanceList([
        ...attendanceList,
        {
          checkInTime: "",
          checkOutTime: "",
          notes: "",
        },
      ]);
    };

    confirmFutureDateAction(addAction, "thêm");
  };

  const handleQuickCheckIn = async () => {
    if (!shift?.startTime || !shift?.endTime) {
      message.warning("Ca làm việc chưa có thông tin thời gian bắt đầu và kết thúc");
      return;
    }
    if (!staff?.id || !date) {
      message.warning("Thiếu thông tin nhân viên hoặc ngày");
      return;
    }

    const quickCheckInAction = async () => {
      setLoading(true);
      try {
        // Format thời gian từ shift (HH:mm:ss) sang HH:mm cho input time
        const startTimeFormatted = shift.startTime?.substring(0, 5) || ""; // HH:mm
        const endTimeFormatted = shift.endTime?.substring(0, 5) || ""; // HH:mm

        const payload: any = {
          staffId: staff.id,
          date: new Date(date),
          checkInTime: formatTime(startTimeFormatted),
          checkOutTime: formatTime(endTimeFormatted),
          notes: "",
        };

        await attendanceService.createAttendance({ ...payload, id: undefined });
        message.success("Đã chấm công thành công!");
        await fetchAttendance();
        if (onSave) onSave();
      } catch (error: any) {
        message.error(error?.message || "Có lỗi xảy ra khi chấm công");
      } finally {
        setLoading(false);
      }
    };

    confirmFutureDateAction(quickCheckInAction, "chấm công tự động");
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span>Chấm công</span>
          {staff?.fullName && <Tag color="blue">{staff.fullName}</Tag>}
          <Tag color={statusMap[status]?.color || "orange"}>{statusMap[status]?.text || "Chưa chấm công"}</Tag>
        </div>
      }
      width={600}
      footer={null}
      closable
      maskClosable
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
      </div>
      {attendanceList.length > 0 ? (
        <div style={{ marginBottom: 16 }}>
          <span style={{ fontWeight: 500 }}>Danh sách chấm công trong ngày:</span>
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 12 }}>
            {attendanceList.map((att, idx) => (
              <div
                key={att.id ? `id-${att.id}` : `new-${idx}`}
                style={{ border: "1px solid #eee", borderRadius: 6, padding: 12, background: "#fafafa", position: "relative" }}
              >
                <div style={{ display: "flex", gap: 24, alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontWeight: 500 }}>Giờ vào:</span>
                  <Input
                    type="time"
                    value={att.checkInTime ?? undefined}
                    onChange={(e) => handleChange(idx, "checkInTime", e.target.value)}
                    style={{ width: 120 }}
                  />
                  <span style={{ fontWeight: 500 }}>Giờ ra:</span>
                  <Input
                    type="time"
                    value={att.checkOutTime ?? undefined}
                    onChange={(e) => handleChange(idx, "checkOutTime", e.target.value)}
                    style={{ width: 120 }}
                  />
                </div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ fontWeight: 500 }}>Ghi chú:</span>
                  <Input.TextArea
                    value={att.notes ?? ""}
                    onChange={(e) => handleChange(idx, "notes", e.target.value)}
                    rows={2}
                    style={{ marginTop: 4 }}
                  />
                </div>
                <div style={{ display: "flex", gap: 8, position: "absolute", top: 12, right: 12 }}>
                  {att._changed && (
                    <Button type="primary" ghost size="small" loading={loading} onClick={() => handleSave(idx)}>
                      Lưu
                    </Button>
                  )}
                  <Button danger ghost size="small" onClick={() => handleDelete(idx)}>
                    Xoá
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ color: "#888", textAlign: "center", padding: "32px 0" }}>Không có bản ghi chấm công nào trong ngày này.</div>
      )}
      <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 24 }}>
        {shift?.startTime && shift?.endTime && (
          <Button type="primary" loading={loading} onClick={handleQuickCheckIn} style={{ minWidth: 180 }}>
            Chấm công nhanh ({shift.startTime?.substring(0, 5)} - {shift.endTime?.substring(0, 5)})
          </Button>
        )}
        <Button
          type="dashed"
          style={{ borderStyle: "dashed", background: "transparent", color: "#1890ff", borderColor: "#1890ff" }}
          onClick={handleAdd}
        >
          + Thêm dữ liệu chấm công
        </Button>
      </div>
    </Drawer>
  );
};

export default AttendanceDrawer;
