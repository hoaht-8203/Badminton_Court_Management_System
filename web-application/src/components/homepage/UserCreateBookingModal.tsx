"use client";

import { useListCourts, useListCourtPricingRuleByCourtId } from "@/hooks/useCourt";
import { UserCreateBookingCourtRequest, DetailBookingCourtResponse } from "@/types-openapi/api";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Descriptions,
  Form,
  FormProps,
  Input,
  message,
  Modal,
  Radio,
  Row,
  Select,
  TimePicker,
  Tag,
} from "antd";
import { CheckboxGroupProps } from "antd/es/checkbox";
import FormItem from "antd/es/form/FormItem";
import dayjs from "dayjs";
import { DayPilot } from "daypilot-pro-react";
import { useEffect, useMemo, useState } from "react";
import { ApiError } from "@/lib/axios";
import { useGetAvailableVouchers, useValidateVoucher } from "@/hooks/useVouchers";
import { useUserCreateBookingCourt } from "@/hooks/useBookingCourt";
import QrPaymentDrawer from "@/components/quanlysancaulong/court-schedule/qr-payment-drawer";
import { useAuth } from "@/context/AuthContext";
import { useDetailMembership } from "@/hooks/useMembership";

interface UserCreateBookingModalProps {
  open: boolean;
  onClose: () => void;
  newBooking: {
    start: DayPilot.Date;
    end: DayPilot.Date;
    resource: string;
  } | null;
  isBookingInPast: boolean;
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

const UserCreateBookingModal = ({ open, onClose, newBooking, isBookingInPast }: UserCreateBookingModalProps) => {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const startDateWatch = Form.useWatch("startDate", form);
  const dateRangeWatch = Form.useWatch(["_internal", "dateRange"], form);
  const startTimeWatch = Form.useWatch("startTime", form);
  const endTimeWatch = Form.useWatch("endTime", form);
  const courtWatch = Form.useWatch("courtId", form);
  const [payInFull, setPayInFull] = useState<boolean>(false);
  const [paymentMethod] = useState<"Bank">("Bank"); // Fixed to Bank for users

  const totalHoursPlay = useMemo(() => {
    if (!startTimeWatch || !endTimeWatch) return 0;
    const minutes = endTimeWatch.diff(startTimeWatch, "minute");
    if (minutes <= 0) return 0;
    return Math.round((minutes / 60) * 100) / 100;
  }, [startTimeWatch, endTimeWatch]);

  const totalHoursDisplay = useMemo(() => {
    if (totalHoursPlay === 0) return "0";
    const formatted = totalHoursPlay % 1 === 0 ? totalHoursPlay.toFixed(0) : totalHoursPlay.toFixed(2);
    return formatted.replace(/\.?0+$/, "");
  }, [totalHoursPlay]);

  const [createBookingCourtDaysOfWeek, setCreateBookingCourtDaysOfWeek] = useState<string>("1");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);

  const { data: courts } = useListCourts({});
  const { data: pricingRules } = useListCourtPricingRuleByCourtId({ courtId: courtWatch || "" });
  const createMutation = useUserCreateBookingCourt();
  const [openQr, setOpenQr] = useState(false);
  const [createdDetail, setCreatedDetail] = useState<DetailBookingCourtResponse | null>(null);
  const [selectedVoucherId, setSelectedVoucherId] = useState<number | null>(null);
  const [voucherDiscount, setVoucherDiscount] = useState<number>(0);
  const availableVouchers = useGetAvailableVouchers();
  const validateVoucherMutation = useValidateVoucher();
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [modalSelectedVoucherId, setModalSelectedVoucherId] = useState<number | null>(null);
  const [modalValidateLoading, setModalValidateLoading] = useState(false);

  // Get active membership from current user
  const activeMembership = useMemo(() => {
    if (!user?.membership) return null;
    const now = dayjs();
    // Check if membership is active: isActive = true, status = "Paid", endDate > now
    if (user.membership.isActive && user.membership.status === "Paid" && user.membership.endDate && dayjs(user.membership.endDate).isAfter(now)) {
      return user.membership;
    }
    return null;
  }, [user?.membership]);

  // Fetch membership detail to get discountPercent (only when activeMembership exists)
  const shouldFetchMembershipDetail = !!activeMembership?.membershipId;
  const { data: membershipDetailData } = useDetailMembership({
    id: activeMembership?.membershipId || 0,
  });
  const membershipDetail = shouldFetchMembershipDetail ? membershipDetailData?.data || null : null;

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

