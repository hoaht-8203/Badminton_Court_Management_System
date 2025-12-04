import { useListCourts, useListCourtPricingRuleByCourtId } from "@/hooks/useCourt";
import { customerService } from "@/services/customerService";
import { CreateBookingCourtRequest, DetailBookingCourtResponse, DetailCustomerResponse } from "@/types-openapi/api";
import { Card, Checkbox, Col, DatePicker, Descriptions, Form, FormProps, Input, message, Modal, Radio, Row, Select, TimePicker, Button } from "antd";
import { CheckboxGroupProps } from "antd/es/checkbox";
import FormItem from "antd/es/form/FormItem";
import dayjs from "dayjs";
import { DayPilot } from "daypilot-pro-react";
import { useEffect, useMemo, useState } from "react";
import { DebounceSelect } from "./DebounceSelect";
import { useGetAvailableVouchers, useValidateVoucher } from "@/hooks/useVouchers";
import { ApiError } from "@/lib/axios";
import { useCreateBookingCourt } from "@/hooks/useBookingCourt";
import QrPaymentDrawer from "./qr-payment-drawer";

interface ModelCreateNewBookingProps {
  open: boolean;
  onClose: () => void;
  newBooking: {
    start: DayPilot.Date;
    end: DayPilot.Date;
    resource: string;
  } | null;
  userMode?: boolean; // For user-only mode (only online payment)
}

interface CustomerOption {
  label: string;
  value: number;
  avatar: string;
}

const { RangePicker } = DatePicker;

const createBookingCourtDaysOfWeekOptions: CheckboxGroupProps<string>["options"] = [
  { label: "Đặt lịch vãng lai", value: "1" },
  { label: "Đặt lịch cố định", value: "2" },
];

const daysOfWeekOptions = [
  { label: "T2", value: 2 },
  { label: "T3", value: 3 },
  { label: "T4", value: 4 },
  { label: "T5", value: 5 },
  { label: "T6", value: 6 },
  { label: "T7", value: 7 },
  { label: "CN", value: 8 },
];

