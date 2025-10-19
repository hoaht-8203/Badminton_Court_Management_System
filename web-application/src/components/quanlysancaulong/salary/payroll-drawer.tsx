import React from "react";
import { Drawer, Button, Form, Input, DatePicker, message } from "antd";
import dayjs from "dayjs";
import { useCreatePayroll } from "@/hooks/usePayroll";
import type { CreatePayrollRequest } from "@/types-openapi/api";

export default function PayrollDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form] = Form.useForm<CreatePayrollRequest>();
  const createMutation = useCreatePayroll();

  const handleFinish = async (values: any) => {
    const payload: CreatePayrollRequest = {
      name: values.name,
      startDate: dayjs(values.startDate).toISOString().slice(0, 10),
      endDate: dayjs(values.endDate).toISOString().slice(0, 10),
      note: values.note ?? undefined,
    } as any;

    try {
      await createMutation.mutateAsync(payload);
      message.success("Tạo bảng lương thành công");
      form.resetFields();
      onClose();
    } catch (err) {
      console.error(err);
      message.error("Có lỗi khi tạo bảng lương");
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={520}
      title={
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>Thêm bảng lương</div>
          <div>
            <Button onClick={onClose} style={{ marginRight: 8 }}>
              Huỷ
            </Button>
            <Button type="primary" onClick={() => form.submit()} loading={createMutation.status === "pending"}>
              Tạo
            </Button>
          </div>
        </div>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} initialValues={{}}>
        <Form.Item name="name" label="Tên bảng lương" rules={[{ required: true, message: "Vui lòng nhập tên" }]}>
          <Input />
        </Form.Item>

        <Form.Item name="startDate" label="Ngày bắt đầu" rules={[{ required: true, message: "Chọn ngày bắt đầu" }]}>
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item name="endDate" label="Ngày kết thúc" rules={[{ required: true, message: "Chọn ngày kết thúc" }]}>
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item name="note" label="Ghi chú">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
