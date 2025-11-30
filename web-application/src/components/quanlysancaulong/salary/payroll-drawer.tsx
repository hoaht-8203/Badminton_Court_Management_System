import React from "react";
import { Drawer, Button, Form, Input, DatePicker, message } from "antd";
import dayjs from "dayjs";
import { useCreatePayroll } from "@/hooks/usePayroll";
import type { CreatePayrollRequest } from "@/types-openapi/api";
import { ApiError } from "@/lib/axios";

export default function PayrollDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form] = Form.useForm<CreatePayrollRequest>();
  const createMutation = useCreatePayroll();

  const handleFinish = async (values: any) => {
    const payload: CreatePayrollRequest = {
      name: values.name,
      startDate: dayjs(values.startDate).format("YYYY-MM-DD"),
      endDate: dayjs(values.endDate).format("YYYY-MM-DD"),
      note: values.note ?? undefined,
    } as any;

    try {
      await createMutation.mutateAsync(payload);
      message.success("Tạo bảng lương thành công");
      form.resetFields();
      onClose();
    } catch (err: any) {
      const apiError = err as ApiError;
      if (apiError?.errors) {
        for (const key in apiError.errors) {
          message.error(apiError.errors[key]);
        }
      } else if (apiError?.message) {
        message.error(apiError.message);
      } else {
        message.error("Có lỗi khi tạo bảng lương");
      }
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

        <Form.Item
          name="startDate"
          label="Ngày bắt đầu"
          rules={[
            { required: true, message: "Chọn ngày bắt đầu" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                const endDate = getFieldValue("endDate");
                if (!value || !endDate) {
                  return Promise.resolve();
                }
                if (dayjs(value).isAfter(dayjs(endDate), "day")) {
                  return Promise.reject(new Error("Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc"));
                }
                return Promise.resolve();
              },
            }),
          ]}
          dependencies={["endDate"]}
        >
          <DatePicker
            style={{ width: "100%" }}
            disabledDate={(current) => {
              const endDate = form.getFieldValue("endDate");
              if (!endDate) return false;
              return current && current.isAfter(dayjs(endDate), "day");
            }}
          />
        </Form.Item>

        <Form.Item
          name="endDate"
          label="Ngày kết thúc"
          rules={[
            { required: true, message: "Chọn ngày kết thúc" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                const startDate = getFieldValue("startDate");
                if (!value || !startDate) {
                  return Promise.resolve();
                }
                if (dayjs(value).isBefore(dayjs(startDate), "day")) {
                  return Promise.reject(new Error("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu"));
                }
                return Promise.resolve();
              },
            }),
          ]}
          dependencies={["startDate"]}
        >
          <DatePicker
            style={{ width: "100%" }}
            disabledDate={(current) => {
              const startDate = form.getFieldValue("startDate");
              if (!startDate) return false;
              return current && current.isBefore(dayjs(startDate), "day");
            }}
          />
        </Form.Item>

        <Form.Item name="note" label="Ghi chú">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
