import { StaffRequest } from "@/types-openapi/api/models/StaffRequest";
import { UploadOutlined } from "@ant-design/icons";
import { Avatar, Button, Col, DatePicker, Drawer, Form, Input, Row, Space, Tabs, Upload } from "antd";
import dayjs from "dayjs";
import React, { useState } from "react";
import SalarySetupForm from "@/components/quanlysancaulong/staffs/list-staff/salary-setup-form";

interface StaffModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: StaffRequest) => void;
  staff?: Partial<StaffRequest & { id?: number }>;
}

const initialFields = ["fullName", "phoneNumber", "avatarUrl"];
const allFields = [
  { name: "fullName", label: "Tên nhân viên", required: true, type: "text" },
  { name: "phoneNumber", label: "Số điện thoại", required: true, type: "text" },
  { name: "identificationNumber", label: "CMND/CCCD", type: "text" },
  //   { name: "branchId", label: "Chi nhánh", type: "number" },
  { name: "dateOfBirth", label: "Ngày sinh", type: "date" },
  { name: "dateOfJoining", label: "Ngày vào làm", type: "date" },
  { name: "address", label: "Địa chỉ", type: "text" },
];

const StaffModal: React.FC<StaffModalProps> = ({ open, onClose, onSubmit, staff }) => {
  const [form] = Form.useForm();
    const [salaryForm] = Form.useForm(); // Ensure SalarySetupForm always receives a connected form instance
  const [expanded, setExpanded] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(undefined);
  const [fileList, setFileList] = useState<any[]>([]);

  // Fill form when staff changes (edit mode)
  React.useEffect(() => {
    if (open && staff) {
      form.setFieldsValue({
        ...staff,
        dateOfBirth: staff.dateOfBirth ? (typeof staff.dateOfBirth === "string" ? dayjs(staff.dateOfBirth) : staff.dateOfBirth) : undefined,
        dateOfJoining: staff.dateOfJoining ? (typeof staff.dateOfJoining === "string" ? dayjs(staff.dateOfJoining) : staff.dateOfJoining) : undefined,
      });
      // Fill salary form nếu có dữ liệu
      if (staff.salarySettings) {
        try {
          const salaryObj = JSON.parse(staff.salarySettings);
          salaryForm.setFieldsValue(salaryObj);
        } catch {}
      } else {
        salaryForm.resetFields();
      }
      if (staff.avatarUrl) {
        setAvatarPreview(staff.avatarUrl);
        setFileList([]);
      } else {
        setAvatarPreview(undefined);
        setFileList([]);
      }
    }
    if (open && !staff) {
      form.resetFields();
      salaryForm.resetFields();
      setAvatarPreview(undefined);
      setFileList([]);
    }
  }, [open, staff, form, salaryForm]);

  const handleFinish = async (values: any) => {
    // Chuyển đổi ngày về kiểu Date nếu có
    if (values.dateOfBirth && values.dateOfBirth.toDate) values.dateOfBirth = values.dateOfBirth.toDate();
    if (values.dateOfJoining && values.dateOfJoining.toDate) values.dateOfJoining = values.dateOfJoining.toDate();
    if (staff && staff.id) values.id = staff.id;
    // Lấy dữ liệu lương từ form lương
    const salaryValues = await salaryForm.getFieldsValue();
    values.salarySettings = JSON.stringify(salaryValues);
    onSubmit(values);
    form.resetFields();
    salaryForm.resetFields();
    setAvatarPreview(undefined);
    setFileList([]);
    setExpanded(false);
  };

  const handleAvatarChange = (info: any) => {
    setFileList(info.fileList);
    const file = info.fileList[0]?.originFileObj;
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
        form.setFieldsValue({ avatarUrl: e.target?.result });
      };
      reader.readAsDataURL(file);
    } else {
      setAvatarPreview(undefined);
      form.setFieldsValue({ avatarUrl: undefined });
    }
  };

  const renderBasicFields = () => (
    <Row gutter={24}>
      <Col span={8} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <Space direction="vertical" align="center" style={{ width: "100%" }}>
          <Avatar src={avatarPreview} size={120} style={{ background: "#f0f0f0", marginBottom: 8 }} icon={!avatarPreview && <UploadOutlined />} />
        </Space>
        <Form.Item name="avatarUrl" style={{ marginBottom: 0 }}>
          <Upload showUploadList={false} beforeUpload={() => false} accept="image/*" onChange={handleAvatarChange} fileList={fileList}>
            <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
          </Upload>
        </Form.Item>
      </Col>
      <Col span={16}>
        <Form.Item label="Tên nhân viên" name="fullName" rules={[{ required: true, message: "Vui lòng nhập tên nhân viên" }]}>
          <Input />
        </Form.Item>

        <Form.Item label="Số điện thoại" name="phoneNumber" rules={[{ required: true, message: "Vui lòng nhập số điện thoại" }]}>
          <Input />
        </Form.Item>
      </Col>
    </Row>
  );

  const renderExtraFields = () => (
    <Row gutter={16}>
      {allFields
        .filter((f) => !initialFields.includes(f.name))
        .map((field) => (
          <Col span={12} key={field.name}>
            <Form.Item
              label={field.label}
              name={field.name}
              rules={field.required ? [{ required: true, message: `Vui lòng nhập ${field.label}` }] : []}
            >
              {field.type === "date" ? (
                <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
              ) : field.type === "number" ? (
                <Input type="number" />
              ) : (
                <Input />
              )}
            </Form.Item>
          </Col>
        ))}
    </Row>
  );

  return (
    <Drawer
      open={open}
      title="Thêm mới nhân viên"
      onClose={onClose}
      width={900}
      destroyOnClose
      footer={null}
      extra={
        <Space>
          <Button onClick={onClose}>Bỏ qua</Button>
          <Button type="primary" onClick={() => form.submit()}>
            Lưu
          </Button>
        </Space>
      }
    >
          <Tabs
            defaultActiveKey="info"
            items={[
              {
                key: "info",
                label: "Thông tin",
                children: (
                  <Form form={form} layout="vertical" onFinish={handleFinish}>
                    {renderBasicFields()}
                    <div style={{ margin: "16px 0" }}>
                      <Button type="dashed" onClick={() => setExpanded((e) => !e)}>
                        {expanded ? "Ẩn thông tin" : "Thêm thông tin"}
                      </Button>
                    </div>
                    {expanded && <div style={{ marginBottom: 16 }}>{renderExtraFields()}</div>}
                  </Form>
                ),
              },
              {
                key: "salary",
                label: "Thiết lập lương",
                children: <SalarySetupForm form={salaryForm} />, // Ensure SalarySetupForm always receives a connected form instance
              },
            ]}
          />
    </Drawer>
  );
};

export default StaffModal;
