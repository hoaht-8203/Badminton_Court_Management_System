"use client";

import { useCreateVoucher } from "@/hooks/useVouchers";
import { ApiError } from "@/lib/axios";
import { CreateVoucherRequest } from "@/types-openapi/api";
import { CloseOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, DatePicker, Divider, Drawer, Form, FormProps, Input, InputNumber, Select, Space, Switch, message } from "antd";
import FormItem from "antd/es/form/FormItem";
import dayjs from "dayjs";

interface CreateVoucherDrawerProps {
  open: boolean;
  onClose: () => void;
}

const CreateVoucherDrawer = ({ open, onClose }: CreateVoucherDrawerProps) => {
  const [form] = Form.useForm<CreateVoucherRequest>();
  const createMutation = useCreateVoucher();

  const handleSubmit: FormProps<CreateVoucherRequest>["onFinish"] = (values) => {
    // Convert dayjs to ISO string
    const payload: CreateVoucherRequest = {
      ...values,
      startAt: values.startAt ? dayjs(values.startAt).toDate() : undefined,
      endAt: values.endAt ? dayjs(values.endAt).toDate() : undefined,
      timeRules: values.timeRules?.map((rule: any) => ({
        ...rule,
        specificDate: rule.specificDate ? dayjs(rule.specificDate).toDate() : undefined,
        startTime: rule.startTime ? `${rule.startTime}:00` : undefined,
        endTime: rule.endTime ? `${rule.endTime}:00` : undefined,
      })),
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        message.success("Tạo voucher thành công!");
        form.resetFields();
        onClose();
      },
      onError: (error: ApiError) => {
        message.error(error.message);
      },
    });
  };

  return (
    <Drawer
      title="Thêm voucher"
      closable={true}
      closeIcon={<CloseOutlined aria-label="Close Button" />}
      onClose={() => {
        form.resetFields();
        onClose();
      }}
      open={open}
      width={700}
      extra={
        <Space>
          <Button
            onClick={() => {
              form.resetFields();
              onClose();
            }}
            icon={<CloseOutlined />}
          >
            Hủy
          </Button>
          <Button type="primary" icon={<PlusOutlined />} loading={createMutation.status === "pending"} onClick={() => form.submit()}>
            Thêm voucher
          </Button>
        </Space>
      }
    >
      <Form form={form} onFinish={handleSubmit} layout="vertical" initialValues={{ discountType: "fixed", isActive: true }}>
        <FormItem<CreateVoucherRequest> name="code" label="Mã voucher" rules={[{ required: true, message: "Mã voucher là bắt buộc" }]}>
          <Input placeholder="Nhập mã voucher" />
        </FormItem>

        <FormItem<CreateVoucherRequest> name="title" label="Tiêu đề" rules={[{ required: true, message: "Tiêu đề là bắt buộc" }]}>
          <Input placeholder="Nhập tiêu đề" />
        </FormItem>

        <FormItem<CreateVoucherRequest> name="description" label="Mô tả">
          <Input.TextArea rows={3} placeholder="Nhập mô tả" />
        </FormItem>

        <FormItem<CreateVoucherRequest> name="discountType" label="Loại giảm giá" rules={[{ required: true }]}>
          <Select
            options={[
              { value: "fixed", label: "Giảm giá cố định" },
              { value: "percentage", label: "Giảm giá phần trăm" },
            ]}
          />
        </FormItem>

        <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.discountType !== currentValues.discountType}>
          {({ getFieldValue }) => {
            const discountType = getFieldValue("discountType");
            return (
              <>
                {discountType === "percentage" ? (
                  <>
                    <FormItem<CreateVoucherRequest> name="discountPercentage" label="% Giảm giá" rules={[{ required: true }]}>
                      <InputNumber min={0} max={100} style={{ width: "100%" }} placeholder="Nhập % giảm" />
                    </FormItem>
                    <FormItem<CreateVoucherRequest> name="maxDiscountValue" label="Giá trị giảm tối đa (VNĐ)">
                      <InputNumber min={0} style={{ width: "100%" }} placeholder="Nhập giá trị tối đa" />
                    </FormItem>
                  </>
                ) : (
                  <FormItem<CreateVoucherRequest> name="discountValue" label="Giá trị giảm (VNĐ)" rules={[{ required: true }]}>
                    <InputNumber min={0} style={{ width: "100%" }} placeholder="Nhập giá trị giảm" />
                  </FormItem>
                )}
              </>
            );
          }}
        </Form.Item>

        <FormItem<CreateVoucherRequest> name="minOrderValue" label="Đơn hàng tối thiểu (VNĐ)">
          <InputNumber min={0} style={{ width: "100%" }} placeholder="Nhập giá trị tối thiểu" />
        </FormItem>

        <FormItem<CreateVoucherRequest> name="startAt" label="Ngày bắt đầu" rules={[{ required: true }]}>
          <DatePicker showTime style={{ width: "100%" }} format="DD/MM/YYYY HH:mm" />
        </FormItem>

        <FormItem<CreateVoucherRequest> name="endAt" label="Ngày kết thúc" rules={[{ required: true }]}>
          <DatePicker showTime style={{ width: "100%" }} format="DD/MM/YYYY HH:mm" />
        </FormItem>

        <FormItem<CreateVoucherRequest> name="usageLimitTotal" label="Giới hạn sử dụng tổng" initialValue={0}>
          <InputNumber min={0} style={{ width: "100%" }} placeholder="0 = không giới hạn" />
        </FormItem>

        <FormItem<CreateVoucherRequest> name="usageLimitPerUser" label="Giới hạn sử dụng mỗi user" initialValue={1}>
          <InputNumber min={0} style={{ width: "100%" }} />
        </FormItem>

        <FormItem<CreateVoucherRequest> name="isActive" label="Trạng thái" valuePropName="checked">
          <Switch checkedChildren="Hoạt động" unCheckedChildren="Không hoạt động" />
        </FormItem>

        <Divider>Quy tắc thời gian (Tùy chọn)</Divider>
        <Form.List name="timeRules">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <div key={key} style={{ border: "1px solid #d9d9d9", padding: 16, marginBottom: 16, borderRadius: 4 }}>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <FormItem {...restField} name={[name, "dayOfWeek"]} label="Thứ trong tuần">
                      <Select
                        allowClear
                        placeholder="Chọn thứ"
                        options={[
                          { value: 0, label: "Chủ nhật" },
                          { value: 1, label: "Thứ 2" },
                          { value: 2, label: "Thứ 3" },
                          { value: 3, label: "Thứ 4" },
                          { value: 4, label: "Thứ 5" },
                          { value: 5, label: "Thứ 6" },
                          { value: 6, label: "Thứ 7" },
                        ]}
                      />
                    </FormItem>
                    <FormItem {...restField} name={[name, "specificDate"]} label="Ngày cụ thể">
                      <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
                    </FormItem>
                    <FormItem {...restField} name={[name, "startTime"]} label="Giờ bắt đầu (HH:mm)">
                      <Input placeholder="09:00" />
                    </FormItem>
                    <FormItem {...restField} name={[name, "endTime"]} label="Giờ kết thúc (HH:mm)">
                      <Input placeholder="18:00" />
                    </FormItem>
                    <Button type="link" danger onClick={() => remove(name)}>
                      Xóa quy tắc
                    </Button>
                  </Space>
                </div>
              ))}
              <Button type="dashed" onClick={() => add()} block>
                + Thêm quy tắc thời gian
              </Button>
            </>
          )}
        </Form.List>

        <Divider>Quy tắc người dùng (Tùy chọn)</Divider>
        <Form.List name="userRules">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <div key={key} style={{ border: "1px solid #d9d9d9", padding: 16, marginBottom: 16, borderRadius: 4 }}>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <FormItem {...restField} name={[name, "isNewCustomer"]} label="Khách hàng mới">
                      <Select
                        allowClear
                        placeholder="Chọn loại"
                        options={[
                          { value: true, label: "Chỉ khách hàng mới" },
                          { value: false, label: "Chỉ khách hàng cũ" },
                        ]}
                      />
                    </FormItem>
                    <FormItem {...restField} name={[name, "userType"]} label="Loại người dùng">
                      <Input placeholder="Nhập loại người dùng" />
                    </FormItem>
                    <Button type="link" danger onClick={() => remove(name)}>
                      Xóa quy tắc
                    </Button>
                  </Space>
                </div>
              ))}
              <Button type="dashed" onClick={() => add()} block>
                + Thêm quy tắc người dùng
              </Button>
            </>
          )}
        </Form.List>
      </Form>
    </Drawer>
  );
};

export default CreateVoucherDrawer;
