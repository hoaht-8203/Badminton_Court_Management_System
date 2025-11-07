"use client";

import { useDetailVoucher, useUpdateVoucher } from "@/hooks/useVouchers";
import { ApiError } from "@/lib/axios";
import { UpdateVoucherRequest, DetailVoucherRequest, VoucherResponse } from "@/types-openapi/api";
import { CloseOutlined, SaveOutlined } from "@ant-design/icons";
import { Button, Drawer, Form, FormProps, InputNumber, DatePicker, Tabs, message, Divider } from "antd";
import FormItem from "antd/es/form/FormItem";
import dayjs from "dayjs";
import React from "react";

interface ExtendVoucherDrawerProps {
  open: boolean;
  onClose: () => void;
  voucherId: number | null;
}

// Use Tabs items API (TabPane is deprecated)

const ExtendVoucherDrawer = ({ open, onClose, voucherId }: ExtendVoucherDrawerProps) => {
  const [form] = Form.useForm<UpdateVoucherRequest>();
  const { data: detailResp } = useDetailVoucher({ id: voucherId ?? 0 } as DetailVoucherRequest);
  const updateMutation = useUpdateVoucher();

  React.useEffect(() => {
    if (detailResp?.data) {
      const v = detailResp.data as VoucherResponse;
      form.setFieldsValue({
        endAt: v.endAt ? dayjs(v.endAt) : undefined,
        usageLimitTotal: v.usageLimitTotal,
        usageLimitPerUser: v.usageLimitPerUser,
      } as any);
    }
  }, [detailResp, form]);

  const handleSubmit: FormProps<UpdateVoucherRequest>["onFinish"] = (values) => {
    if (!voucherId) {
      message.error("ID voucher không hợp lệ");
      return;
    }

    const payload: UpdateVoucherRequest = {
      endAt: values.endAt ? dayjs(values.endAt).toDate() : undefined,
      usageLimitTotal: values.usageLimitTotal,
      usageLimitPerUser: values.usageLimitPerUser,
    } as UpdateVoucherRequest;

    updateMutation.mutate({ id: voucherId, data: payload }, {
      onSuccess: () => {
        message.success("Gia hạn voucher thành công!");
        onClose();
      },
      onError: (err: ApiError) => {
        message.error(err.message);
      },
    });
  };

  return (
    <Drawer
      title="Gia hạn voucher"
      closable={true}
      closeIcon={<CloseOutlined aria-label="Close Button" />}
      onClose={() => {
        form.resetFields();
        onClose();
      }}
      open={open}
      width={720}
      extra={
        <div>
          <Button onClick={() => { form.resetFields(); onClose(); }}>Đóng</Button>
          <Button type="primary" style={{ marginLeft: 8 }} loading={updateMutation.status === "pending"} onClick={() => form.submit()} icon={<SaveOutlined />}>
            Lưu
          </Button>
        </div>
      }
    >
      {
        (() => {
          const items = [
            {
              key: "1",
              label: "Thông tin cơ bản",
              children: (
                <Form form={form} onFinish={handleSubmit} layout="vertical">
                  <FormItem name="endAt" label="Ngày kết thúc mới" rules={[{ required: true }]}>
                    <DatePicker showTime style={{ width: "100%" }} format="DD/MM/YYYY HH:mm" />
                  </FormItem>

                  <FormItem name="usageLimitTotal" label="Giới hạn sử dụng tổng" initialValue={0}>
                    <InputNumber min={0} style={{ width: "100%" }} placeholder="0 = không giới hạn" />
                  </FormItem>

                  <FormItem name="usageLimitPerUser" label="Giới hạn sử dụng mỗi user" initialValue={1}>
                    <InputNumber min={0} style={{ width: "100%" }} />
                  </FormItem>
                </Form>
              ),
            },
            {
              key: "2",
              label: "Đối tượng áp dụng",
              children: (
                <div>
                  <Divider>Quy tắc thời gian</Divider>
                  {(detailResp?.data?.timeRules ?? []).length === 0 ? (
                    <div>-</div>
                  ) : (
                    (detailResp?.data?.timeRules ?? []).map((r: any, i: number) => (
                      <div key={i} style={{ marginBottom: 8 }}>
                        {r.dayOfWeek != null ? <div>Thứ: {String(r.dayOfWeek)}</div> : null}
                        {r.specificDate ? <div>Ngày: {dayjs(r.specificDate).format("DD/MM/YYYY")}</div> : null}
                        {(r.startTime || r.endTime) && <div>Giờ: {r.startTime ?? "-"} - {r.endTime ?? "-"}</div>}
                      </div>
                    ))
                  )}

                  <Divider>Quy tắc người dùng</Divider>
                  {(detailResp?.data?.userRules ?? []).length === 0 ? (
                    <div>-</div>
                  ) : (
                    (detailResp?.data?.userRules ?? []).map((u: any, i: number) => (
                      <div key={i} style={{ marginBottom: 8 }}>
                        {u.isNewCustomer != null ? <div>Khách hàng mới: {u.isNewCustomer ? "Có" : "Không"}</div> : null}
                        {u.userType ? <div>Loại người dùng: {u.userType}</div> : null}
                      </div>
                    ))
                  )}
                </div>
              ),
            },
          ];

          return <Tabs defaultActiveKey="1" items={items} />;
        })()
      }
    </Drawer>
  );
};

export default ExtendVoucherDrawer;
