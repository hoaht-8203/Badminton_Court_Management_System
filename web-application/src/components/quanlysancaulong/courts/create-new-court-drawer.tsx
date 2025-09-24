"use client";

import { useCreateCourt } from "@/hooks/useCourt";
import { ApiError } from "@/lib/axios";
import { useListPriceUnits } from "@/hooks/usePriceUnit";
import { useListCourtAreas } from "@/hooks/useCourtArea";
import { CreateCourtRequest } from "@/types-openapi/api";
import { CloseOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Drawer, Form, Input, InputNumber, Space, message, Row, Col, FormProps, Select } from "antd";
import FormItem from "antd/es/form/FormItem";

interface CreateNewCourtDrawerProps {
  open: boolean;
  onClose: () => void;
}

const CreateNewCourtDrawer = ({ open, onClose }: CreateNewCourtDrawerProps) => {
  const [form] = Form.useForm();
  const createMutation = useCreateCourt();
  const { data: priceUnits } = useListPriceUnits();
  const { data: courtAreas } = useListCourtAreas();

  const handleSubmit: FormProps<CreateCourtRequest>["onFinish"] = (values) => {
    createMutation.mutate(values, {
      onSuccess: () => {
        message.success("Tạo sân thành công!");
        form.resetFields();
        onClose();
      },
      onError: (error: ApiError) => {
        message.error(error.message);
      },
    });
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Drawer
      title="Thêm sân"
      closable={{ "aria-label": "Close Button" }}
      onClose={handleCancel}
      open={open}
      width={600}
      extra={
        <Space>
          <Button onClick={handleCancel} icon={<CloseOutlined />}>
            Hủy
          </Button>
          <Button type="primary" onClick={() => form.submit()} htmlType="submit" icon={<PlusOutlined />} loading={createMutation.isPending}>
            Thêm sân
          </Button>
        </Space>
      }
    >
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <FormItem<CreateCourtRequest> name="name" label="Tên sân" rules={[{ required: true, message: "Tên sân là bắt buộc" }]}>
              <Input placeholder="Nhập tên sân" />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem<CreateCourtRequest> name="price" label="Giá" rules={[{ required: true, message: "Giá là bắt buộc" }]}>
              <InputNumber placeholder="Nhập giá" min={0} style={{ width: "100%" }} />
            </FormItem>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <FormItem<CreateCourtRequest> name="priceUnitId" label="Đơn vị giá" rules={[{ required: true, message: "Đơn vị giá là bắt buộc" }]}>
              <Select placeholder="Chọn đơn vị giá" allowClear>
                {priceUnits?.data?.map((pu) => (
                  <Select.Option key={pu.id} value={pu.id}>
                    {pu.name}
                  </Select.Option>
                ))}
              </Select>
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem<CreateCourtRequest> name="courtAreaId" label="Khu vực" rules={[{ required: true, message: "Khu vực là bắt buộc" }]}>
              <Select placeholder="Chọn khu vực" allowClear>
                {courtAreas?.data?.map((ca) => (
                  <Select.Option key={ca.id} value={ca.id}>
                    {ca.name}
                  </Select.Option>
                ))}
              </Select>
            </FormItem>
          </Col>
        </Row>

        <FormItem<CreateCourtRequest> name="note" label="Ghi chú">
          <Input.TextArea placeholder="Nhập ghi chú" rows={3} />
        </FormItem>
      </Form>
    </Drawer>
  );
};

export default CreateNewCourtDrawer;
