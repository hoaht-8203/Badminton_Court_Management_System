import {
  useCreateCourtPricingRuleTemplate,
  useDeleteCourtPricingRuleTemplate,
  useListCourtPricingRuleTemplates,
  useUpdateCourtPricingRuleTemplate,
} from "@/hooks/useCourt";
import { ApiError } from "@/lib/axios";
import { CreateCourtPricingRuleTemplateRequest, UpdateCourtPricingRuleTemplateRequest } from "@/types-openapi/api";
import { CloseOutlined, DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { Button, Col, Drawer, Form, FormProps, InputNumber, List, message, Popconfirm, Row, Select, Space, Tag, TimePicker, Typography } from "antd";
import FormItem from "antd/es/form/FormItem";
import dayjs, { Dayjs } from "dayjs";
import { useMemo, useState } from "react";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

interface ManageCourtPricingRuleTemplateProps {
  open: boolean;
  onClose: () => void;
}

interface FormFields {
  daysOfWeek: number[];
  timeRange: [Dayjs, Dayjs];
  pricePerHour: number;
}

const ManageCourtPricingRuleTemplate = ({ open, onClose }: ManageCourtPricingRuleTemplateProps) => {
  const [form] = Form.useForm<FormFields>();

  const createMutation = useCreateCourtPricingRuleTemplate();
  const updateMutation = useUpdateCourtPricingRuleTemplate();
  const deleteMutation = useDeleteCourtPricingRuleTemplate();
  const {
    data: courtPricingRuleTemplates,
    isFetching: loadingCourtPricingRuleTemplates,
    refetch: refetchCourtPricingRuleTemplates,
  } = useListCourtPricingRuleTemplates();

  const [newRuleDaysOfWeek, setNewRuleDaysOfWeek] = useState<number[]>([]);
  const [newRuleStartTime, setNewRuleStartTime] = useState<Dayjs | null>(null);
  const [newRuleEndTime, setNewRuleEndTime] = useState<Dayjs | null>(null);
  const [newRulePricePerHour, setNewRulePricePerHour] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [ruleIdEditing, setRuleIdEditing] = useState<string | null>(null);

  const clearForm = () => {
    form.resetFields();
    setNewRuleDaysOfWeek([]);
    setNewRuleStartTime(null);
    setNewRuleEndTime(null);
    setNewRulePricePerHour(null);
    setIsEditing(false);
    setRuleIdEditing(null);
  };

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

  const handleCreateRule: FormProps<FormFields>["onFinish"] = () => {
    if (isEditing) {
      const payload: UpdateCourtPricingRuleTemplateRequest = {
        id: ruleIdEditing as string,
        daysOfWeek: newRuleDaysOfWeek,
        startTime: dayjs(newRuleStartTime).format("HH:mm:ss"),
        endTime: dayjs(newRuleEndTime).format("HH:mm:ss"),
        pricePerHour: newRulePricePerHour as number,
      };

      updateMutation.mutate(payload, {
        onSuccess: () => {
          message.success("Cập nhật cấu hình giá theo khung giờ thành công!");
          clearForm();
        },
        onError: (error: ApiError) => {
          message.error(error.message);
        },
      });
    } else {
      const payload: CreateCourtPricingRuleTemplateRequest = {
        daysOfWeek: newRuleDaysOfWeek,
        startTime: dayjs(newRuleStartTime).format("HH:mm:ss"),
        endTime: dayjs(newRuleEndTime).format("HH:mm:ss"),
        pricePerHour: newRulePricePerHour as number,
      };

      createMutation.mutate(payload, {
        onSuccess: () => {
          message.success("Thêm cấu hình giá theo khung giờ thành công!");
          clearForm();
        },
        onError: (error: ApiError) => {
          message.error(error.message);
        },
      });
    }
  };

  const handleDeleteRule = (id: string) => {
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          message.success("Xóa cấu hình giá theo khung giờ thành công!");
          refetchCourtPricingRuleTemplates();
        },
      },
    );
  };

  const handleEdit = (id: string) => {
    const startTime = courtPricingRuleTemplates?.data?.find((item) => item.id === id)?.startTime;
    const endTime = courtPricingRuleTemplates?.data?.find((item) => item.id === id)?.endTime;

    setNewRuleDaysOfWeek(courtPricingRuleTemplates?.data?.find((item) => item.id === id)?.daysOfWeek || []);
    setNewRuleStartTime(dayjs(startTime, "HH:mm:ss"));
    setNewRuleEndTime(dayjs(endTime, "HH:mm:ss"));
    setNewRulePricePerHour(courtPricingRuleTemplates?.data?.find((item) => item.id === id)?.pricePerHour || null);

    form.setFieldsValue({
      daysOfWeek: courtPricingRuleTemplates?.data?.find((item) => item.id === id)?.daysOfWeek || [],
      timeRange: [dayjs(startTime, "HH:mm:ss"), dayjs(endTime, "HH:mm:ss")],
      pricePerHour: courtPricingRuleTemplates?.data?.find((item) => item.id === id)?.pricePerHour,
    });
    setIsEditing(true);
    setRuleIdEditing(id);
  };

  return (
    <Drawer
      title="Quản lý cấu hình giá theo khung giờ"
      closable={{ "aria-label": "Close Button" }}
      onClose={() => {
        clearForm();
        onClose();
      }}
      open={open}
      width={800}
      extra={
        <Space>
          <Button
            onClick={() => {
              clearForm();
              onClose();
            }}
            icon={<CloseOutlined />}
          >
            Hủy
          </Button>
        </Space>
      }
    >
      <Form form={form} onFinish={handleCreateRule} layout="vertical">
        <Row gutter={16} align="bottom">
          <Col span={24}>
            <FormItem<FormFields> name="daysOfWeek" label="Ngày trong tuần" rules={[{ required: true, message: "Ngày trong tuần là bắt buộc" }]}>
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
            <FormItem<FormFields> name="timeRange" label="Giờ bắt đầu" rules={[{ required: true, message: "Giờ bắt đầu là bắt buộc" }]}>
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
            <FormItem<FormFields> name="pricePerHour" label="Giá/giờ (₫)" rules={[{ required: true, message: "Giá/giờ là bắt buộc" }]}>
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
              <Button htmlType="submit" type="dashed" icon={<PlusOutlined />}>
                {isEditing ? "Cập nhật cấu hình" : "Thêm cấu hình"}
              </Button>
            </Space>
          </Col>
        </Row>
      </Form>

      <div className="mt-4">
        <List
          bordered
          dataSource={courtPricingRuleTemplates?.data || []}
          loading={loadingCourtPricingRuleTemplates}
          header={
            <Button icon={<ReloadOutlined />} onClick={() => refetchCourtPricingRuleTemplates()}>
              Tải lại dữ liệu
            </Button>
          }
          renderItem={(item, index) => (
            <List.Item
              key={`${item.id}-${index}`}
              actions={[
                <Popconfirm
                  key="remove"
                  title="Xóa cấu hình này?"
                  okText="Xóa"
                  cancelText="Hủy"
                  onConfirm={() => handleDeleteRule(item.id as string)}
                >
                  <Button danger size="small" icon={<DeleteOutlined />}>
                    Xóa cấu hình
                  </Button>
                </Popconfirm>,
                <Button onClick={() => handleEdit(item.id as string)} size="small" icon={<EditOutlined />} key="edit">
                  Chỉnh sửa
                </Button>,
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
      </div>
    </Drawer>
  );
};

export default ManageCourtPricingRuleTemplate;
