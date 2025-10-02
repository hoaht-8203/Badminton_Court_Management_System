"use client";

import { useDetailCourt, useListCourtPricingRuleTemplates, useUpdateCourt } from "@/hooks/useCourt";
import { useListCourtAreas } from "@/hooks/useCourtArea";
import { ApiError } from "@/lib/axios";
import { CreateCourtPricingRulesRequest, UpdateCourtRequest } from "@/types-openapi/api";
import {
  CalendarOutlined,
  CloseOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  HolderOutlined,
  InfoCircleOutlined,
  LoadingOutlined,
  SaveOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  Button,
  Carousel,
  Col,
  Divider,
  Drawer,
  Form,
  FormProps,
  Image,
  Input,
  InputNumber,
  List,
  message,
  Popconfirm,
  Row,
  Segmented,
  Select,
  Space,
  Spin,
  Tag,
  TimePicker,
  Typography,
  Upload,
} from "antd";
import { CarouselRef } from "antd/es/carousel";
import FormItem from "antd/es/form/FormItem";
import dayjs, { Dayjs } from "dayjs";
import { useEffect, useMemo, useRef, useState } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ManageCourtPricingRuleTemplateDrawer from "./manage-court-pricing-rule-template-drawer";
import CreateNewCourtAreaDrawer from "./create-new-court-area-drawer";
import { fileService } from "@/services/fileService";

interface UpdateCourtDrawerProps {
  open: boolean;
  onClose: () => void;
  courtId: string;
}

// Sortable Item Component
const SortableItem = ({ id, children }: { id: string; children: React.ReactNode }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          {...listeners}
          style={{
            cursor: "grab",
            padding: "4px",
            display: "flex",
            alignItems: "center",
            color: "#999",
          }}
        >
          <HolderOutlined />
        </div>
        <div style={{ flex: 1 }}>{children}</div>
      </div>
    </div>
  );
};

