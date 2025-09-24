import React, { useState } from "react";
import { Modal, Form, Input, TimePicker, Switch } from "antd";
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
    <Modal
      open={open}
      title={initialValues.id ? "Cập nhật ca làm việc" : "Thêm ca làm việc"}
      onCancel={hide}
      onOk={() => {
        form
          .validateFields()
          .then((values) => {
            // Validate startTime và endTime phải là dayjs object
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
          .catch((err) => {
            // Chỉ show lỗi nếu validateFields bị reject
            if (err && err.errorFields) {
              // Có thể dùng message.error hoặc chỉ rely vào form hiển thị lỗi
              // message.error("Vui lòng nhập đầy đủ thông tin hợp lệ");
            }
          });
      }}
      confirmLoading={loading}
      destroyOnHidden
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
    </Modal>
  );

  return { show, hide, ModalComponent };
}
