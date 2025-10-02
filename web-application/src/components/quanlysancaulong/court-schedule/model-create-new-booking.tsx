import { useListCourts } from "@/hooks/useCourt";
import { useListCustomers } from "@/hooks/useCustomers";
import { CreateBookingCourtRequest } from "@/types-openapi/api";
import { Form, Modal, Select } from "antd";
import FormItem from "antd/es/form/FormItem";
import { DayPilot } from "daypilot-pro-react";
import React from "react";

interface ModelCreateNewBookingProps {
  open: boolean;
  onClose: () => void;
  newBooking: {
    start: DayPilot.Date;
    end: DayPilot.Date;
    resource: string;
  } | null;
}

const ModelCreateNewBooking = ({ open, onClose, newBooking }: ModelCreateNewBookingProps) => {
  const [form] = Form.useForm<CreateBookingCourtRequest>();
  const { data: customers } = useListCustomers({});
  const { data: courts } = useListCourts({});

  const handleCreateBooking = () => {
    console.log("handleCreateBooking", newBooking);
  };

  return (
    <div>
      <Modal
        title="Thêm mới lịch đặt sân cầu lông"
        maskClosable={false}
        centered
        open={open}
        onOk={handleCreateBooking}
        onCancel={onClose}
        okText="Đặt sân"
        cancelText="Bỏ qua"
        width={1000}
      >
        <Form form={form} layout="vertical">
          <FormItem<CreateBookingCourtRequest> name="customerId" label="Khách hàng" rules={[{ required: true, message: "Khách hàng là bắt buộc" }]}>
            <Select placeholder="Chọn khách hàng" options={customers?.data?.map((customer) => ({ value: customer.id, label: customer.fullName }))} />
          </FormItem>
          <FormItem<CreateBookingCourtRequest> name="courtId" label="Sân" rules={[{ required: true, message: "Sân là bắt buộc" }]}>
            <Select placeholder="Chọn sân" options={courts?.data?.map((court) => ({ value: court.id, label: court.name }))} />
          </FormItem>
        </Form>
      </Modal>
    </div>
  );
};

export default ModelCreateNewBooking;
