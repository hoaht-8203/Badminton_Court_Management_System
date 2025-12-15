"use client";

import { useDetailVoucher, useUpdateVoucher } from "@/hooks/useVouchers";
import { useListMemberships } from "@/hooks/useMembership";
import { useListCustomers } from "@/hooks/useCustomers";
import { ApiError } from "@/lib/axios";
import { DetailVoucherRequest, UpdateVoucherRequest, VoucherResponse } from "@/types-openapi/api";
import { CloseOutlined, SaveOutlined } from "@ant-design/icons";
import { Button, DatePicker, Divider, Drawer, Form, FormProps, Input, InputNumber, Radio, Select, Space, Switch, Tabs, message } from "antd";
import FormItem from "antd/es/form/FormItem";
import dayjs from "dayjs";
import React from "react";

interface UpdateVoucherDrawerProps {
  open: boolean;
  onClose: () => void;
  voucherId: number | null;
}

const UpdateVoucherDrawer = ({ open, onClose, voucherId }: UpdateVoucherDrawerProps) => {
  const [form] = Form.useForm<UpdateVoucherRequest>();
  const { data: detailResp, isFetching } = useDetailVoucher({ id: voucherId ?? 0 } as DetailVoucherRequest);
  const updateMutation = useUpdateVoucher();
  const { data: membershipsData } = useListMemberships({});
  const { data: customersData } = useListCustomers({});

  React.useEffect(() => {
    if (detailResp?.data && voucherId) {
      const v = detailResp.data as VoucherResponse;
      // transform response to form values
      form.setFieldsValue({
        code: v.code,
        title: v.title,
        description: v.description,
        discountType: v.discountType,
        discountValue: v.discountValue,
        discountPercentage: v.discountPercentage,
        maxDiscountValue: v.maxDiscountValue,
        minOrderValue: v.minOrderValue,
        startAt: v.startAt ? dayjs(v.startAt) : undefined,
        endAt: v.endAt ? dayjs(v.endAt) : undefined,
        usageLimitTotal: v.usageLimitTotal,
        usageLimitPerUser: v.usageLimitPerUser,
        isActive: v.isActive,
        timeRules: v.timeRules?.map((r: any) => ({
          ...r,
          timeRuleType: r.dayOfWeek != null ? "dayOfWeek" : "specificDate",
          specificDate: r.specificDate ? dayjs(r.specificDate) : undefined,
          startTime: r.startTime ? r.startTime.slice(0, 5) : undefined,
          endTime: r.endTime ? r.endTime.slice(0, 5) : undefined,
        })),
        userRules: v.userRules?.map((u: any) => {
          let userRuleType = "newCustomer";
          if (u.specificCustomerIds && u.specificCustomerIds.length > 0) {
            userRuleType = "specificCustomers";
          } else if (u.membershipId) {
            userRuleType = "membership";
          } else if (u.isNewCustomer != null) {
            userRuleType = "newCustomer";
          }
          return {
            ...u,
            userRuleType,
          };
        }),
      } as any);
    }
  }, [detailResp, voucherId, form]);

  const handleSubmit: FormProps<UpdateVoucherRequest>["onFinish"] = (values) => {
    if (!voucherId) {
      message.error("ID voucher không hợp lệ");
      return;
    }

    const payload: UpdateVoucherRequest = {
      ...values,
      startAt: values.startAt ? dayjs(values.startAt).toDate() : undefined,
      endAt: values.endAt ? dayjs(values.endAt).toDate() : undefined,
      timeRules: values.timeRules?.map((rule: any) => ({
        ...rule,
        specificDate: rule.specificDate ? dayjs(rule.specificDate).toDate() : undefined,
        startTime: rule.startTime ? `${rule.startTime}:00` : undefined,
        endTime: rule.endTime ? `${rule.endTime}:00` : undefined,
      })),
    } as UpdateVoucherRequest;

    updateMutation.mutate(
      { id: voucherId, data: payload },
      {
        onSuccess: () => {
          message.success("Cập nhật voucher thành công!");
          form.resetFields();
          onClose();
        },
        onError: (err: ApiError) => {
          message.error(err.message);
        },
      },
    );
  };

  return (
    <Drawer
      title="Cập nhật voucher"
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
          <Button type="primary" icon={<SaveOutlined />} loading={updateMutation.status === "pending"} onClick={() => form.submit()}>
            Lưu thay đổi
          </Button>
        </Space>
      }
    >
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Tabs
          defaultActiveKey="basic"
          items={[
            {
              key: "basic",
              label: "Thông tin cơ bản",
              children: (
                <>
                  <FormItem name="code" label="Mã voucher" rules={[{ required: true, message: "Mã voucher là bắt buộc" }]}>
                    <Input placeholder="Nhập mã voucher" />
                  </FormItem>

                  <FormItem name="title" label="Tiêu đề" rules={[{ required: true, message: "Tiêu đề là bắt buộc" }]}>
                    <Input placeholder="Nhập tiêu đề" />
                  </FormItem>

                  <FormItem name="description" label="Mô tả">
                    <Input.TextArea rows={3} placeholder="Nhập mô tả" />
                  </FormItem>

                  <FormItem name="discountType" label="Loại giảm giá" rules={[{ required: true, message: "Loại giảm giá là bắt buộc" }]}>
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
                              <FormItem name="discountPercentage" label="% Giảm giá" rules={[{ required: true, message: "Phần trăm giảm giá là bắt buộc" }]}>
                                <InputNumber min={0} max={100} style={{ width: "100%" }} placeholder="Nhập % giảm" />
                              </FormItem>
                              <FormItem name="maxDiscountValue" label="Giá trị giảm tối đa (VNĐ)">
                                <InputNumber min={0} style={{ width: "100%" }} placeholder="Nhập giá trị tối đa" />
                              </FormItem>
                            </>
                          ) : (
                            <FormItem name="discountValue" label="Giá trị giảm (VNĐ)" rules={[{ required: true, message: "Giá trị giảm là bắt buộc" }]}>
                              <InputNumber min={0} style={{ width: "100%" }} placeholder="Nhập giá trị giảm" />
                            </FormItem>
                          )}
                        </>
                      );
                    }}
                  </Form.Item>

                  <FormItem name="minOrderValue" label="Đơn hàng tối thiểu (VNĐ)">
                    <InputNumber min={0} style={{ width: "100%" }} placeholder="Nhập giá trị tối thiểu" />
                  </FormItem>

                  <FormItem name="startAt" label="Ngày bắt đầu" rules={[{ required: true, message: "Ngày bắt đầu là bắt buộc" }]}>
                    <DatePicker showTime style={{ width: "100%" }} format="DD/MM/YYYY HH:mm" />
                  </FormItem>

                  <FormItem name="endAt" label="Ngày kết thúc" rules={[{ required: true, message: "Ngày kết thúc là bắt buộc" }]}>
                    <DatePicker showTime style={{ width: "100%" }} format="DD/MM/YYYY HH:mm" />
                  </FormItem>

                  <FormItem name="usageLimitTotal" label="Giới hạn sử dụng tổng" initialValue={0}>
                    <InputNumber min={0} style={{ width: "100%" }} placeholder="0 = không giới hạn" />
                  </FormItem>

                  <FormItem name="usageLimitPerUser" label="Giới hạn sử dụng mỗi user" initialValue={1}>
                    <InputNumber min={0} style={{ width: "100%" }} />
                  </FormItem>

                  <FormItem name="isActive" label="Trạng thái" valuePropName="checked">
                    <Switch checkedChildren="Hoạt động" unCheckedChildren="Không hoạt động" />
                  </FormItem>
                </>
              ),
            },
            {
              key: "conditions",
              label: "Điều kiện áp dụng",
              children: (
                <>
                  <Divider>Quy tắc thời gian</Divider>
        <Form.List name="timeRules">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <div key={key} style={{ border: "1px solid #d9d9d9", padding: 16, marginBottom: 16, borderRadius: 4 }}>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <FormItem {...restField} name={[name, "timeRuleType"]} label="Loại quy tắc" initialValue="dayOfWeek">
                      <Radio.Group
                        onChange={(e) => {
                          const currentValues = form.getFieldValue("timeRules");
                          if (currentValues && currentValues[name]) {
                            if (e.target.value === "dayOfWeek") {
                              currentValues[name].specificDate = undefined;
                            } else {
                              currentValues[name].dayOfWeek = undefined;
                            }
                            form.setFieldsValue({ timeRules: currentValues });
                          }
                        }}
                      >
                        <Radio value="dayOfWeek">Thứ trong tuần</Radio>
                        <Radio value="specificDate">Ngày cụ thể</Radio>
                      </Radio.Group>
                    </FormItem>

                    <Form.Item noStyle shouldUpdate={(prev, curr) => prev.timeRules !== curr.timeRules}>
                      {() => {
                        const timeRules = form.getFieldValue("timeRules") || [];
                        const currentRule = timeRules[name];
                        const ruleType = currentRule?.timeRuleType || "dayOfWeek";

                        return (
                          <>
                            {ruleType === "dayOfWeek" ? (
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
                            ) : (
                              <FormItem {...restField} name={[name, "specificDate"]} label="Ngày cụ thể">
                                <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
                              </FormItem>
                            )}
                          </>
                        );
                      }}
                    </Form.Item>

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

        <Divider>Quy tắc người dùng</Divider>
        <Form.List name="userRules">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <div key={key} style={{ border: "1px solid #d9d9d9", padding: 16, marginBottom: 16, borderRadius: 4 }}>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <FormItem {...restField} name={[name, "userRuleType"]} label="Loại quy tắc" initialValue="newCustomer">
                      <Select
                        placeholder="Chọn loại quy tắc"
                        onChange={(value) => {
                          const currentValues = form.getFieldValue("userRules");
                          if (currentValues && currentValues[name]) {
                            // Clear other fields based on selection
                            if (value === "newCustomer") {
                              currentValues[name].membershipId = undefined;
                              currentValues[name].specificCustomerIds = undefined;
                              currentValues[name].isNewCustomer = true; // Set default to true for new customers
                            } else if (value === "membership") {
                              currentValues[name].isNewCustomer = undefined;
                              currentValues[name].specificCustomerIds = undefined;
                            } else if (value === "specificCustomers") {
                              currentValues[name].isNewCustomer = undefined;
                              currentValues[name].membershipId = undefined;
                            }
                            form.setFieldsValue({ userRules: currentValues });
                          }
                        }}
                        options={[
                          { value: "newCustomer", label: "Khách hàng mới" },
                          { value: "membership", label: "Gói hội viên" },
                          { value: "specificCustomers", label: "Khách hàng cụ thể" },
                        ]}
                      />
                    </FormItem>

                    <Form.Item noStyle shouldUpdate={(prev, curr) => prev.userRules !== curr.userRules}>
                      {() => {
                        const userRules = form.getFieldValue("userRules") || [];
                        const currentRule = userRules[name];
                        const ruleType = currentRule?.userRuleType || "newCustomer";

                        return (
                          <>
                            {ruleType === "membership" && (
                              <FormItem {...restField} name={[name, "membershipId"]} label="Gói hội viên">
                                <Select
                                  placeholder="Chọn gói hội viên"
                                  showSearch
                                  filterOption={(input, option) =>
                                    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                                  }
                                  options={membershipsData?.data?.map((m) => ({
                                    value: m.id,
                                    label: m.name,
                                  })) || []}
                                />
                              </FormItem>
                            )}
                            {ruleType === "specificCustomers" && (
                              <FormItem {...restField} name={[name, "specificCustomerIds"]} label="Khách hàng cụ thể">
                                <Select
                                  mode="multiple"
                                  placeholder="Tìm kiếm và chọn khách hàng"
                                  showSearch
                                  filterOption={(input, option) =>
                                    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                                  }
                                  options={customersData?.data?.map((c) => ({
                                    value: c.id,
                                    label: `${c.fullName} - ${c.phoneNumber}`,
                                  })) || []}
                                />
                              </FormItem>
                            )}
                            {ruleType === "newCustomer" && (
                              <FormItem {...restField} name={[name, "isNewCustomer"]} label="" hidden initialValue={true}>
                                <Input />
                              </FormItem>
                            )}
                          </>
                        );
                      }}
                    </Form.Item>

                    <FormItem {...restField} name={[name, "userType"]} label="Loại người dùng" hidden>
                      <Input placeholder="Deprecated" />
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
                </>
              ),
            },
          ]}
        />
      </Form>
    </Drawer>
  );
};

export default UpdateVoucherDrawer;
