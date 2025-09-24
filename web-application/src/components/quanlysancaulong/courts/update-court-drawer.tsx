"use client";

import { useDetailCourt, useUpdateCourt } from "@/hooks/useCourt";
import { ApiError } from "@/lib/axios";
import { useListPriceUnits } from "@/hooks/usePriceUnit";
import { useListCourtAreas } from "@/hooks/useCourtArea";
import { UpdateCourtRequest } from "@/types-openapi/api";
import { CloseOutlined, SaveOutlined } from "@ant-design/icons";
import { Button, Drawer, Form, Input, InputNumber, Space, message, Row, Col, FormProps, Select } from "antd";
import FormItem from "antd/es/form/FormItem";
import { useEffect } from "react";

interface UpdateCourtDrawerProps {
  open: boolean;
  onClose: () => void;
  courtId: string;
}

const UpdateCourtDrawer = ({ open, onClose, courtId }: UpdateCourtDrawerProps) => {
  const [form] = Form.useForm();
  const { data: detailData, isFetching: loadingDetail, refetch } = useDetailCourt({ id: courtId });
  const { data: priceUnits } = useListPriceUnits();
  const { data: courtAreas } = useListCourtAreas();
  const updateMutation = useUpdateCourt();

  useEffect(() => {
    if (!detailData?.data || !open) return;
    const d = detailData.data;
    form.setFieldsValue({
      name: d.name ?? null,
      price: d.price ?? null,
      priceUnitId: d.priceUnitId ?? null,
      courtAreaId: d.courtAreaId ?? null,
      note: d.note ?? null,
    });
  }, [detailData, form, open]);

  useEffect(() => {
    if (open && courtId) {
      refetch();
    }
  }, [open, courtId, refetch]);

  const handleSubmit: FormProps<UpdateCourtRequest>["onFinish"] = (values) => {
    const payload: UpdateCourtRequest = { ...values, id: courtId };
    updateMutation.mutate(payload, {
      onSuccess: () => {
        message.success("Cập nhật sân thành công!");
        form.resetFields();
        onClose();
      },
      onError: (error: ApiError) => {
        for (const key in error.errors) {
          message.error(error.errors[key]);
          form.setFields([{ name: key, errors: [error.errors[key]] }]);
        }
      },
    });
  };

  return (
    <Drawer
      title="Cập nhật sân"
      closable={{ "aria-label": "Close Button" }}
      onClose={() => {
        form.resetFields();
        onClose();
      }}
      open={open}
      width={600}
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
          <Button onClick={() => form.submit()} type="primary" icon={<SaveOutlined />} loading={updateMutation.isPending} disabled={loadingDetail}>
            Lưu thay đổi
          </Button>
        </Space>
      }
    >
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <FormItem<UpdateCourtRequest> name="name" label="Tên sân" rules={[{ required: true, message: "Tên sân là bắt buộc" }]}>
              <Input placeholder="Nhập tên sân" />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem<UpdateCourtRequest> name="price" label="Giá" rules={[{ required: true, message: "Giá là bắt buộc" }]}>
              <InputNumber placeholder="Nhập giá" min={0} style={{ width: "100%" }} />
            </FormItem>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <FormItem<UpdateCourtRequest> name="priceUnitId" label="Đơn vị giá" rules={[{ required: true, message: "Đơn vị giá là bắt buộc" }]}>
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
            <FormItem<UpdateCourtRequest> name="courtAreaId" label="Khu vực" rules={[{ required: true, message: "Khu vực là bắt buộc" }]}>
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

        <FormItem<UpdateCourtRequest> name="note" label="Ghi chú">
          <Input.TextArea placeholder="Nhập ghi chú" rows={3} />
        </FormItem>
      </Form>
    </Drawer>
  );
};

export default UpdateCourtDrawer;
