import { useListCourts, useListCourtPricingRuleByCourtId } from "@/hooks/useCourt";
import { customerService } from "@/services/customerService";
import { CreateBookingCourtRequest, DetailCustomerResponse } from "@/types-openapi/api";
import { Card, Col, DatePicker, Descriptions, Form, message, Modal, Radio, Row, Select, TimePicker } from "antd";
import { CheckboxGroupProps } from "antd/es/checkbox";
import FormItem from "antd/es/form/FormItem";
import dayjs from "dayjs";
import { DayPilot } from "daypilot-pro-react";
import { useEffect, useMemo, useState } from "react";
import { DebounceSelect } from "./DebounceSelect";

interface ModelCreateNewBookingProps {
  open: boolean;
  onClose: () => void;
  newBooking: {
    start: DayPilot.Date;
    end: DayPilot.Date;
    resource: string;
  } | null;
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

const ModelCreateNewBooking = ({ open, onClose, newBooking }: ModelCreateNewBookingProps) => {
  const [form] = Form.useForm();
  const startDateWatch = Form.useWatch("startDate", form);
  const startTimeWatch = Form.useWatch("startTime", form);
  const endTimeWatch = Form.useWatch("endTime", form);
  const customerWatch = Form.useWatch("customerId", form);
  const courtWatch = Form.useWatch("courtId", form);
  const totalHoursPlay = useMemo(() => {
    return (endTimeWatch?.diff(startTimeWatch, "hour") ?? 0).toFixed(1);
  }, [startTimeWatch, endTimeWatch]);

  const [createBookingCourtDaysOfWeek, setCreateBookingCourtDaysOfWeek] = useState<string>("1");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [customerInfo, setCustomerInfo] = useState<DetailCustomerResponse | null>(null);

  const { data: courts } = useListCourts({});
  const { data: pricingRules } = useListCourtPricingRuleByCourtId({ courtId: courtWatch || "" });

  // Tính toán số tiền dựa trên pricing rules theo order
  const calculatedPrice = useMemo(() => {
    if (!startTimeWatch || !endTimeWatch || !pricingRules?.data || !startDateWatch) {
      return 0;
    }

    // Map dayjs() day() -> backend daysOfWeek (T2..CN => 2..8, CN=8)
    const jsDay = startDateWatch.day(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const dayOfWeek = jsDay === 0 ? 8 : jsDay + 1; // 1..6 => 2..7, 0 => 8
    const startTimeStr = startTimeWatch.format("HH:mm");
    const endTimeStr = endTimeWatch.format("HH:mm");

    // Debug log
    console.log("Price calculation debug:", {
      date: startDateWatch.format("YYYY-MM-DD dddd"),
      jsDay,
      dayOfWeek,
      startTimeStr,
      endTimeStr,
      pricingRules: pricingRules.data,
    });

    // Sắp xếp rules theo order (order nhỏ hơn = ưu tiên cao hơn)
    const sortedRules = [...pricingRules.data].sort((a, b) => (a.order || 0) - (b.order || 0));

    let totalPrice = 0;
    let currentTime = startTimeStr;

    // Chia thời gian theo từng rule theo thứ tự order
    while (currentTime < endTimeStr) {
      // Tìm rule phù hợp cho thời điểm hiện tại
      const applicableRule = sortedRules.find((rule) => {
        // Kiểm tra ngày trong tuần
        if (rule.daysOfWeek && !rule.daysOfWeek.includes(dayOfWeek)) {
          return false;
        }
        // Chuyển đổi format thời gian để so sánh (HH:mm:ss -> HH:mm)
        const ruleStartTime = rule.startTime.substring(0, 5); // "07:00:00" -> "07:00"
        const ruleEndTime = rule.endTime.substring(0, 5); // "14:00:00" -> "14:00"
        // Kiểm tra thời gian hiện tại có nằm trong khung giờ rule không
        return currentTime >= ruleStartTime && currentTime < ruleEndTime;
      });

      if (!applicableRule) {
        // Không tìm thấy rule phù hợp, dừng tính toán
        console.warn(`No pricing rule found for time ${currentTime} on day ${dayOfWeek}`);
        message.error("Không tìm thấy rule phù hợp cho thời gian đặt sân");
        break;
      }

      // Tính thời gian áp dụng rule này (chuyển đổi format)
      const ruleEndTime = applicableRule.endTime.substring(0, 5); // "14:00:00" -> "14:00"
      const actualEndTime = ruleEndTime < endTimeStr ? ruleEndTime : endTimeStr;

      // Tính số giờ trong rule này
      const startMinutes = parseInt(currentTime.split(":")[0]) * 60 + parseInt(currentTime.split(":")[1]);
      const endMinutes = parseInt(actualEndTime.split(":")[0]) * 60 + parseInt(actualEndTime.split(":")[1]);
      const hoursInThisRule = (endMinutes - startMinutes) / 60;

      // Tính giá cho khoảng thời gian này
      const priceForThisPeriod = hoursInThisRule * applicableRule.pricePerHour;
      totalPrice += priceForThisPeriod;

      console.log(
        `Applied rule order ${applicableRule.order}: ${currentTime} - ${actualEndTime} (${hoursInThisRule.toFixed(2)}h) = ${priceForThisPeriod.toLocaleString("vi-VN")}đ`,
      );

      // Chuyển sang thời gian tiếp theo
      currentTime = actualEndTime;
    }

    console.log("Total calculated price:", totalPrice.toLocaleString("vi-VN") + "đ");

    return Math.round(totalPrice);
  }, [startTimeWatch, endTimeWatch, pricingRules, startDateWatch]);

  const handleCreateBooking = () => {
    form.submit();
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
    onClose();
  };

  // Sync form values whenever a new time range is selected
  useEffect(() => {
    if (!open || !newBooking) return;

    const start = dayjs(newBooking.start.toString());
    const end = dayjs(newBooking.end.toString());
    const defaultRangeEnd = start.add(1, "month");

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

  return (
    <div>
      <Modal
        title="Thêm mới lịch đặt sân cầu lông"
        maskClosable={false}
        centered
        open={open}
        onOk={handleCreateBooking}
        onCancel={handleClose}
        okText="Đặt sân"
        cancelText="Bỏ qua"
        width={1000}
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
        >
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
                <Select placeholder="Chọn sân" options={courts?.data?.map((court) => ({ value: court.id, label: court.name }))} />
              </FormItem>
            </Col>

            <Col span={24}>
              <Radio.Group
                block
                options={createBookingCourtDaysOfWeekOptions}
                defaultValue={createBookingCourtDaysOfWeek}
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
                        <DatePicker placeholder="Chọn ngày bắt đầu" format="DD/MM/YYYY" style={{ width: "100%" }} />
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
                              return Promise.resolve();
                            },
                          },
                        ]}
                      >
                        <TimePicker
                          placeholder="Chọn giờ bắt đầu"
                          format="HH:mm"
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
                        <RangePicker placeholder={["Chọn ngày bắt đầu", "Chọn ngày kết thúc"]} format="DD/MM/YYYY" style={{ width: "100%" }} />
                      </FormItem>
                    </Col>
                    <Col span={6}>
                      <FormItem<CreateBookingCourtRequest>
                        name="startTime"
                        label="Giờ bắt đầu"
                        rules={[{ required: true, message: "Giờ bắt đầu là bắt buộc" }]}
                      >
                        <TimePicker placeholder="Chọn giờ bắt đầu" style={{ width: "100%" }} />
                      </FormItem>
                    </Col>
                    <Col span={6}>
                      <FormItem<CreateBookingCourtRequest>
                        name="endTime"
                        label="Giờ kết thúc"
                        rules={[{ required: true, message: "Giờ kết thúc là bắt buộc" }]}
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
                    },
                    {
                      key: "6",
                      label: "Giờ kết thúc",
                      children: endTimeWatch?.format?.("HH:mm") ?? "-",
                      span: 1,
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
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default ModelCreateNewBooking;