const ModalCreateNewBooking = ({ open, onClose, newBooking, userMode = false }: ModelCreateNewBookingProps) => {
  const [form] = Form.useForm();
  const startDateWatch = Form.useWatch("startDate", form);
  const dateRangeWatch = Form.useWatch(["_internal", "dateRange"], form);
  const startTimeWatch = Form.useWatch("startTime", form);
  const endTimeWatch = Form.useWatch("endTime", form);
  const customerWatch = Form.useWatch("customerId", form);
  const courtWatch = Form.useWatch("courtId", form);
  const [payInFull, setPayInFull] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<"Bank" | "Cash">(userMode ? "Bank" : "Bank");
  const totalHoursPlay = useMemo(() => {
    return (endTimeWatch?.diff(startTimeWatch, "hour") ?? 0).toFixed(1);
  }, [startTimeWatch, endTimeWatch]);

  const [createBookingCourtDaysOfWeek, setCreateBookingCourtDaysOfWeek] = useState<string>("1");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [customerInfo, setCustomerInfo] = useState<DetailCustomerResponse | null>(null);

  const { data: courts } = useListCourts({});
  const { data: pricingRules } = useListCourtPricingRuleByCourtId({ courtId: courtWatch || "" });
  const createMutation = useCreateBookingCourt();
  const [openQr, setOpenQr] = useState(false);
  const [createdDetail, setCreatedDetail] = useState<DetailBookingCourtResponse | null>(null);
  const [selectedVoucherId, setSelectedVoucherId] = useState<number | null>(null);
  const [voucherDiscount, setVoucherDiscount] = useState<number>(0);
  const availableVouchers = useGetAvailableVouchers();
  const validateVoucherMutation = useValidateVoucher();
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [modalSelectedVoucherId, setModalSelectedVoucherId] = useState<number | null>(null);
  const [modalValidateLoading, setModalValidateLoading] = useState(false);

  // Tổng số buổi trong khoảng ngày theo các thứ đã chọn (chỉ cho chế độ cố định)
  const totalSessions = useMemo(() => {
    if (createBookingCourtDaysOfWeek === "1") {
      return startDateWatch ? 1 : 0;
    }
    const selectedDays = daysOfWeek?.length ? daysOfWeek : [];
    const [rangeStart, rangeEnd] = (dateRangeWatch || []) as [any, any];
    if (!rangeStart || !rangeEnd || selectedDays.length === 0) return 0;

    let count = 0;
    let cursor = rangeStart.startOf("day");
    const end = rangeEnd.endOf("day");
    while (cursor.isBefore(end) || cursor.isSame(end, "day")) {
      const jsDay = cursor.day();
      const dow = jsDay === 0 ? 8 : jsDay + 1;
      if (selectedDays.includes(dow)) {
        count += 1;
      }
      cursor = cursor.add(1, "day");
    }
    return count;
  }, [createBookingCourtDaysOfWeek, startDateWatch, daysOfWeek, dateRangeWatch]);

  // Tính toán số tiền dựa trên pricing rules theo order
  const calculatedPrice = useMemo(() => {
    if (!startTimeWatch || !endTimeWatch || !pricingRules?.data) {
      return 0;
    }

    const startTimeStr = startTimeWatch.format("HH:mm");
    const endTimeStr = endTimeWatch.format("HH:mm");

    const sortedRules = [...pricingRules.data].sort((a, b) => (a.order || 0) - (b.order || 0));

    const computePriceForDay = (dayOfWeek: number) => {
      let totalPriceForDay = 0;
      let currentTime = startTimeStr;

      while (currentTime < endTimeStr) {
        const applicableRule = sortedRules.find((rule) => {
          if (rule.daysOfWeek && !rule.daysOfWeek.includes(dayOfWeek)) {
            return false;
          }
          const ruleStartTime = rule.startTime.substring(0, 5);
          const ruleEndTime = rule.endTime.substring(0, 5);
          return currentTime >= ruleStartTime && currentTime < ruleEndTime;
        });

        if (!applicableRule) {
          break;
        }

        const ruleEndTime = applicableRule.endTime.substring(0, 5);
        const actualEndTime = ruleEndTime < endTimeStr ? ruleEndTime : endTimeStr;

        const startMinutes = parseInt(currentTime.split(":")[0]) * 60 + parseInt(currentTime.split(":")[1]);
        const endMinutes = parseInt(actualEndTime.split(":")[0]) * 60 + parseInt(actualEndTime.split(":")[1]);
        const hoursInThisRule = (endMinutes - startMinutes) / 60;

        const priceForThisPeriod = hoursInThisRule * applicableRule.pricePerHour;
        totalPriceForDay += priceForThisPeriod;

        currentTime = actualEndTime;
      }

      return totalPriceForDay;
    };

    // Vãng lai: dựa trên ngày startDate hiện tại
    if (createBookingCourtDaysOfWeek === "1") {
      if (!startDateWatch) return 0;
      const jsDay = startDateWatch.day();
      const dayOfWeek = jsDay === 0 ? 8 : jsDay + 1;
      return Math.round(computePriceForDay(dayOfWeek));
    }

    // Cố định: cộng tổng trên toàn bộ khoảng ngày và các thứ đã chọn
    const selectedDays = daysOfWeek?.length ? daysOfWeek : [];
    const [rangeStart, rangeEnd] = (dateRangeWatch || []) as [any, any];
    if (!rangeStart || !rangeEnd || selectedDays.length === 0) return 0;

    let total = 0;
    let cursor = rangeStart.startOf("day");
    const end = rangeEnd.endOf("day");

    while (cursor.isBefore(end) || cursor.isSame(end, "day")) {
      const jsDay = cursor.day();
      const dow = jsDay === 0 ? 8 : jsDay + 1;
      if (selectedDays.includes(dow)) {
        total += computePriceForDay(dow);
      }
      cursor = cursor.add(1, "day");
    }

    return Math.round(total);
  }, [startTimeWatch, endTimeWatch, pricingRules, startDateWatch, createBookingCourtDaysOfWeek, daysOfWeek, dateRangeWatch]);

  // Tổng tiền toàn bộ = calculatedPrice (đã bao gồm logic vãng lai/cố định)
  const fullAmount = useMemo(() => {
    return calculatedPrice;
  }, [calculatedPrice]);

  const depositPercent = 0.3; // 30% default
  // Deposit should be calculated from the discounted total: (fullAmount - voucherDiscount) * depositPercent
  const discountedTotal = useMemo(() => {
    return Math.max(fullAmount - (voucherDiscount ?? 0), 0);
  }, [fullAmount, voucherDiscount]);

  const depositAmount = useMemo(() => {
    return Math.round((discountedTotal * depositPercent + Number.EPSILON) * 100) / 100;
  }, [discountedTotal]);

  const handleCreateBooking: FormProps<CreateBookingCourtRequest>["onFinish"] = (values) => {
    const dateRange = form.getFieldValue(["_internal", "dateRange"]) as [any, any] | undefined;
    const isFixedSchedule = createBookingCourtDaysOfWeek === "2";

    const payload: CreateBookingCourtRequest & {
      payInFull?: boolean;
      depositPercent?: number;
      paymentMethod?: string;
    } = {
      ...values,
      customerId: customerWatch.value,
      startDate:
        isFixedSchedule && dateRange?.[0]
          ? new Date(dayjs(dateRange[0]).format("YYYY-MM-DD"))
          : new Date(dayjs(values.startDate).format("YYYY-MM-DD")),
      endDate:
        isFixedSchedule && dateRange?.[1]
          ? new Date(dayjs(dateRange[1]).format("YYYY-MM-DD"))
          : new Date(dayjs(values.startDate).format("YYYY-MM-DD")),
      startTime: dayjs(values.startTime).format("HH:mm:ss"),
      endTime: dayjs(values.endTime).format("HH:mm:ss"),
      daysOfWeek: isFixedSchedule ? values.daysOfWeek : undefined,
      note: values.note,
      payInFull: payInFull,
      depositPercent: depositPercent,
      paymentMethod: paymentMethod,
    };

    const payloadAny: any = { ...payload } as any;
    if (selectedVoucherId) {
      payloadAny.voucherId = selectedVoucherId;
      payloadAny.discountAmount = voucherDiscount;
    }

    createMutation.mutate(payloadAny, {
      onSuccess: (res) => {
        message.success("Đặt sân thành công!");
        const detail = res.data as DetailBookingCourtResponse | undefined;
        // Close the create modal first
        handleClose();
        // If API returns QR info (transfer flow), open Drawer with returned detail
        if (detail && (detail.qrUrl || detail.paymentId)) {
          setCreatedDetail(detail);
          setOpenQr(true);
        }
      },
      onError: (error: ApiError) => {
        message.error(error.message);
      },
    });
  };

  const fetchCustomers = async (search: string): Promise<CustomerOption[]> => {
    const res = await customerService.listCustomerPaged({
      page: 1,
      pageSize: 30,
      keyword: search || null,
    });

    return (
      res.data?.items.map((customer) => ({
        label: customer.fullName ?? "",
        value: customer.id ?? 0,
        avatar: customer.avatarUrl ?? "",
      })) ?? []
    );
  };

  const handleClose = () => {
    form.resetFields();
    setCreateBookingCourtDaysOfWeek("1");
    setDaysOfWeek([]);
    setPayInFull(false);
    setPaymentMethod("Bank");
    onClose();
  };

  // Sync form values whenever a new time range is selected
  useEffect(() => {
    if (!open || !newBooking) return;

    const start = dayjs(newBooking.start.toString());
    const end = dayjs(newBooking.end.toString());
    const defaultRangeEnd = start.add(1, "month");

    // reset mode and selections when opening a new booking
    setCreateBookingCourtDaysOfWeek("1");
    setDaysOfWeek([]);

    form.setFieldsValue({
      courtId: newBooking.resource,
      startDate: start,
      startTime: start,
      endTime: end,
      _internal: { dateRange: [start, defaultRangeEnd] },
    });
  }, [open, newBooking, form]);

  useEffect(() => {
    const fetchCustomerInfo = async () => {
      if (customerWatch && customerWatch.value) {
        const customer = await customerService.detailCustomer({ id: customerWatch.value });
        setCustomerInfo(customer.data ?? null);
      } else {
        setCustomerInfo(null);
      }
    };
    fetchCustomerInfo();
  }, [customerWatch]);

  // Hiển thị message error khi không tìm thấy pricing rule
  useEffect(() => {
    if (calculatedPrice === 0 && startTimeWatch && endTimeWatch && pricingRules?.data && startDateWatch) {
      // Kiểm tra xem có phải do không tìm thấy rule không
      const jsDay = startDateWatch.day();
      const dayOfWeek = jsDay === 0 ? 8 : jsDay + 1;
      const startTimeStr = startTimeWatch.format("HH:mm");

      const hasApplicableRule = pricingRules.data.some((rule) => {
        if (rule.daysOfWeek && !rule.daysOfWeek.includes(dayOfWeek)) {
          return false;
        }
        const ruleStartTime = rule.startTime.substring(0, 5);
        const ruleEndTime = rule.endTime.substring(0, 5);
        return startTimeStr >= ruleStartTime && startTimeStr < ruleEndTime;
      });

      if (!hasApplicableRule) {
        message.warning("Không tìm thấy rule phù hợp cho thời gian đặt sân");
      }
    }
  }, [calculatedPrice, startTimeWatch, endTimeWatch, pricingRules, startDateWatch]);

  return (
    <div>
      <Modal
        title="Thêm mới lịch đặt sân cầu lông"
        maskClosable={false}
        centered
        open={open}
        onOk={() => {
          form.submit();
        }}
        onCancel={handleClose}
        okText="Đặt sân"
        cancelText="Bỏ qua"
        width={1700}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            customerId: undefined,
            courtId: newBooking?.resource,
            startDate: dayjs(newBooking?.start.toString()),
            startTime: dayjs(newBooking?.start.toString()),
            endTime: dayjs(newBooking?.end.toString()),
          }}
          onFinish={handleCreateBooking}
        >
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <FormItem<CreateBookingCourtRequest>
                    name="customerId"
                    label="Khách hàng"
                    rules={[{ required: true, message: "Khách hàng là bắt buộc" }]}
                  >
                    <DebounceSelect showSearch placeholder="Chọn khách hàng" fetchOptions={fetchCustomers} style={{ width: "100%" }} />
                  </FormItem>
                </Col>

                <Col span={12}>
                  <FormItem<CreateBookingCourtRequest> name="courtId" label="Sân" rules={[{ required: true, message: "Sân là bắt buộc" }]}>
                    <Select disabled={true} placeholder="Chọn sân" options={courts?.data?.map((court) => ({ value: court.id, label: court.name }))} />
                  </FormItem>
                </Col>

                <Col span={24}>
                  <FormItem<CreateBookingCourtRequest> name="note" label="Ghi chú">
                    <Input.TextArea placeholder="Nhập ghi chú" />
                  </FormItem>
                </Col>

                <Col span={24}>
                  <Radio.Group
                    block
                    options={createBookingCourtDaysOfWeekOptions}
                    value={createBookingCourtDaysOfWeek}
                    optionType="button"
                    buttonStyle="solid"
                    onChange={(e) => {
                      setCreateBookingCourtDaysOfWeek(e.target.value);
                    }}
                  />
                </Col>

                <Col span={24}>
                  {createBookingCourtDaysOfWeek === "1" && (
                    <Card>
                      <Row gutter={16}>
                        <Col span={8}>
                          <FormItem<CreateBookingCourtRequest>
                            name="startDate"
                            label="Ngày đặt sân"
                            rules={[{ required: true, message: "Ngày đặt sân là bắt buộc" }]}
                          >
                            <DatePicker
                              placeholder="Chọn ngày bắt đầu"
                              format="DD/MM/YYYY"
                              style={{ width: "100%" }}
                              disabledDate={(current) => current && current < dayjs().startOf("day")}
                            />
                          </FormItem>
                        </Col>
                        <Col span={8}>
                          <FormItem<CreateBookingCourtRequest>
                            name="startTime"
                            label="Giờ bắt đầu"
                            dependencies={["endTime"]}
                            rules={[
                              { required: true, message: "Giờ bắt đầu là bắt buộc" },
                              {
                                validator: (_, value) => {
                                  // must check is after or equal
                                  if ((value && endTimeWatch && value.isAfter(endTimeWatch)) || value?.isSame?.(endTimeWatch)) {
                                    return Promise.reject(new Error("Giờ bắt đầu phải trước giờ kết thúc"));
                                  }
                                  // prevent past time when selected date is today
                                  // if (value && startDateWatch && startDateWatch.isSame(dayjs(), "day") && value.isBefore(dayjs())) {
                                  //   return Promise.reject(new Error("Giờ bắt đầu không được trong quá khứ hôm nay"));
                                  // }
                                  return Promise.resolve();
                                },
                              },
                            ]}
                          >
                            <TimePicker
                              placeholder="Chọn giờ bắt đầu"
                              format="HH:mm"
                              showNow={false}
                              style={{ width: "100%" }}
                              onChange={() => {
                                // revalidate counterpart to clear stale error
                                form.validateFields(["endTime"]).catch(() => undefined);
                              }}
                            />
                          </FormItem>
                        </Col>
                        <Col span={8}>
                          <FormItem<CreateBookingCourtRequest>
                            name="endTime"
                            label="Giờ kết thúc"
                            dependencies={["startTime"]}
                            rules={[
                              { required: true, message: "Giờ kết thúc là bắt buộc" },
                              {
                                validator: (_, value) => {
                                  if (value && startTimeWatch && value.isBefore(startTimeWatch)) {
                                    return Promise.reject(new Error("Giờ kết thúc phải sau giờ bắt đầu"));
                                  }
                                  // prevent past time when selected date is today
                                  // if (value && startDateWatch && startDateWatch.isSame(dayjs(), "day") && value.isBefore(dayjs())) {
                                  //   return Promise.reject(new Error("Giờ kết thúc không được trong quá khứ hôm nay"));
                                  // }
                                  return Promise.resolve();
                                },
                              },
                            ]}
                          >
                            <TimePicker
                              placeholder="Chọn giờ kết thúc"
                              format="HH:mm"
                              style={{ width: "100%" }}
                              onChange={() => {
                                form.validateFields(["startTime"]).catch(() => undefined);
                              }}
                            />
                          </FormItem>
                        </Col>
                      </Row>
                    </Card>
                  )}
                  {createBookingCourtDaysOfWeek === "2" && (
                    <Card>
                      <Row gutter={16}>
                        <Col span={12}>
                          <FormItem
                            name={["_internal", "dateRange"]}
                            label="Khoảng ngày"
                            rules={[{ required: true, message: "Khoảng ngày là bắt buộc" }]}
                          >
                            <RangePicker
                              placeholder={["Chọn ngày bắt đầu", "Chọn ngày kết thúc"]}
                              format="DD/MM/YYYY"
                              style={{ width: "100%" }}
                              disabledDate={(current) => current && current < dayjs().startOf("day")}
                            />
                          </FormItem>
                        </Col>
                        <Col span={6}>
                          <FormItem<CreateBookingCourtRequest>
                            name="startTime"
                            label="Giờ bắt đầu"
                            rules={[
                              { required: true, message: "Giờ bắt đầu là bắt buộc" },
                              {
                                validator: (_, value) => {
                                  const [rangeStart] = (dateRangeWatch || []) as [any, any];
                                  if (value && rangeStart && rangeStart.isSame(dayjs(), "day") && value.isBefore(dayjs())) {
                                    // return Promise.reject(new Error("Giờ bắt đầu không được trong quá khứ hôm nay"));
                                  }
                                  return Promise.resolve();
                                },
                              },
                            ]}
                          >
                            <TimePicker placeholder="Chọn giờ bắt đầu" style={{ width: "100%" }} />
                          </FormItem>
                        </Col>
                        <Col span={6}>
                          <FormItem<CreateBookingCourtRequest>
                            name="endTime"
                            label="Giờ kết thúc"
                            rules={[
                              { required: true, message: "Giờ kết thúc là bắt buộc" },
                              {
                                validator: (_, value) => {
                                  const [rangeStart] = (dateRangeWatch || []) as [any, any];
                                  if (value && rangeStart && rangeStart.isSame(dayjs(), "day") && value.isBefore(dayjs())) {
                                    return Promise.reject(new Error("Giờ kết thúc không được trong quá khứ hôm nay"));
                                  }
                                  return Promise.resolve();
                                },
                              },
                            ]}
                          >
                            <TimePicker placeholder="Chọn giờ kết thúc" style={{ width: "100%" }} />
                          </FormItem>
                        </Col>
                        <Col span={24}>
                          <FormItem<CreateBookingCourtRequest>
                            name="daysOfWeek"
                            label="Ngày trong tuần"
                            rules={[{ required: true, message: "Ngày trong tuần là bắt buộc" }]}
                          >
                            <Select
                              mode="multiple"
                              placeholder="Chọn ngày trong tuần"
                              value={daysOfWeek}
                              options={daysOfWeekOptions}
                              onChange={(vals) => setDaysOfWeek(vals)}
                            />
                          </FormItem>
                        </Col>
                      </Row>
                    </Card>
                  )}
                </Col>
              </Row>
            </Col>

            <Col span={12}>
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  {createBookingCourtDaysOfWeek === "1" && (
                    <Descriptions
                      title="Thông tin đặt sân"
                      bordered
                      size="small"
                      column={2}
                      items={[
                        {
                          key: "0",
                          label: "Kiểu đặt sân",
                          children: "Đặt lịch vãng lai",
                          span: 2,
                        },
                        {
                          key: "1",
                          label: "Khách hàng",
                          children: customerInfo ? `${customerInfo?.fullName}` : "-",
                          span: 1,
                        },
                        {
                          key: "2",
                          label: "Số điện thoại",
                          children: customerInfo ? `${customerInfo?.phoneNumber}` : "-",
                          span: 1,
                        },
                        {
                          key: "3",
                          label: "Sân",
                          children: courts?.data?.find((court) => court.id === courtWatch)?.name ?? "-",
                          span: 2,
                        },
                        {
                          key: "4",
                          label: "Ngày đặt sân",
                          children: `${startDateWatch?.format?.("dddd")}, ngày ${startDateWatch?.format?.("DD")} tháng ${startDateWatch?.format?.("MM")} năm ${startDateWatch?.format?.("YYYY")}`,
                          span: 2,
                        },
                        {
                          key: "5",
                          label: "Giờ bắt đầu",
                          children: startTimeWatch?.format?.("HH:mm") ?? "-",
                          span: 1,
                          style: { color: startTimeWatch?.isSame(endTimeWatch) || startTimeWatch?.isAfter(endTimeWatch) ? "red" : "inherit" },
                        },
                        {
                          key: "6",
                          label: "Giờ kết thúc",
                          children: endTimeWatch?.format?.("HH:mm") ?? "-",
                          span: 1,
                          style: { color: endTimeWatch?.isSame(startTimeWatch) || endTimeWatch?.isBefore(startTimeWatch) ? "red" : "inherit" },
                        },
                        {
                          key: "7",
                          label: "Tổng số giờ đặt sân",
                          children: `${totalHoursPlay} giờ`,
                          span: 1,
                          style: { color: totalHoursPlay < 1 ? "red" : "inherit" },
                        },
                        {
                          key: "8",
                          label: "Tổng số tiền cần trả (tạm tính)",
                          children: calculatedPrice > 0 ? `${calculatedPrice.toLocaleString("vi-VN")} đ` : "Chưa xác định",
                          span: 1,
                          style: {
                            color: calculatedPrice > 0 ? "inherit" : "orange",
                            fontWeight: calculatedPrice > 0 ? "bold" : "normal",
                          },
                        },
                      ]}
                    />
                  )}

                  {createBookingCourtDaysOfWeek === "2" && (
                    <Descriptions
                      title="Thông tin đặt sân"
                      bordered
                      size="small"
                      column={2}
                      items={[
                        {
                          key: "0",
                          label: "Kiểu đặt sân",
                          children: "Đặt lịch cố định",
                          span: 2,
                        },
                        {
                          key: "1",
                          label: "Khách hàng",
                          children: customerInfo ? `${customerInfo?.fullName}` : "-",
                          span: 1,
                        },
                        {
                          key: "2",
                          label: "Số điện thoại",
                          children: customerInfo ? `${customerInfo?.phoneNumber}` : "-",
                          span: 1,
                        },
                        {
                          key: "3",
                          label: "Sân",
                          children: courts?.data?.find((court) => court.id === courtWatch)?.name ?? "-",
                          span: 2,
                        },
                        {
                          key: "4",
                          label: "Khoảng ngày",
                          children:
                            dateRangeWatch && dateRangeWatch[0] && dateRangeWatch[1]
                              ? `${dateRangeWatch[0].format("DD/MM/YYYY")} - ${dateRangeWatch[1].format("DD/MM/YYYY")}`
                              : "-",
                          span: 2,
                        },
                        {
                          key: "5",
                          label: "Giờ bắt đầu",
                          children: startTimeWatch?.format?.("HH:mm") ?? "-",
                          span: 1,
                        },
                        {
                          key: "6",
                          label: "Giờ kết thúc",
                          children: endTimeWatch?.format?.("HH:mm") ?? "-",
                          span: 1,
                        },
                        {
                          key: "7",
                          label: "Tổng số buổi",
                          children: `${totalSessions} buổi`,
                          span: 1,
                        },
                        {
                          key: "8",
                          label: "Tổng số giờ mỗi buổi",
                          children: `${totalHoursPlay} giờ`,
                          span: 1,
                          style: { color: totalHoursPlay < 1 ? "red" : "inherit" },
                        },
                        {
                          key: "9",
                          label: "Tổng số tiền cần trả (tạm tính)",
                          children: calculatedPrice > 0 ? `${calculatedPrice.toLocaleString("vi-VN")} đ` : "Chưa xác định",
                          span: 1,
                          style: {
                            color: calculatedPrice > 0 ? "inherit" : "orange",
                            fontWeight: calculatedPrice > 0 ? "bold" : "normal",
                          },
                        },
                      ]}
                    />
                  )}
                </Col>

                <Col span={24}>
                  <FormItem label="Voucher (áp dụng)">
                    <Row gutter={8} align="middle">
                      <Col span={12}>
                        {selectedVoucherId ? (
                          (() => {
                            const v = availableVouchers?.data?.data?.find((x) => x.id === selectedVoucherId);
                            const label = v
                              ? `${v.code ?? v.title ?? "Voucher"} ${v.discountValue ? `- ${v.discountValue}đ` : v.discountPercentage ? `- ${v.discountPercentage}%` : ""}`
                              : `Voucher #${selectedVoucherId}`;
                            return (
                              <div>
                                <div style={{ fontWeight: 600 }}>{label}</div>
                                <div style={{ color: "#888", fontSize: 12 }}>
                                  {voucherDiscount > 0 ? `Giảm -${voucherDiscount.toLocaleString("vi-VN")} đ` : "Đang kiểm tra..."}
                                </div>
                              </div>
                            );
                          })()
                        ) : (
                          <div style={{ color: "#666" }}>Chưa chọn voucher</div>
                        )}
                      </Col>
                      <Col span={6}>
                        <Button
                          onClick={() => {
                            setModalSelectedVoucherId(selectedVoucherId);
                            setVoucherModalOpen(true);
                          }}
                        >
                          Chọn voucher
                        </Button>
                      </Col>
                      <Col span={6}>
                        <Button
                          onClick={() => {
                            setSelectedVoucherId(null);
                            setVoucherDiscount(0);
                            setModalSelectedVoucherId(null);
                          }}
                        >
                          Xóa
                        </Button>
                      </Col>
                    </Row>

                    <Modal
                      title="Chọn voucher"
                      open={voucherModalOpen}
                      onCancel={() => setVoucherModalOpen(false)}
                      okText="Đóng"
                      onOk={() => setVoucherModalOpen(false)}
                    >
                      <Radio.Group
                        style={{ width: "100%" }}
                        value={modalSelectedVoucherId ?? undefined}
                        onChange={(e) => {
                          const val = e.target.value as number | null;
                          setModalSelectedVoucherId(val ?? null);

                          if (!val) {
                            setSelectedVoucherId(null);
                            setVoucherDiscount(0);
                            return;
                          }

                          setModalValidateLoading(true);

                          const startDateVal = form.getFieldValue("startDate");
                          const startTimeVal = form.getFieldValue("startTime");
                          const endTimeVal = form.getFieldValue("endTime");

                          const bookingDate = startDateVal ? new Date(dayjs(startDateVal).format("YYYY-MM-DD")) : undefined;
                          const bookingStartTime = startTimeVal ? dayjs(startTimeVal).format("HH:mm:ss") : undefined;
                          const bookingEndTime = endTimeVal ? dayjs(endTimeVal).format("HH:mm:ss") : undefined;

                          const validatePayload: any = {
                            voucherId: val,
                            orderTotalAmount: fullAmount,
                            customerId: customerWatch?.value,
                            bookingDate,
                            bookingStartTime,
                            bookingEndTime,
                          };

                          validateVoucherMutation.mutate(validatePayload, {
                            onSuccess: (res) => {
                              const api = res as any;
                              const result = api?.data ?? null;
                              if (!api?.success || !result || result?.isValid === false) {
                                // Priority: api.message (from ErrorResponse) > result.errorMessage > fallback
                                const errorMsg = api?.message || result?.errorMessage || "Voucher không hợp lệ";
                                message.error(errorMsg);
                                setSelectedVoucherId(null);
                                setVoucherDiscount(0);
                                return;
                              }
                              const discount = result?.discountAmount ?? 0;
                              setSelectedVoucherId(val);
                              setVoucherDiscount(discount);
                            },
                            onError: (err: any) => {
                              // err.message is already extracted from API response by axios interceptor
                              message.error(err?.message || "Voucher không hợp lệ");
                              setSelectedVoucherId(null);
                              setVoucherDiscount(0);
                            },
                            onSettled: () => setModalValidateLoading(false),
                          });
                        }}
                      >
                        <div style={{ maxHeight: 360, overflow: "auto" }}>
                          {(availableVouchers?.data?.data ?? []).map((v) => (
                            <div key={v.id} style={{ padding: 12, borderBottom: "1px solid #f0f0f0" }}>
                              <Radio value={v.id} style={{ display: "block" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <div>
                                    <div style={{ fontWeight: 600 }}>{v.code ?? v.title}</div>
                                    <div style={{ color: "#666", fontSize: 12 }}>{v.description}</div>
                                  </div>
                                  <div style={{ textAlign: "right" }}>
                                    <div style={{ fontWeight: 700 }}>
                                      {v.discountValue
                                        ? `${v.discountValue.toLocaleString("vi-VN")} đ`
                                        : v.discountPercentage
                                          ? `${v.discountPercentage}%`
                                          : ""}
                                    </div>
                                    <div style={{ color: "#999", fontSize: 12 }}>
                                      {v.endAt ? `Hết hạn: ${dayjs(v.endAt).format("DD/MM/YYYY")}` : ""}
                                    </div>
                                  </div>
                                </div>
                              </Radio>
                            </div>
                          ))}
                        </div>
                      </Radio.Group>
                      {modalValidateLoading && <div style={{ marginTop: 8, color: "#666" }}>Đang kiểm tra voucher...</div>}
                    </Modal>
                  </FormItem>

                  <Card title="Thông tin thanh toán">
                    <Row gutter={[8, 8]}>
                      <Col span={24}>
                        <Checkbox checked={payInFull} onChange={(e) => setPayInFull(e.target.checked)}>
                          Thanh toán toàn bộ
                        </Checkbox>
                      </Col>
                      <Col span={24}>
                        <FormItem label="Phương thức" required>
                          <Select
                            value={paymentMethod}
                            onChange={(val: "Bank" | "Cash") => setPaymentMethod(val)}
                            disabled={userMode}
                            options={
                              userMode
                                ? [{ value: "Bank", label: "Ngân hàng (chuyển khoản)" }]
                                : [
                                    { value: "Bank", label: "Ngân hàng (chuyển khoản)" },
                                    { value: "Cash", label: "Tiền mặt" },
                                  ]
                            }
                          />
                        </FormItem>
                      </Col>
                      <Col span={24}>
                        <Descriptions
                          bordered
                          size="small"
                          column={1}
                          items={[
                            {
                              key: "amount-discounted",
                              label: "Tổng sau chiết khấu",
                              children: discountedTotal > 0 ? `${discountedTotal.toLocaleString("vi-VN")} đ` : "-",
                            },
                            {
                              key: "amount-deposit",
                              label: "Số tiền cọc (30%)",
                              children: depositAmount > 0 ? `${depositAmount.toLocaleString("vi-VN")} đ` : "-",
                            },
                            {
                              key: "voucher-discount",
                              label: "Giảm voucher",
                              children: voucherDiscount > 0 ? `- ${voucherDiscount.toLocaleString("vi-VN")} đ` : "-",
                            },
                            {
                              key: "amount-full",
                              label: "Tổng tiền",
                              children: fullAmount > 0 ? `${fullAmount.toLocaleString("vi-VN")} đ` : "-",
                            },
                            {
                              key: "amount-pay-now",
                              label: "Cần thanh toán",
                              children:
                                Math.max(payInFull ? fullAmount - (voucherDiscount ?? 0) : depositAmount, 0) > 0
                                  ? `${Math.max(payInFull ? fullAmount - (voucherDiscount ?? 0) : depositAmount, 0).toLocaleString("vi-VN")} đ`
                                  : "-",
                            },
                          ]}
                        />
                      </Col>
                    </Row>
                  </Card>
                </Col>
              </Row>
            </Col>
          </Row>
        </Form>
      </Modal>

      <QrPaymentDrawer
        bookingDetail={createdDetail}
        open={openQr}
        onClose={() => {
          setOpenQr(false);
          setCreatedDetail(null);
          handleClose();
        }}
        title="Thanh toán chuyển khoản"
        width={560}
      />
    </div>
  );
};

export default ModalCreateNewBooking;
