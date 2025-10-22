import SalarySetupForm from "@/components/quanlysancaulong/staffs/list-staff/salary-setup-form";
import { fileService } from "@/services/fileService";
import { StaffRequest } from "@/types-openapi/api/models/StaffRequest";
import { DeleteOutlined, LoadingOutlined, UploadOutlined } from "@ant-design/icons";
import { Avatar, Button, Col, DatePicker, Drawer, Form, Input, Row, Space, Spin, Tabs, Upload, message } from "antd";
import dayjs from "dayjs";
import React, { useState } from "react";

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
  const [salaryData, setSalaryData] = React.useState<any>({});
  const [salarySettingsLoaded, setSalarySettingsLoaded] = useState(false);
  const [form] = Form.useForm();
  const [salaryForm] = Form.useForm(); // Ensure SalarySetupForm always receives a connected form instance
  const [expanded, setExpanded] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(undefined);
  const [fileList, setFileList] = useState<any[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFileName, setAvatarFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

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
          setSalarySettingsLoaded(false);
          setTimeout(() => setSalarySettingsLoaded(true), 0);
        } catch {}
      } else {
        salaryForm.resetFields();
        setSalarySettingsLoaded(false);
      }
      if (staff.avatarUrl) {
        setAvatarPreview(staff.avatarUrl);
        setAvatarUrl(staff.avatarUrl);
        setAvatarFileName(null);
        setFileList([]);
      } else {
        setAvatarPreview(undefined);
        setAvatarUrl(null);
        setAvatarFileName(null);
        setFileList([]);
      }
    }
    if (open && !staff) {
      form.resetFields();
      salaryForm.resetFields();
      setAvatarPreview(undefined);
      setAvatarUrl(null);
      setAvatarFileName(null);
      setFileList([]);
      setSalarySettingsLoaded(false);
    }
  }, [open, staff, form, salaryForm]);

  const handleFinish = async (values: any) => {
    // Chuyển đổi ngày về kiểu Date nếu có
    if (values.dateOfBirth && values.dateOfBirth.toDate) values.dateOfBirth = values.dateOfBirth.toDate();
    if (values.dateOfJoining && values.dateOfJoining.toDate) values.dateOfJoining = values.dateOfJoining.toDate();
    if (staff && staff.id) values.id = staff.id;
    // Lấy dữ liệu lương từ form lương
    const salaryValues = await salaryForm.getFieldsValue();
    let salarySettings;
    if (salaryData.showAdvanced) {
      salarySettings = { ...salaryValues, ...salaryData };
    } else {
      salarySettings = { ...salaryValues, salaryAmount: salaryValues.salaryAmount };
    }
    values.salarySettings = JSON.stringify(salarySettings);
    // Thêm avatarUrl vào dữ liệu gửi đi
    values.avatarUrl = avatarUrl;
    onSubmit(values);
    form.resetFields();
    salaryForm.resetFields();
    setAvatarPreview(undefined);
    setAvatarUrl(null);
    setAvatarFileName(null);
    setFileList([]);
    setExpanded(false);
  };

  // Upload avatar logic
  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await fileService.uploadFile(file);
      setAvatarUrl(url.data?.publicUrl ?? null);
      setAvatarFileName(url.data?.fileName ?? null);
      setAvatarPreview(url.data?.publicUrl ?? undefined);
      message.success("Upload ảnh thành công!");
      return false; // Prevent default upload behavior
    } catch (error) {
      message.error("Upload ảnh thất bại: " + (error as Error).message);
      return false;
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      await fileService.deleteFile({ fileName: avatarFileName ?? "" });
      setAvatarUrl(null);
      setAvatarFileName(null);
      setAvatarPreview(undefined);
      message.success("Xóa ảnh thành công!");
    } catch (error) {
      message.error("Xóa ảnh thất bại: " + (error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleAvatarChange = (info: any) => {
    const file = info.file;
    if (file) {
      handleUpload(file);
    }
  };

  const renderBasicFields = () => (
    <Row gutter={24}>
      <Col span={8} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <Space direction="vertical" align="center" style={{ width: "100%" }}>
          {avatarUrl ? (
            <Space direction="vertical" align="center">
              <Avatar src={avatarUrl} size={120} style={{ background: "#f0f0f0", marginBottom: 8 }} icon={!avatarUrl && <UploadOutlined />} />
              <Button type="text" danger icon={<DeleteOutlined />} onClick={handleRemoveAvatar} loading={uploading}>
                Xóa ảnh
              </Button>
            </Space>
          ) : uploading ? (
            <div className="flex h-[120px] w-[120px] items-center justify-center border border-gray-300">
              <Spin indicator={<LoadingOutlined spin />} />
            </div>
          ) : (
            <Upload beforeUpload={handleUpload} showUploadList={false} accept="image/*" disabled={uploading}>
              <Button icon={<UploadOutlined />} loading={uploading}>
                {uploading ? "Đang upload..." : "Chọn ảnh đại diện"}
              </Button>
            </Upload>
          )}
          <div style={{ fontSize: "12px", color: "#666" }}>Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WebP). Kích thước tối đa 100MB.</div>
        </Space>
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
      title={staff && staff.id ? "Cập nhật nhân viên" : "Thêm mới nhân viên"}
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
            children: salaryForm ? <SalarySetupForm form={salaryForm} onSalaryDataChange={setSalaryData} staff={staff} /> : null,
          },
        ]}
      />
    </Drawer>
  );
};

export default StaffModal;
