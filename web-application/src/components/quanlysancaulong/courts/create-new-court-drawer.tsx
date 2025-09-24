"use client";

import { useCreateCourt, useListCourtPricingRuleTemplates } from "@/hooks/useCourt";
import { ApiError } from "@/lib/axios";
import { useListCourtAreas } from "@/hooks/useCourtArea";
import { CreateCourtPricingRulesRequest, CreateCourtRequest } from "@/types-openapi/api";
import { CloseOutlined, CopyOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Drawer,
  Form,
  Input,
  Space,
  message,
  Row,
  Col,
  FormProps,
  Select,
  Divider,
  List,
  TimePicker,
  InputNumber,
  Typography,
  Tag,
  Popconfirm,
} from "antd";
import FormItem from "antd/es/form/FormItem";
import CreateNewCourtAreaDrawer from "./create-new-court-area-drawer";
import { useMemo, useState } from "react";
import dayjs, { Dayjs } from "dayjs";

interface CreateNewCourtDrawerProps {
  open: boolean;
  onClose: () => void;
}

const CreateNewCourtDrawer = ({ open, onClose }: CreateNewCourtDrawerProps) => {
  const [openCreateCourtAreaDrawer, setOpenCreateCourtAreaDrawer] = useState(false);
  const [courtPricingRules, setCourtPricingRules] = useState<CreateCourtPricingRulesRequest[]>([]);
  const [newRuleDaysOfWeek, setNewRuleDaysOfWeek] = useState<number[]>([]);
  const [newRuleStartTime, setNewRuleStartTime] = useState<Dayjs | null>(null);
  const [newRuleEndTime, setNewRuleEndTime] = useState<Dayjs | null>(null);
  const [newRulePricePerHour, setNewRulePricePerHour] = useState<number | null>(null);
  const [isUsingPricingRuleTemplate, setIsUsingPricingRuleTemplate] = useState(false);

  const daysOptions = useMemo(
    () => [
      { label: "T2", value: 2 },
      { label: "T3", value: 3 },
      { label: "T4", value: 4 },
      { label: "T5", value: 5 },
      { label: "T6", value: 6 },
      { label: "T7", value: 7 },
      { label: "CN", value: 8 },
    ],
    [],
  );

  const [form] = Form.useForm();
  const createMutation = useCreateCourt();
  const { data: courtAreas, isFetching: loadingCourtAreas } = useListCourtAreas();
  const {
    data: courtPricingRuleTemplates,
    isFetching: loadingCourtPricingRuleTemplates,
    refetch: refetchCourtPricingRuleTemplates,
  } = useListCourtPricingRuleTemplates();

  const handleSubmit: FormProps<CreateCourtRequest>["onFinish"] = (values) => {
    if (!courtPricingRules.length) {
      message.error("Vui lòng thêm ít nhất 1 cấu hình giá");
      return;
    }

    const payload: CreateCourtRequest = {
      ...values,
      courtPricingRules: courtPricingRules,
    } as CreateCourtRequest;

    createMutation.mutate(payload, {
      onSuccess: () => {
        message.success("Tạo sân thành công!");
        handleClose();
      },
      onError: (error: ApiError) => {
        message.error(error.message);
      },
    });
  };

  const handleClose = () => {
    form.resetFields();
    setCourtPricingRules([]);
    setNewRuleDaysOfWeek([]);
    setNewRuleStartTime(null);
    setNewRuleEndTime(null);
    setNewRulePricePerHour(null);
    setIsUsingPricingRuleTemplate(false);
    onClose();
  };

  const handleUsingPricingRuleTemplate = () => {
    refetchCourtPricingRuleTemplates();
    if (!courtPricingRuleTemplates) return;
    setIsUsingPricingRuleTemplate(true);
    setCourtPricingRules(
      courtPricingRuleTemplates.data?.map((template) => ({
        daysOfWeek: template.daysOfWeek,
        startTime: template.startTime,
        endTime: template.endTime,
        pricePerHour: template.pricePerHour,
      })) || [],
    );
  };

  const handleCancelUsingPricingRuleTemplate = () => {
    setIsUsingPricingRuleTemplate(false);
    setCourtPricingRules([]);
    setNewRuleDaysOfWeek([]);
    setNewRuleStartTime(null);
    setNewRuleEndTime(null);
    setNewRulePricePerHour(null);
  };

  return (
    <>
      <Drawer
        title="Thêm sân cầu lông"
        closable={{ "aria-label": "Close Button" }}
        onClose={handleClose}
        open={open}
        width={800}
        extra={
          <Space>
            <Button onClick={handleClose} icon={<CloseOutlined />}>
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
              <FormItem<CreateCourtRequest> name="courtAreaId" label="Khu vực" rules={[{ required: true, message: "Khu vực là bắt buộc" }]}>
                <Select
                  placeholder="Chọn khu vực"
                  allowClear
                  options={courtAreas?.data?.map((ca) => ({ value: ca.id, label: ca.name }))}
                  loading={loadingCourtAreas}
                  popupRender={(menu) => (
                    <>
                      {menu}
                      <Divider style={{ margin: "8px 0" }} />
                      <Space style={{ padding: "0 8px 4px" }}>
                        <Button variant="outlined" icon={<PlusOutlined />} onClick={() => setOpenCreateCourtAreaDrawer(true)}>
                          Thêm khu vực
                        </Button>
                      </Space>
                    </>
                  )}
                />
              </FormItem>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <FormItem<CreateCourtRequest> name="note" label="Ghi chú">
                <Input.TextArea placeholder="Nhập ghi chú" rows={3} />
              </FormItem>
            </Col>
          </Row>

          <Divider>Cấu hình giá theo khung giờ</Divider>
          <Row gutter={16} align="bottom">
            <Col span={24}>
              <FormItem label="Ngày trong tuần" required>
                <Select
                  mode="multiple"
                  placeholder="Chọn ngày trong tuần"
                  value={newRuleDaysOfWeek}
                  options={daysOptions}
                  onChange={(vals) => setNewRuleDaysOfWeek(vals)}
                />
              </FormItem>
            </Col>
            <Col span={12}>
              <FormItem label="Giờ bắt đầu" required>
                <TimePicker.RangePicker
                  value={[newRuleStartTime, newRuleEndTime]}
                  onChange={(vals) => {
                    if (!vals) return;
                    setNewRuleStartTime(vals[0]);
                    setNewRuleEndTime(vals[1]);
                  }}
                  style={{ width: "100%" }}
                />
              </FormItem>
            </Col>
            <Col span={12}>
              <FormItem label="Giá/giờ (₫)" required>
                <InputNumber
                  min={0}
                  step={1000}
                  style={{ width: "100%" }}
                  value={newRulePricePerHour as number | null}
                  onChange={(v) => setNewRulePricePerHour(v as number | null)}
                  formatter={(value) => `${value}`.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                  parser={(value) => (value ? value.replace(/\./g, "") : "") as unknown as number}
                />
              </FormItem>
            </Col>
            <Col span={24}>
              <Space>
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    if (!newRuleDaysOfWeek.length || !newRuleStartTime || !newRuleEndTime || newRulePricePerHour == null) {
                      message.error("Vui lòng điền đầy đủ thông tin cấu hình");
                      return;
                    }
                    if (newRuleStartTime.valueOf() >= newRuleEndTime.valueOf()) {
                      message.error("Giờ bắt đầu phải trước giờ kết thúc");
                      return;
                    }
                    const rule: CreateCourtPricingRulesRequest = {
                      daysOfWeek: newRuleDaysOfWeek,
                      startTime: dayjs(newRuleStartTime).format("HH:mm:ss"),
                      endTime: dayjs(newRuleEndTime).format("HH:mm:ss"),
                      pricePerHour: newRulePricePerHour,
                    };
                    setCourtPricingRules((prev) => [...prev, rule]);
                    setNewRuleDaysOfWeek([]);
                    setNewRuleStartTime(null);
                    setNewRuleEndTime(null);
                    setNewRulePricePerHour(null);
                  }}
                >
                  Thêm cấu hình
                </Button>

                <Button variant="outlined" icon={<CopyOutlined />} onClick={handleUsingPricingRuleTemplate}>
                  Sử dụng cấu hình có sẵn
                </Button>
              </Space>
            </Col>
          </Row>

          <>
            <Divider orientation="left">Danh sách cấu hình</Divider>
            <List
              bordered
              dataSource={courtPricingRules}
              loading={loadingCourtPricingRuleTemplates}
              header={
                <>
                  {isUsingPricingRuleTemplate && (
                    <div className="flex gap-2">
                      <Button type="primary" icon={<EditOutlined />}>
                        Chỉnh sửa cấu hình mẫu
                      </Button>
                      <Button color="orange" variant="outlined" icon={<CloseOutlined />} onClick={handleCancelUsingPricingRuleTemplate}>
                        Huỷ sử dụng cấu hình mẫu
                      </Button>
                    </div>
                  )}
                </>
              }
              renderItem={(item, index) => (
                <List.Item
                  actions={[
                    <Popconfirm
                      key="remove"
                      title="Xóa cấu hình này?"
                      okText="Xóa"
                      cancelText="Hủy"
                      onConfirm={() => setCourtPricingRules((prev) => prev.filter((_, i) => i !== index))}
                    >
                      <Button danger size="small" icon={<DeleteOutlined />}>
                        Xóa cấu hình
                      </Button>
                    </Popconfirm>,
                  ]}
                >
                  <Space direction="vertical" style={{ width: "100%" }} size={2}>
                    <Space wrap>
                      {item.daysOfWeek?.map((d) => (
                        <Tag key={d}>{daysOptions.find((opt) => opt.value === d)?.label}</Tag>
                      ))}
                    </Space>
                    <Typography.Text>
                      {`Khung giờ: ${item.startTime} - ${item.endTime} | Giá: ${item.pricePerHour.toLocaleString("vi-VN")}₫/giờ`}
                    </Typography.Text>
                  </Space>
                </List.Item>
              )}
            />
          </>
        </Form>
      </Drawer>

      <CreateNewCourtAreaDrawer open={openCreateCourtAreaDrawer} onClose={() => setOpenCreateCourtAreaDrawer(false)} />
    </>
  );
};

export default CreateNewCourtDrawer;
