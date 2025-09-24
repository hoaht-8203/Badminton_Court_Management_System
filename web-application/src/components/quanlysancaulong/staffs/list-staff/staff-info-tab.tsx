import React from "react";
import { Avatar } from "antd";
import { StaffResponse } from "@/types-openapi/api";
import dayjs from "dayjs";

const StaffInfoTab = ({ staff }: { staff: StaffResponse }) => (
  <div style={{ display: "flex" }}>
    <div style={{ width: 120 }}>
      <Avatar size={100} src={staff.avatarUrl ? staff.avatarUrl : null} />
    </div>
    <div style={{ flex: 1, display: "flex" }}>
      <div style={{ flex: 1 }}>
        <div>Mã nhân viên: NV{staff.id}</div>
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
);

export default StaffInfoTab;
