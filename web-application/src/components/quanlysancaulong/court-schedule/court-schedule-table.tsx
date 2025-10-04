import { ListBookingCourtResponse } from "@/types-openapi/api";
import { Col, Descriptions, Divider, List, Row, Table, TableProps, Tabs, Tag } from "antd";
import { columns } from "./court-schedule-table-columns";
import { useMemo } from "react";
import { BookingCourtStatus } from "@/types/commons";

interface CourtScheduleTableProps {
  data: ListBookingCourtResponse[];
  loading?: boolean;
}

const CourtScheduleTable = ({ data, loading = false }: CourtScheduleTableProps) => {
  const tableProps: TableProps<ListBookingCourtResponse> = {
    columns,
    dataSource: data,
    loading,
    rowKey: "id",
    size: "small",
    scroll: { x: "max-content" },
    expandable: {
      expandRowByClick: true,
    },
    onRow: () => ({
      style: {
        cursor: "pointer",
      },
    }),
    pagination: {
      pageSize: 20,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} đặt sân`,
      pageSizeOptions: ["10", "20", "50", "100"],
    },
    bordered: true,
  };

  return (
    <div className="court-schedule-table">
      <Table<ListBookingCourtResponse>
        {...tableProps}
        expandable={{
          expandRowByClick: true,
          expandedRowRender: (record) => (
            <div key={`booking-court-${record.id}`}>
              <Tabs
                defaultActiveKey="1"
                items={[
                  {
                    key: "1",
                    label: "Thông tin đặt sân",
                    children: <BookingCourtInformation record={record} />,
                  },
                  {
                    key: "2",
                    label: "Lịch sử thanh toán",
                    children: <PaymentHistory record={record} />,
                  },
                ]}
              />
            </div>
          ),
        }}
      />
    </div>
  );
};

export default CourtScheduleTable;

const BookingCourtInformation = ({ record }: { record: ListBookingCourtResponse }) => {
  const bookingInfo = useMemo(
    () => (
      <>
        <Row>
          <Col span={7}>
            <Descriptions column={1} title="Thông tin cơ bản">
              <Descriptions.Item label="Trạng thái">{record.status || "-"}</Descriptions.Item>
              <Descriptions.Item label="Tổng giờ">{record.totalHours || "-"} giờ</Descriptions.Item>
              <Descriptions.Item label="Tên khách hàng">{record.customerName || "-"}</Descriptions.Item>
              <Descriptions.Item label="Tên sân">{record.courtName || "-"}</Descriptions.Item>
            </Descriptions>
          </Col>

          <Divider type="vertical" size="small" style={{ height: "auto" }} />

          <Col span={7}>
            <Descriptions column={1} title="Thông tin khách hàng">
              <Descriptions.Item label="Mã khách hàng">{record.customerId || "-"}</Descriptions.Item>
              <Descriptions.Item label="Tên khách hàng">{record.customerName || "-"}</Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">{record.customer?.phoneNumber ?? "-"}</Descriptions.Item>
              <Descriptions.Item label="Email">{record.customer?.email ?? "-"}</Descriptions.Item>
            </Descriptions>
          </Col>

          <Divider type="vertical" size="small" style={{ height: "auto" }} />

          <Col span={7}>
            <Descriptions column={1} title="Thông tin sân">
              <Descriptions.Item label="Tên sân">{record.courtName || "-"}</Descriptions.Item>
              <Descriptions.Item label="Mã sân">{record.courtId || "-"}</Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>

        <Divider type="horizontal" size="small" style={{ height: "auto" }} />

        <Row>
          <Col span={7}>
            <Descriptions column={1} title="Thời gian đặt">
              <Descriptions.Item label="Ngày bắt đầu">
                {record.startDate ? new Date(record.startDate).toLocaleDateString("vi-VN") : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày kết thúc">
                {record.endDate ? new Date(record.endDate).toLocaleDateString("vi-VN") : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Giờ bắt đầu">{record.startTime || "-"}</Descriptions.Item>
              <Descriptions.Item label="Giờ kết thúc">{record.endTime || "-"}</Descriptions.Item>
            </Descriptions>
          </Col>

          <Divider type="vertical" size="small" style={{ height: "auto" }} />

          <Col span={7}>
            <Descriptions column={1} title="Ngày trong tuần">
              {record.daysOfWeek && record.daysOfWeek.length > 0 ? (
                <Descriptions.Item label="Ngày trong tuần">
                  {record.daysOfWeek.map((day) => {
                    const dayNames = { 2: "T2", 3: "T3", 4: "T4", 5: "T5", 6: "T6", 7: "T7", 8: "CN" };
                    return (
                      <Descriptions.Item key={day} label={dayNames[day as keyof typeof dayNames]}>
                        {dayNames[day as keyof typeof dayNames]}
                      </Descriptions.Item>
                    );
                  })}
                </Descriptions.Item>
              ) : (
                <Descriptions.Item label="Ngày trong tuần">Đặt lịch vãng lai</Descriptions.Item>
              )}
            </Descriptions>
          </Col>
        </Row>
      </>
    ),
    [record],
  );

  return bookingInfo;
};

const PaymentHistory = ({ record }: { record: ListBookingCourtResponse }) => {
  const getPaymentStatusTag = (status: string) => {
    const statusConfig = {
      [BookingCourtStatus.Active]: { color: "green", text: "Đã đặt & thanh toán" },
      [BookingCourtStatus.PendingPayment]: { color: "orange", text: "Đã đặt - chưa thanh toán" },
      [BookingCourtStatus.Completed]: { color: "blue", text: "Hoàn tất" },
      [BookingCourtStatus.Cancelled]: { color: "red", text: "Đã hủy" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { color: "default", text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const paymentHistory = useMemo(
    () => (
      <>
        {record.payments && record.payments.length > 0 ? (
          <List
            dataSource={record.payments}
            renderItem={(payment, index) => (
              <List.Item key={payment.id || index}>
                <div className="w-full">
                  <Descriptions
                    bordered
                    size="small"
                    column={2}
                    items={[
                      {
                        key: "1",
                        label: "Mã thanh toán",
                        children: payment.id || "-",
                        span: 1,
                      },
                      {
                        key: "2",
                        label: "Mã đặt sân",
                        children: payment.bookingId || "-",
                        span: 1,
                      },
                      {
                        key: "3",
                        label: "Số tiền",
                        children: payment.amount ? `${payment.amount.toLocaleString("vi-VN")} đ` : "-",
                        span: 1,
                      },
                      {
                        key: "4",
                        label: "Trạng thái",
                        children: getPaymentStatusTag(payment.status || ""),
                        span: 1,
                      },
                      {
                        key: "5",
                        label: "Tên khách hàng",
                        children: payment.customerName || "-",
                        span: 1,
                      },
                      {
                        key: "6",
                        label: "Mã khách hàng",
                        children: payment.customerId || "-",
                        span: 1,
                      },
                      {
                        key: "7",
                        label: "Số điện thoại",
                        children: payment.customerPhone || "-",
                        span: 1,
                      },
                      {
                        key: "8",
                        label: "Email",
                        children: payment.customerEmail || "-",
                        span: 1,
                      },
                      {
                        key: "9",
                        label: "Tên sân",
                        children: payment.courtName || "-",
                        span: 1,
                      },
                      {
                        key: "10",
                        label: "Mã sân",
                        children: payment.courtId || "-",
                        span: 1,
                      },
                      {
                        key: "11",
                        label: "Ngày thanh toán",
                        children: payment.paymentCreatedAt ? new Date(payment.paymentCreatedAt).toLocaleString("vi-VN") : "-",
                        span: 2,
                      },
                    ]}
                  />
                </div>
              </List.Item>
            )}
          />
        ) : (
          <div className="py-8 text-center text-gray-500">
            <p>Chưa có lịch sử thanh toán</p>
          </div>
        )}
      </>
    ),
    [record.payments],
  );

  return paymentHistory;
};
