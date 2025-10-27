import React, { useState } from "react";
import { Drawer, Form, Input, TimePicker, Switch, Button, Space } from "antd";
import dayjs from "dayjs";

export function useShiftModal() {
  const [open, setOpen] = useState(false);
  const [initialValues, setInitialValues] = useState<any>({});
  const [form] = Form.useForm();

  const show = (values?: any) => {
    setInitialValues(values || {});
    setOpen(true);
    form.setFieldsValue({
      ...values,
      startTime: values?.startTime ? dayjs(values.startTime, "HH:mm:ss") : null,
      endTime: values?.endTime ? dayjs(values.endTime, "HH:mm:ss") : null,
    });
  };
  const hide = () => setOpen(false);

  const ModalComponent = ({ onOk, loading }: { onOk: (values: any) => void; loading?: boolean }) => (
    <Drawer
      open={open}
      title={initialValues.id ? "Cập nhật ca làm việc" : "Thêm ca làm việc"}
      onClose={hide}
      width={480}
      destroyOnClose
      extra={
        <Space>
          <Button onClick={hide}>Bỏ qua</Button>
          <Button
            type="primary"
            loading={loading}
            onClick={() => {
              form
                .validateFields()
                .then((values) => {
                  if (!values.startTime || !values.endTime || !dayjs.isDayjs(values.startTime) || !dayjs.isDayjs(values.endTime)) {
                    form.setFields([
                      { name: "startTime", errors: ["Giờ bắt đầu không hợp lệ"] },
                      { name: "endTime", errors: ["Giờ kết thúc không hợp lệ"] },
                    ]);
                    return;
                  }
                  onOk({
                    ...initialValues,
                    ...values,
                    startTime: values.startTime.format("HH:mm:ss"),
                    endTime: values.endTime.format("HH:mm:ss"),
                  });
                })
                .catch(() => {});
            }}
          >
            Lưu
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" initialValues={initialValues}>
        <Form.Item label="Tên ca làm việc" name="name" rules={[{ required: true, message: "Nhập tên ca làm việc" }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Giờ bắt đầu" name="startTime" rules={[{ required: true, message: "Chọn giờ bắt đầu" }]}>
          <TimePicker format="HH:mm" />
        </Form.Item>
        <Form.Item label="Giờ kết thúc" name="endTime" rules={[{ required: true, message: "Chọn giờ kết thúc" }]}>
          <TimePicker format="HH:mm" />
        </Form.Item>
        <Form.Item label="Hoạt động" name="isActive" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Drawer>
  );

  return { show, hide, ModalComponent };
}