  // Calculate price with membership discount
  const priceWithDiscount = useMemo(() => {
    if (!calculatedPrice || !membershipDetail?.discountPercent) {
      return calculatedPrice;
    }
    const discountPercent = membershipDetail.discountPercent || 0;
    const discountAmount = (calculatedPrice * discountPercent) / 100;
    return Math.round(calculatedPrice - discountAmount);
  }, [calculatedPrice, membershipDetail]);

  // Tổng tiền toàn bộ = priceWithDiscount (đã áp dụng discount nếu có)
  const fullAmount = useMemo(() => {
    return priceWithDiscount;
  }, [priceWithDiscount]);

  const depositPercent = 0.3; // 30% default
  const discountedTotal = useMemo(() => Math.max(fullAmount - (voucherDiscount ?? 0), 0), [fullAmount, voucherDiscount]);

  const depositAmount = useMemo(() => {
    return Math.round((discountedTotal * depositPercent + Number.EPSILON) * 100) / 100;
  }, [discountedTotal]);

  const handleCreateBooking: FormProps<UserCreateBookingCourtRequest>["onFinish"] = (values) => {
    const dateRange = form.getFieldValue(["_internal", "dateRange"]) as [any, any] | undefined;
    const isFixedSchedule = createBookingCourtDaysOfWeek === "2";

    const payload: UserCreateBookingCourtRequest = {
      userId: user?.userId,
      courtId: values.courtId,
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

  const handleClose = () => {
    form.resetFields();
    setCreateBookingCourtDaysOfWeek("1");
    setDaysOfWeek([]);
    setPayInFull(false);
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
        title="Đặt sân cầu lông"
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
        {!user?.phoneNumber && (
          <div className="mb-4">
            <Alert message="Vui lòng cập nhật số điện thoại trong hồ sơ cá nhân để đặt sân" type="warning" showIcon />
          </div>
        )}
        {isBookingInPast && (
          <div className="mb-4">
            <Alert
              message="Lưu ý: bạn đang đặt sân trong quá khứ, nếu khoảng thời gian này trôi qua thì bạn sẽ không thể checkin sân sau khi đặt xong"
              type="warning"
              showIcon
            />
          </div>
        )}
        <Form
          form={form}
          layout="vertical"
          initialValues={{
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
                  <Descriptions
                    title="Thông tin khách hàng"
                    bordered
                    size="small"
                    column={1}
                    items={[
                      {
                        key: "name",
                        label: "Họ và tên",
                        children: user?.fullName || "-",
                      },
                      {
                        key: "email",
                        label: "Email",
                        children: user?.email || "-",
                      },
                      {
                        key: "phone",
                        label: "Số điện thoại",
                        children: user?.phoneNumber || "-",
                      },
                    ]}
                  />
                </Col>

                <Col span={12}>
                  <FormItem<UserCreateBookingCourtRequest> name="courtId" label="Sân" rules={[{ required: true, message: "Sân là bắt buộc" }]}>
                    <Select disabled={true} placeholder="Chọn sân" options={courts?.data?.map((court) => ({ value: court.id, label: court.name }))} />
                  </FormItem>
                  <FormItem<UserCreateBookingCourtRequest> name="note" label="Ghi chú">
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
                          <FormItem<UserCreateBookingCourtRequest>
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
                          <FormItem<UserCreateBookingCourtRequest>
                            name="startTime"
                            label="Giờ bắt đầu"
                            dependencies={["endTime"]}
                            rules={[
                              { required: true, message: "Giờ bắt đầu là bắt buộc" },
                              {
                                validator: (_, value) => {
                                  if ((value && endTimeWatch && value.isAfter(endTimeWatch)) || value?.isSame?.(endTimeWatch)) {
                                    return Promise.reject(new Error("Giờ bắt đầu phải trước giờ kết thúc"));
                                  }
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
                                form.validateFields(["endTime"]).catch(() => undefined);
                              }}
                            />
                          </FormItem>
                        </Col>
                        <Col span={8}>
                          <FormItem<UserCreateBookingCourtRequest>
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
                          <FormItem<UserCreateBookingCourtRequest>
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
                          <FormItem<UserCreateBookingCourtRequest>
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
                          <FormItem<UserCreateBookingCourtRequest>
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
                          children: user?.fullName || "-",
                          span: 1,
                        },
                        {
                          key: "2",
                          label: "Số điện thoại",
                          children: user?.phoneNumber || "-",
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
                          children: `${totalHoursDisplay} giờ`,
                          span: 1,
                          style: { color: totalHoursPlay < 1 ? "red" : "inherit" },
                        },
                        {
                          key: "8",
                          label: "Gói hội viên",
                          children: activeMembership ? <Tag color="green">{activeMembership.membershipName || "N/A"}</Tag> : "-",
                          span: 1,
                        },
                        {
                          key: "9",
                          label: "Giảm giá hội viên",
                          children: membershipDetail?.discountPercent ? `${membershipDetail.discountPercent}%` : "-",
                          span: 1,
                        },
                        {
                          key: "10",
                          label: "Tổng số tiền cần trả (tạm tính)",
                          children:
                            priceWithDiscount > 0 ? (
                              <div>
                                {membershipDetail?.discountPercent && calculatedPrice !== priceWithDiscount ? (
                                  <div>
                                    <div style={{ textDecoration: "line-through", color: "#999", fontSize: "12px" }}>
                                      {calculatedPrice.toLocaleString("vi-VN")} đ
                                    </div>
                                    <div style={{ color: "#52c41a", fontWeight: "bold" }}>{priceWithDiscount.toLocaleString("vi-VN")} đ</div>
                                  </div>
                                ) : (
                                  <span>{priceWithDiscount.toLocaleString("vi-VN")} đ</span>
                                )}
                              </div>
                            ) : (
                              "Chưa xác định"
                            ),
                          span: 1,
                          style: {
                            color: priceWithDiscount > 0 ? "inherit" : "orange",
                            fontWeight: priceWithDiscount > 0 ? "bold" : "normal",
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
                          children: user?.fullName || "-",
                          span: 1,
                        },
                        {
                          key: "2",
                          label: "Số điện thoại",
                          children: user?.phoneNumber || "-",
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
                          children: `${totalHoursDisplay} giờ`,
                          span: 1,
                          style: { color: totalHoursPlay < 1 ? "red" : "inherit" },
                        },
                        {
                          key: "9",
                          label: "Gói hội viên",
                          children: activeMembership ? <Tag color="green">{activeMembership.membershipName || "N/A"}</Tag> : "-",
                          span: 1,
                        },
                        {
                          key: "10",
                          label: "Giảm giá hội viên",
                          children: membershipDetail?.discountPercent ? `${membershipDetail.discountPercent}%` : "-",
                          span: 1,
                        },
                        {
                          key: "11",
                          label: "Tổng số tiền cần trả (tạm tính)",
                          children:
                            priceWithDiscount > 0 ? (
                              <div>
                                {membershipDetail?.discountPercent && calculatedPrice !== priceWithDiscount ? (
                                  <div>
                                    <div style={{ textDecoration: "line-through", color: "#999", fontSize: "12px" }}>
                                      {calculatedPrice.toLocaleString("vi-VN")} đ
                                    </div>
                                    <div style={{ color: "#52c41a", fontWeight: "bold" }}>{priceWithDiscount.toLocaleString("vi-VN")} đ</div>
                                  </div>
                                ) : (
                                  <span>{priceWithDiscount.toLocaleString("vi-VN")} đ</span>
                                )}
                              </div>
                            ) : (
                              "Chưa xác định"
                            ),
                          span: 2,
                          style: {
                            color: priceWithDiscount > 0 ? "inherit" : "orange",
                            fontWeight: priceWithDiscount > 0 ? "bold" : "normal",
                          },
                        },
                      ]}
                    />
                  )}
                </Col>
              </Row>
            </Col>

            <Col span={12}>
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Card title="Thông tin thanh toán">
                    <Row gutter={[8, 8]}>
                      <Col span={24}>
                        <div
                          style={{
                            border: "1px dashed #d9d9d9",
                            borderRadius: 6,
                            padding: 12,
                            background: "#fafafa",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <div style={{ fontWeight: 600 }}>Voucher</div>
                            <div>
                              <Button
                                size="small"
                                type="primary"
                                onClick={() => {
                                  setModalSelectedVoucherId(selectedVoucherId);
                                  setVoucherModalOpen(true);
                                }}
                              >
                                Chọn voucher
                              </Button>
                              <Button
                                size="small"
                                style={{ marginLeft: 8 }}
                                onClick={() => {
                                  setSelectedVoucherId(null);
                                  setVoucherDiscount(0);
                                  setModalSelectedVoucherId(null);
                                }}
                              >
                                Xóa
                              </Button>
                            </div>
                          </div>

                          {selectedVoucherId ? (
                            (() => {
                              const v = availableVouchers?.data?.data?.find((x) => x.id === selectedVoucherId);
                              return (
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                  <div>
                                    <div style={{ fontWeight: 600 }}>{v?.code ?? v?.title ?? `Voucher #${selectedVoucherId}`}</div>
                                    <div style={{ color: "#666", fontSize: 12, marginTop: 2 }}>{v?.description}</div>
                                    <div style={{ color: "#888", fontSize: 12, marginTop: 4 }}>
                                      {v?.discountValue
                                        ? `Giảm ${v.discountValue.toLocaleString("vi-VN")} đ`
                                        : v?.discountPercentage
                                          ? `Giảm ${v.discountPercentage}%`
                                          : ""}
                                    </div>
                                    <div style={{ color: "#999", fontSize: 12 }}>
                                      {v?.endAt ? `Hết hạn: ${dayjs(v.endAt).format("DD/MM/YYYY")}` : ""}
                                    </div>
                                  </div>
                                  <div style={{ textAlign: "right" }}>
                                    <div style={{ fontWeight: 700, color: "#52c41a" }}>
                                      {voucherDiscount > 0 ? `- ${voucherDiscount.toLocaleString("vi-VN")} đ` : "Đang kiểm tra..."}
                                    </div>
                                  </div>
                                </div>
                              );
                            })()
                          ) : (
                            <div style={{ color: "#666" }}>Chưa áp dụng voucher</div>
                          )}
                        </div>
                      </Col>
                      <Col span={24}>
                        <Checkbox checked={payInFull} onChange={(e) => setPayInFull(e.target.checked)}>
                          Thanh toán toàn bộ
                        </Checkbox>
                      </Col>
                      <Col span={24}>
                        <FormItem label="Phương thức" required>
                          <Select value={paymentMethod} disabled={true} options={[{ value: "Bank", label: "Ngân hàng (chuyển khoản)" }]} />
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
                              children:
                                discountedTotal > 0 ? (
                                  <span style={{ color: "#096dd9", fontWeight: 700 }}>{discountedTotal.toLocaleString("vi-VN")} đ</span>
                                ) : (
                                  "-"
                                ),
                            },
                            {
                              key: "amount-deposit",
                              label: "Số tiền cọc (30%)",
                              children:
                                depositAmount > 0 ? (
                                  <span style={{ color: "#fa8c16", fontWeight: 700 }}>{depositAmount.toLocaleString("vi-VN")} đ</span>
                                ) : (
                                  "-"
                                ),
                            },
                            {
                              key: "voucher-discount",
                              label: "Giảm voucher",
                              children:
                                voucherDiscount > 0 ? (
                                  <span style={{ color: "#52c41a", fontWeight: 700 }}>- {voucherDiscount.toLocaleString("vi-VN")} đ</span>
                                ) : (
                                  "-"
                                ),
                            },
                            {
                              key: "amount-full",
                              label: "Tổng tiền",
                              children:
                                fullAmount > 0 ? (
                                  <span style={{ color: "#1f1f1f", fontWeight: 700 }}>{fullAmount.toLocaleString("vi-VN")} đ</span>
                                ) : (
                                  "-"
                                ),
                            },
                            {
                              key: "amount-pay-now",
                              label: "Cần thanh toán",
                              children:
                                Math.max(payInFull ? fullAmount - (voucherDiscount ?? 0) : depositAmount, 0) > 0 ? (
                                  <span style={{ color: "#cf1322", fontWeight: 800 }}>
                                    {Math.max(payInFull ? fullAmount - (voucherDiscount ?? 0) : depositAmount, 0).toLocaleString("vi-VN")} đ
                                  </span>
                                ) : (
                                  "-"
                                ),
                            },
                          ]}
                        />
                      </Col>
                    </Row>
                  </Card>
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

                        // Don't pass customerId - backend resolves from userId
                        const validatePayload = {
                          voucherId: val,
                          orderTotalAmount: fullAmount,
                          bookingDate,
                          bookingStartTime,
                          bookingEndTime,
                        };

                        validateVoucherMutation.mutate(validatePayload, {
                          onSuccess: (res) => {
                            const api = res as any;
                            const result = api?.data ?? null;
                            if (!api?.success || !result || result?.isValid === false) {
                              message.error(result?.errorMessage ?? "Voucher không hợp lệ");
                              setSelectedVoucherId(null);
                              setVoucherDiscount(0);
                              return;
                            }
                            const discount = result?.discountAmount ?? 0;
                            setSelectedVoucherId(val);
                            setVoucherDiscount(discount);
                          },
                          onError: (err: any) => {
                            message.error(err?.message ?? "Voucher không hợp lệ");
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
        hideCustomerButton={true}
        onPaymentSuccess={() => {
          setOpenQr(false);
          setCreatedDetail(null);
          handleClose();
        }}
      />
    </div>
  );
};

export default UserCreateBookingModal;
