import React, { useState } from "react";
import { Avatar, Button } from "antd";
import { StaffResponse } from "@/types-openapi/api";
import dayjs from "dayjs";

const StaffInfoTab = ({
  staff,
  onEditStaff,
  onChangeStaffStatus,
}: {
  staff: StaffResponse;
  onEditStaff?: (staff: StaffResponse) => void;
  onChangeStaffStatus?: (staffId: number, isActive: boolean) => void;
}) => {
  const [isActive, setIsActive] = useState(staff.isActive !== false);
  const [confirming, setConfirming] = useState(false);

  const handleToggleStatus = async () => {
    if (!confirming) {
      if (window.confirm(isActive ? "Bạn có chắc muốn ngừng làm việc nhân viên này?" : "Bạn có chắc muốn bắt đầu làm việc lại cho nhân viên này?")) {
        setIsActive(!isActive);
        setConfirming(true);
        if (onChangeStaffStatus && typeof staff.id === "number") {
          await onChangeStaffStatus(staff.id, !isActive);
        }
        setTimeout(() => setConfirming(false), 1000);
      }
    }
  };

  return (
    <>
      <div style={{ display: "flex" }}>
        <div style={{ width: 120 }}>
          <Avatar size={100} src={staff.avatarUrl ? staff.avatarUrl : null} />
        </div>
        <div style={{ flex: 1, display: "flex" }}>
          <div style={{ flex: 1 }}>
            <div>Mã nhân viên: {`NV${String(staff.id).padStart(6, "0")}`}</div>
            <div>Tên nhân viên: {staff.fullName}</div>
            {/* <div>Mã chấm công: {staff.attendanceCode}</div> */}
            <div>Ngày sinh: {staff.dateOfBirth ? dayjs(staff.dateOfBirth).format("DD/MM/YYYY") : ""}</div>
            {/* <div>Giới tính: {staff.gender}</div> */}
            <div>Số CMND/CCCD: {staff.identificationNumber}</div>
            {/* <div>Phòng ban: {staff.department}</div>
          <div>Chức danh: {staff.position}</div> */}
          </div>
          <div style={{ flex: 1 }}>
            <div>Ngày bắt đầu làm việc: {staff.dateOfJoining ? dayjs(staff.dateOfJoining).format("DD/MM/YYYY") : ""}</div>
            {/* <div>Chi nhánh làm việc: {staff.workBranch}</div> */}
            <div>Số điện thoại: {staff.phoneNumber}</div>
            {/* <div>Email: {staff.email}</div> */}
            <div>Địa chỉ: {staff.address}</div>
          </div>
          <div style={{ flex: 0.5, paddingLeft: 16 }}>
            <div>Ghi chú...</div>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        {/* <Button type="primary">Lấy mã xác nhận</Button> */}
        <Button type="primary" style={{ background: "#52c41a" }} onClick={() => onEditStaff && onEditStaff(staff)}>
          Cập nhật
        </Button>
        <Button
          type={isActive ? "default" : "primary"}
          style={isActive ? { background: "#ff4d4f", color: "#fff" } : { background: "#52c41a", color: "#fff" }}
          onClick={handleToggleStatus}
        >
          {isActive ? "Ngừng làm việc" : "Bắt đầu làm việc"}
        </Button>
      </div>
    </>
  );
};

export default StaffInfoTab;
