import React from "react";
import { Avatar } from "antd";

const StaffInfoTab = ({ staff }: { staff: any }) => (
  <div style={{ display: "flex" }}>
    <div style={{ width: 120 }}>
      <Avatar size={100} src={staff.avatar ? staff.avatar : null} />
    </div>
    <div style={{ flex: 1, display: "flex" }}>
      <div style={{ flex: 1 }}>
        <div>Mã nhân viên: NV{staff.id}</div>
        <div>Tên nhân viên: {staff.fullName}</div>
        <div>Mã chấm công: {staff.attendanceCode}</div>
        <div>Ngày sinh: {staff.birthDate}</div>
        <div>Giới tính: {staff.gender}</div>
        <div>Số CMND/CCCD: {staff.identificationNumber}</div>
        <div>Phòng ban: {staff.department}</div>
        <div>Chức danh: {staff.position}</div>
      </div>
      <div style={{ flex: 1 }}>
        <div>Ngày bắt đầu làm việc: {staff.startDate}</div>
        <div>Chi nhánh trả lương: {staff.branch}</div>
        <div>Chi nhánh làm việc: {staff.workBranch}</div>
        <div>Tài khoản KiotViet: {staff.kiotviet}</div>
        <div>Số điện thoại: {staff.phoneNumber}</div>
        <div>Email: {staff.email}</div>
        <div>Facebook: {staff.facebook}</div>
        <div>Địa chỉ: {staff.address}</div>
        <div>Thiết bị di động: {staff.mobileDevice}</div>
      </div>
      <div style={{ flex: 0.5, paddingLeft: 16 }}>
        <div>Ghi chú...</div>
      </div>
    </div>
  </div>
);

export default StaffInfoTab;