const UpdateCourtDrawer = ({ open, onClose, courtId }: UpdateCourtDrawerProps) => {
  const [form] = Form.useForm();
  const { data: detailData, isFetching: loadingDetail, refetch } = useDetailCourt({ id: courtId });
  const { data: courtAreas, isFetching: loadingCourtAreas } = useListCourtAreas();
  const updateMutation = useUpdateCourt();

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const {
    data: courtPricingRuleTemplates,
    isFetching: loadingCourtPricingRuleTemplates,
    refetch: refetchCourtPricingRuleTemplates,
  } = useListCourtPricingRuleTemplates();

  const [openCreateCourtAreaDrawer, setOpenCreateCourtAreaDrawer] = useState(false);
  const [openManageCourtPricingRuleTemplateDrawer, setOpenManageCourtPricingRuleTemplateDrawer] = useState(false);

  const [courtPricingRules, setCourtPricingRules] = useState<CreateCourtPricingRulesRequest[]>([]);
  const [newRuleDaysOfWeek, setNewRuleDaysOfWeek] = useState<number[]>([]);
  const [newRuleStartTime, setNewRuleStartTime] = useState<Dayjs | null>(null);
  const [newRuleEndTime, setNewRuleEndTime] = useState<Dayjs | null>(null);
  const [newRulePricePerHour, setNewRulePricePerHour] = useState<number | null>(null);
  const [isUsingPricingRuleTemplate, setIsUsingPricingRuleTemplate] = useState(false);
  const [courtImageUrl, setCourtImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [courtImageFileName, setCourtImageFileName] = useState<string | null>(null);

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

  const [activeSegment, setActiveSegment] = useState(1);
  const carouselRef = useRef<CarouselRef>(null);

  useEffect(() => {
    if (!detailData?.data || !open) return;
    const d = detailData.data;
    form.setFieldsValue({
      name: d.name ?? null,
      courtAreaId: d.courtAreaId ?? null,
      note: d.note ?? null,
      imageUrl: d.imageUrl ?? null,
    });

    setCourtImageUrl(d.imageUrl ?? null);

    if (Array.isArray(d.courtPricingRules)) {
      const mapped: CreateCourtPricingRulesRequest[] = d.courtPricingRules.map((r: any, index: number) => ({
        daysOfWeek: r.daysOfWeek,
        startTime: r.startTime,
        endTime: r.endTime,
        pricePerHour: r.pricePerHour,
        order: r.order || index + 1,
      }));
      setCourtPricingRules(mapped);
    } else {
      setCourtPricingRules([]);
    }
  }, [detailData, form, open]);

  useEffect(() => {
    if (open && courtId) {
      refetch();
    }
  }, [open, courtId, refetch]);

  const handleSubmit: FormProps<UpdateCourtRequest>["onFinish"] = (values) => {
    if (!courtPricingRules.length) {
      message.error("Bạn chưa cấu hình giá sân cầu lông theo khung giờ. Vui lòng thêm ít nhất 1 cấu hình giá");
      if (activeSegment !== 2) {
        setActiveSegment(2);
        carouselRef.current?.goTo(1);
      }
      return;
    }

    const payload: UpdateCourtRequest = {
      ...values,
      id: courtId,
      imageUrl: courtImageUrl ?? undefined,
      courtPricingRules: courtPricingRules,
    } as UpdateCourtRequest;

    updateMutation.mutate(payload, {
      onSuccess: () => {
        message.success("Cập nhật sân thành công!");
        form.resetFields();
        setCourtPricingRules([]);
        setNewRuleDaysOfWeek([]);
        setNewRuleStartTime(null);
        setNewRuleEndTime(null);
        setNewRulePricePerHour(null);
        setIsUsingPricingRuleTemplate(false);
        setActiveSegment(1);
        carouselRef.current?.goTo(0);
        onClose();
      },
      onError: (error: ApiError) => {
        if (error?.errors) {
          for (const key in error.errors) {
            message.error(error.errors[key]);
            form.setFields([{ name: key as any, errors: [error.errors[key]] }]);
          }
        } else if (error?.message) {
          message.error(error.message);
        }
      },
    });
  };

  const handleSubmitCourtPriceRule: FormProps<CreateCourtPricingRulesRequest>["onFinish"] = () => {
    if (!newRuleDaysOfWeek.length || !newRuleStartTime || !newRuleEndTime || newRulePricePerHour == null) {
      message.error("Vui lòng điền đầy đủ thông tin cấu hình giá sân cầu lông theo khung giờ");
      return;
    }
    if (newRuleStartTime.valueOf() >= newRuleEndTime.valueOf()) {
      message.error("Giờ bắt đầu phải trước giờ kết thúc giá sân cầu lông theo khung giờ");
      return;
    }
    const rule: CreateCourtPricingRulesRequest = {
      daysOfWeek: newRuleDaysOfWeek,
      startTime: dayjs(newRuleStartTime).format("HH:mm:ss"),
      endTime: dayjs(newRuleEndTime).format("HH:mm:ss"),
      pricePerHour: newRulePricePerHour,
      order: courtPricingRules.length + 1,
    };
    setCourtPricingRules((prev) => [...prev, rule]);
    setNewRuleDaysOfWeek([]);
    setNewRuleStartTime(null);
    setNewRuleEndTime(null);
    setNewRulePricePerHour(null);
  };

  const handleUsingPricingRuleTemplate = () => {
    refetchCourtPricingRuleTemplates();
    if (!courtPricingRuleTemplates) return;
    setIsUsingPricingRuleTemplate(true);
    setCourtPricingRules(
      courtPricingRuleTemplates.data?.map((template, index) => ({
        daysOfWeek: template.daysOfWeek,
        startTime: template.startTime,
        endTime: template.endTime,
        pricePerHour: template.pricePerHour,
        order: index + 1,
      })) || [],
    );
  };

  const handleCancelUsingPricingRuleTemplate = () => {
    setIsUsingPricingRuleTemplate(false);
  };

  // Handle drag end for reordering
  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setCourtPricingRules((items) => {
        const oldIndex = items.findIndex((item, index) => `item-${index}` === active.id);
        const newIndex = items.findIndex((item, index) => `item-${index}` === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);

        // Update order for all items
        return newItems.map((item, index) => ({
          ...item,
          order: index + 1,
        }));
      });
    }
  };

  const handleRemoveCourtImageUrl = () => {
    setCourtImageUrl(null);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await fileService.uploadFile(file);
      setCourtImageUrl(url.data?.publicUrl ?? null);
      setCourtImageFileName(url.data?.fileName ?? null);
      message.success("Upload ảnh thành công!");
      return false; // Prevent default upload behavior
    } catch (error) {
      message.error("Upload ảnh thất bại: " + (error as Error).message);
      return false;
    } finally {
      setUploading(false);
    }
  };

  const handleClose = async () => {
    form.resetFields();
    setCourtPricingRules([]);
    setNewRuleDaysOfWeek([]);
    setNewRuleStartTime(null);
    setNewRuleEndTime(null);
    setNewRulePricePerHour(null);
    setIsUsingPricingRuleTemplate(false);
    setActiveSegment(1);
    carouselRef.current?.goTo(0);

    try {
      if (courtImageFileName) {
        await fileService.deleteFile({ fileName: courtImageFileName });
      }
    } catch (error) {
      message.error("Xóa ảnh thất bại: " + (error as Error).message);
    } finally {
      setUploading(false);
    }

    onClose();
  };

  return (
    <>
      <Drawer
        title="Cập nhật sân"
        closable={{ "aria-label": "Close Button" }}
        onClose={handleClose}
        open={open}
        width={800}
        extra={
          <Space>
            <Button onClick={handleClose} icon={<CloseOutlined />}>
              Hủy
            </Button>
            <Button onClick={() => form.submit()} type="primary" icon={<SaveOutlined />} loading={updateMutation.isPending} disabled={loadingDetail}>
              Lưu thay đổi
            </Button>
          </Space>
        }
      >
        <Segmented
          value={activeSegment}
          options={[
            {
              label: "Cấu hình thông tin sân cầu lông",
              value: 1,
              icon: <InfoCircleOutlined />,
            },
            {
              label: "Cấu hình giá sân cầu lông theo khung giờ",
              value: 2,
              icon: <CalendarOutlined />,
            },
          ]}
          block
          onChange={(value: number) => {
            setActiveSegment(value);
            if (value === 1) {
              carouselRef.current?.goTo(0);
            } else {
              carouselRef.current?.goTo(1);
            }
            return value;
          }}
        />
        <Carousel infinite={false} ref={carouselRef} dots={false} draggable={false} adaptiveHeight>
          <div>
            <div>
              <Divider>Thông tin sân cầu lông</Divider>
              <Form form={form} onFinish={handleSubmit} layout="vertical">
                <Row gutter={16}>
                  <Col span={12}>
                    <FormItem<UpdateCourtRequest> name="name" label="Tên sân" rules={[{ required: true, message: "Tên sân là bắt buộc" }]}>
                      <Input placeholder="Nhập tên sân" />
                    </FormItem>
                  </Col>
                  <Col span={12}>
                    <FormItem<UpdateCourtRequest> name="courtAreaId" label="Khu vực" rules={[{ required: true, message: "Khu vực là bắt buộc" }]}>
                      <Select
                        placeholder="Chọn khu vực"
                        allowClear
                        options={courtAreas?.data?.map((ca) => ({ value: ca.id, label: ca.name }))}
                        loading={loadingCourtAreas}
                      />
                    </FormItem>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={24}>
                    <FormItem<UpdateCourtRequest> name="note" label="Ghi chú">
                      <Input.TextArea placeholder="Nhập ghi chú" rows={3} />
                    </FormItem>
                  </Col>
                </Row>

                <FormItem<UpdateCourtRequest> name="imageUrl" label="Ảnh sân cầu lông">
                  <Space direction="vertical" style={{ width: "100%" }}>
                    {courtImageUrl ? (
                      <Space>
                        <div className="flex items-center justify-center border border-dashed border-gray-300 p-1">
                          <Image
                            src={courtImageUrl}
                            alt="court preview"
                            style={{ width: 200, height: 200, objectFit: "cover" }}
                            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
                          />
                        </div>
                        <Button type="text" danger icon={<DeleteOutlined />} onClick={handleRemoveCourtImageUrl}>
                          Xóa ảnh
                        </Button>
                      </Space>
                    ) : (
                      <>
                        {uploading ? (
                          <div className="flex h-[200px] w-[200px] items-center justify-center border border-gray-300">
                            <Spin indicator={<LoadingOutlined spin />} />
                          </div>
                        ) : (
                          <Upload beforeUpload={handleUpload} showUploadList={false} accept="image/*" disabled={uploading}>
                            <Button icon={<UploadOutlined />} loading={uploading}>
                              {uploading ? "Đang upload..." : "Chọn ảnh sân cầu lông"}
                            </Button>
                          </Upload>
                        )}
                      </>
                    )}
                    <div style={{ fontSize: "12px", color: "#666" }}>Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WebP). Kích thước tối đa 100MB.</div>
                  </Space>
                </FormItem>
              </Form>
            </div>
          </div>
          <div>
            <div>
              <Divider>Cấu hình giá sân cầu lông theo khung giờ</Divider>
              <Form onFinish={handleSubmitCourtPriceRule} layout="vertical">
                <Row gutter={16} align="bottom">
                  <Col span={24}>
                    <FormItem<CreateCourtPricingRulesRequest>
                      label="Ngày trong tuần"
                      name="daysOfWeek"
                      rules={[{ required: true, message: "Ngày trong tuần là bắt buộc" }]}
                    >
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
                    <FormItem<CreateCourtPricingRulesRequest>
                      label="Giờ bắt đầu"
                      name="startTime"
                      rules={[{ required: true, message: "Giờ bắt đầu là bắt buộc" }]}
                    >
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
                    <FormItem<CreateCourtPricingRulesRequest>
                      label="Giá/giờ (₫)"
                      name="pricePerHour"
                      rules={[{ required: true, message: "Giá/giờ là bắt buộc" }]}
                    >
                      <InputNumber
                        min={0}
                        step={1000}
                        style={{ width: "100%" }}
                        name="pricePerHour"
                        value={newRulePricePerHour as number | null}
                        onChange={(v) => setNewRulePricePerHour(v as number | null)}
                        formatter={(value) => `${value}`.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                        parser={(value) => (value ? (value as string).replace(/\./g, "") : "") as unknown as number}
                      />
                    </FormItem>
                  </Col>
                  <Col span={24}>
                    <Space>
                      <Button type="dashed" icon={<UploadOutlined />} htmlType="submit">
                        Thêm cấu hình
                      </Button>

                      <Button variant="outlined" icon={<CopyOutlined />} onClick={handleUsingPricingRuleTemplate}>
                        Sử dụng cấu hình có sẵn
                      </Button>
                    </Space>
                  </Col>
                </Row>
              </Form>

              <>
                <Divider orientation="left">Danh sách cấu hình</Divider>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={courtPricingRules.map((_, index) => `item-${index}`)} strategy={verticalListSortingStrategy}>
                    <List
                      bordered
                      dataSource={courtPricingRules}
                      loading={loadingCourtPricingRuleTemplates}
                      header={
                        <>
                          {isUsingPricingRuleTemplate && (
                            <div className="flex gap-2">
                              <Button icon={<EditOutlined />} onClick={() => setOpenManageCourtPricingRuleTemplateDrawer(true)}>
                                Chỉnh sửa cấu hình mẫu
                              </Button>
                              <Button
                                icon={<CopyOutlined />}
                                onClick={() => {
                                  refetchCourtPricingRuleTemplates();
                                  if (!courtPricingRuleTemplates) return;
                                  setCourtPricingRules(
                                    courtPricingRuleTemplates?.data?.map((template, index) => ({
                                      daysOfWeek: template.daysOfWeek,
                                      startTime: template.startTime,
                                      endTime: template.endTime,
                                      pricePerHour: template.pricePerHour,
                                      order: index + 1,
                                    })) || [],
                                  );
                                }}
                              >
                                Tải lại dữ liệu mẫu
                              </Button>
                              <Button color="orange" variant="outlined" icon={<CloseOutlined />} onClick={handleCancelUsingPricingRuleTemplate}>
                                Huỷ sử dụng cấu hình mẫu
                              </Button>
                            </div>
                          )}
                        </>
                      }
                      renderItem={(item, index) => (
                        <SortableItem key={`item-${index}`} id={`item-${index}`}>
                          <List.Item
                            actions={[
                              <Popconfirm
                                key="remove"
                                title="Xóa cấu hình này?"
                                okText="Xóa"
                                cancelText="Hủy"
                                onConfirm={() => {
                                  setCourtPricingRules((prev) => {
                                    const newItems = prev.filter((_, i) => i !== index);
                                    // Reorder remaining items
                                    return newItems.map((item, newIndex) => ({
                                      ...item,
                                      order: newIndex + 1,
                                    }));
                                  });
                                }}
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
                                {`Khung giờ: ${item.startTime} - ${item.endTime} | Giá: ${item.pricePerHour.toLocaleString("vi-VN")}₫/giờ | Thứ tự: ${item.order}`}
                              </Typography.Text>
                            </Space>
                          </List.Item>
                        </SortableItem>
                      )}
                    />
                  </SortableContext>
                </DndContext>
              </>
            </div>
          </div>
        </Carousel>
      </Drawer>

      <CreateNewCourtAreaDrawer open={openCreateCourtAreaDrawer} onClose={() => setOpenCreateCourtAreaDrawer(false)} />
      <ManageCourtPricingRuleTemplateDrawer
        open={openManageCourtPricingRuleTemplateDrawer}
        onClose={() => {
          setOpenManageCourtPricingRuleTemplateDrawer(false);
          refetchCourtPricingRuleTemplates();
          if (!courtPricingRuleTemplates) return;
          setCourtPricingRules(
            courtPricingRuleTemplates?.data?.map((template, index) => ({
              daysOfWeek: template.daysOfWeek,
              startTime: template.startTime,
              endTime: template.endTime,
              pricePerHour: template.pricePerHour,
              order: index + 1,
            })) || [],
          );
        }}
      />
    </>
  );
};

export default UpdateCourtDrawer;
