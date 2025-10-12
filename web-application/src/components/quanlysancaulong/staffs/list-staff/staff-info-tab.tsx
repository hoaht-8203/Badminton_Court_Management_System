import React, { useState } from "react";
import { Avatar, Button, Divider, Row, Col } from "antd";
import { EditOutlined, StopOutlined, CheckOutlined } from "@ant-design/icons";
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
    <div style={{ padding: 24 }}>
      <Row gutter={16} align="middle">
        <Col span={4} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Avatar size={100} src={staff.avatarUrl ? staff.avatarUrl : null} style={{ border: '1px solid #e0e0e0', marginBottom: 12 }} />
          <div style={{ fontWeight: 600, fontSize: 16 }}>{staff.fullName}</div>
        </Col>
        <Col span={8}>
          <div style={{ marginBottom: 8 }}><span style={{ fontWeight: 500 }}>Mã nhân viên:</span> <span>{`NV${String(staff.id).padStart(6, "0")}`}</span></div>
          <Divider style={{ margin: '8px 0' }} />
          <div style={{ marginBottom: 8 }}><span style={{ fontWeight: 500 }}>Ngày sinh:</span> <span>{staff.dateOfBirth ? dayjs(staff.dateOfBirth).format("DD/MM/YYYY") : "-"}</span></div>
          <Divider style={{ margin: '8px 0' }} />
          <div style={{ marginBottom: 8 }}><span style={{ fontWeight: 500 }}>Số CMND/CCCD:</span> <span>{staff.identificationNumber}</span></div>
        </Col>
        <Col span={8}>
          <div style={{ marginBottom: 8 }}><span style={{ fontWeight: 500 }}>Ngày bắt đầu làm việc:</span> <span>{staff.dateOfJoining ? dayjs(staff.dateOfJoining).format("DD/MM/YYYY") : "-"}</span></div>
          <Divider style={{ margin: '8px 0' }} />
          <div style={{ marginBottom: 8 }}><span style={{ fontWeight: 500 }}>Số điện thoại:</span> <span>{staff.phoneNumber}</span></div>
          <Divider style={{ margin: '8px 0' }} />
          <div style={{ marginBottom: 8 }}><span style={{ fontWeight: 500 }}>Địa chỉ:</span> <span>{staff.address}</span></div>
        </Col>
        <Col span={4}>
          <div style={{ fontWeight: 500 }}>Ghi chú:</div>
          <div style={{ color: '#888' }}>...</div>
        </Col>
      </Row>
      <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
        <Button type="primary" icon={<EditOutlined />} style={{ background: '#1677ff', borderColor: '#1677ff' }} onClick={() => onEditStaff && onEditStaff(staff)}>
          Cập nhật thông tin
        </Button>
        {isActive ? (
          <Button
            type="primary"
            danger
            icon={<StopOutlined />}
            style={{ background: '#ff4d4f', borderColor: '#ff4d4f' }}
            onClick={handleToggleStatus}
          >
            Ngừng làm việc
          </Button>
        ) : (
          <Button
            type="primary"
            icon={<CheckOutlined />}
            style={{ background: '#52c41a', borderColor: '#52c41a' }}
            onClick={handleToggleStatus}
          >
            Bắt đầu làm việc
          </Button>
        )}
      </div>
    </div>
  );
};

export default StaffInfoTab;
