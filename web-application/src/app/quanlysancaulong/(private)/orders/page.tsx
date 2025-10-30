"use client";

import { columns, SearchOrders } from "@/components/quanlysancaulong/orders";
import { useOrders } from "@/hooks/useOrders";
import { ListOrderRequest, ListOrderResponse } from "@/types-openapi/api";
import { ReloadOutlined, StopOutlined } from "@ant-design/icons";
import { Breadcrumb, Button, Col, Descriptions, Empty, Image, List, message, Modal, Row, Table, TableProps, Tabs, Tag } from "antd";
import { useMemo, useState } from "react";

const tableProps: TableProps<ListOrderResponse> = {
  rowKey: "id",
  size: "small",
  scroll: { x: "max-content" },
  expandable: {
    expandRowByClick: true,
  },
  onRow: () => ({
    style: { cursor: "pointer" },
  }),
  bordered: true,
};

const OrdersPage = () => {
  const [searchParams, setSearchParams] = useState<ListOrderRequest>({});
  const [modal, contextHolder] = Modal.useModal();
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);

  const { data: ordersData, isFetching: loadingOrders, refetch } = useOrders(searchParams);

  const handleClickExtendPayment = (record: ListOrderResponse) => {
    modal.confirm({
      title: "Gia hạn thanh toán",
      content: `Bạn có chắc chắn muốn gia hạn thanh toán cho đơn hàng ${record.id} thêm 5 phút?`,
      onOk: () => {
        // TODO: Implement extend payment
        message.success("Gia hạn thanh toán thành công!");
      },
    });
  };

  return (
    <section>
      <div className="mb-4">
        <Breadcrumb items={[{ title: "Quản trị ứng dụng" }, { title: "Quản lý đơn hàng" }]} />
      </div>

      <div className="mb-2">
        <SearchOrders onSearch={setSearchParams} onReset={() => setSearchParams({})} />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <div>
            <span className="font-bold text-green-500">Tổng số đơn hàng: {ordersData?.length ?? 0}</span>
          </div>
          <div className="flex gap-2">
            <Button type="primary" icon={<ReloadOutlined />} onClick={() => refetch()}>
              Tải lại
            </Button>
          </div>
        </div>

        <Table<ListOrderResponse>
          {...tableProps}
          scroll={{ x: "max-content", y: "500px" }}
          columns={columns}
          dataSource={ordersData ?? []}
          loading={loadingOrders}
          expandable={{
            expandRowByClick: true,
            expandedRowKeys: expandedRowKeys,
            onExpandedRowsChange: (expandedKeys) => {
              // Chỉ cho phép expand một row tại một thời điểm
              const keys = Array.from(expandedKeys);
              setExpandedRowKeys(keys.length > 1 ? [keys[keys.length - 1]] : keys);
            },
            expandedRowRender: (record) => (
              <div>
                <OrderInformation record={record} handleClickExtendPayment={() => handleClickExtendPayment(record)} />
              </div>
            ),
          }}
          summary={(pageData) => {
            const totalAmount = pageData.reduce((sum, record) => sum + (record.totalAmount || 0), 0);
            return (
              <Table.Summary fixed="bottom">
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={columns.length - 1}>
                    <div className="text-right font-bold text-green-600">Tổng tiền tất cả đơn hàng:</div>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={columns.length - 1}>
                    <div className="text-right text-lg font-bold text-green-600">{totalAmount.toLocaleString("vi-VN")}₫</div>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            );
          }}
        />
      </div>

      {contextHolder}
    </section>
  );
};

const OrderInformation = ({ record, handleClickExtendPayment }: { record: ListOrderResponse; handleClickExtendPayment: () => void }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "orange";
      case "Paid":
        return "green";
      case "Cancelled":
        return "red";
      case "Refunded":
        return "blue";
      default:
        return "default";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "Pending":
        return "Chờ thanh toán";
      case "Paid":
        return "Đã thanh toán";
      case "Cancelled":
        return "Đã hủy";
      case "Refunded":
        return "Đã hoàn tiền";
      default:
        return status;
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case "Cash":
        return "Tiền mặt";
      case "Bank":
        return "Chuyển khoản";
      default:
        return method;
    }
  };

  const paymentColumns = [
    {
      title: "Payment ID",
      dataIndex: "id",
      key: "id",
      width: 200,
      render: (text: string) => <span className="font-mono text-sm">{text}</span>,
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      width: 120,
      render: (amount: number) => <span className="font-medium text-green-600">{Number(amount).toLocaleString("vi-VN")}₫</span>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string) => {
        const getStatusColor = (status: string) => {
          switch (status) {
            case "PendingPayment":
              return "orange";
            case "Paid":
              return "green";
            case "Cancelled":
              return "red";
            default:
              return "default";
          }
        };

        const getStatusText = (status: string) => {
          switch (status) {
            case "PendingPayment":
              return "Chờ thanh toán";
            case "Paid":
              return "Đã thanh toán";
            case "Cancelled":
              return "Đã hủy";
            default:
              return status;
          }
        };

        return <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>;
      },
    },
    {
      title: "Ngày tạo",
      dataIndex: "paymentCreatedAt",
      key: "paymentCreatedAt",
      width: 150,
      render: (date: string) => <span className="text-sm">{date ? new Date(date).toLocaleString("vi-VN") : "-"}</span>,
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
      key: "note",
      render: (note: string) => note || "-",
    },
  ];

  const tabItems = [
    {
      key: "basic",
      label: "Thông tin cơ bản",
      children: (
        <div>
          <Descriptions title="Thông tin đơn hàng" bordered column={2} size="small" className="!mb-4">
            <Descriptions.Item label="Mã đơn hàng" span={1}>
              <span className="font-mono">{record.orderCode || record.id}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái" span={1}>
              <Tag color={getStatusColor(record.status || "")}>{getStatusText(record.status || "")}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Khách hàng" span={1}>
              {record.customer?.fullName || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="SĐT" span={1}>
              {record.customer?.phoneNumber || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Email" span={1}>
              {record.customer?.email || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Phương thức thanh toán" span={1}>
              {getPaymentMethodText(record.paymentMethod || "")}
            </Descriptions.Item>
            <Descriptions.Item label="Sân" span={1}>
              {record.booking?.courtId || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày sử dụng" span={1}>
              {record.bookingCourtOccurrence?.date ? new Date(record.bookingCourtOccurrence.date).toLocaleDateString("vi-VN") : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian" span={1}>
              {record.bookingCourtOccurrence?.startTime || "-"} - {record.bookingCourtOccurrence?.endTime || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái sân" span={1}>
              {record.bookingCourtOccurrence?.status || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo" span={1}>
              {record.createdAt ? new Date(record.createdAt).toLocaleString("vi-VN") : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Ghi chú" span={1}>
              {record.note || "-"}
            </Descriptions.Item>
          </Descriptions>

          {/* Danh sách món hàng và dịch vụ - 2 cột */}
          <div className="mb-4">
            <Row gutter={16}>
              {/* Cột trái - Món hàng đã đặt */}
              <Col span={12}>
                <h4 className="mb-2 text-sm font-medium">Món hàng đã đặt:</h4>
                {record.orderItems && record.orderItems.length > 0 ? (
                  <List
                    dataSource={record.orderItems}
                    renderItem={(item) => (
                      <List.Item className="rounded bg-gray-50 p-2">
                        <div className="flex w-full items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {item.image && (
                              <Image
                                src={item.image}
                                alt={item.productName || "Product"}
                                width={32}
                                height={32}
                                className="rounded object-cover"
                                preview={false}
                              />
                            )}
                            <div>
                              <div className="font-medium">{item.productName}</div>
                              <div className="text-sm text-gray-500">x{item.quantity}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{Number(item.totalPrice).toLocaleString("vi-VN")}₫</div>
                            <div className="text-sm text-gray-500">{Number(item.unitPrice).toLocaleString("vi-VN")}₫/đơn vị</div>
                          </div>
                        </div>
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="Không có món hàng nào" image={Empty.PRESENTED_IMAGE_SIMPLE} className="py-8" />
                )}
              </Col>

              {/* Cột phải - Dịch vụ đã sử dụng */}
              <Col span={12}>
                <h4 className="mb-2 text-sm font-medium">Dịch vụ đã sử dụng:</h4>
                {record.services && record.services.length > 0 ? (
                  <div className="space-y-2">
                    {record.services.map((service, index) => (
                      <ServiceUsageItem key={index} service={service} />
                    ))}
                  </div>
                ) : (
                  <Empty description="Không có dịch vụ nào" image={Empty.PRESENTED_IMAGE_SIMPLE} className="py-8" />
                )}
              </Col>
            </Row>
          </div>

          {/* Thông tin tài chính */}
          <Descriptions title="Thông tin tài chính" bordered column={1} size="small">
            <Descriptions.Item label="Tiền sân">{Number(record.courtTotalAmount).toLocaleString("vi-VN")}₫</Descriptions.Item>
            <Descriptions.Item label="Tiền sân đã trả">{Number(record.courtPaidAmount).toLocaleString("vi-VN")}₫</Descriptions.Item>
            <Descriptions.Item label="Tiền sân còn lại">{Number(record.courtRemainingAmount).toLocaleString("vi-VN")}₫</Descriptions.Item>
            <Descriptions.Item label="Tổng tiền hàng">{Number(record.itemsSubtotal).toLocaleString("vi-VN")}₫</Descriptions.Item>
            <Descriptions.Item label="Tổng tiền dịch vụ">{Number(record.servicesSubtotal).toLocaleString("vi-VN")}₫</Descriptions.Item>
            {(record.lateFeeAmount || 0) > 0 && (
              <Descriptions.Item label="Phí muộn">{Number(record.lateFeeAmount).toLocaleString("vi-VN")}₫</Descriptions.Item>
            )}
            <Descriptions.Item label="Tổng tiền" className="border-t-2 border-gray-300">
              <span className="text-lg font-bold text-green-600">{Number(record.totalAmount).toLocaleString("vi-VN")}₫</span>
            </Descriptions.Item>
          </Descriptions>

          <div className="mt-4 flex items-center justify-end gap-2">
            <div className="flex gap-2">
              {record.status === "Cancelled" && (
                <>
                  <Button icon={<StopOutlined />} onClick={handleClickExtendPayment}>
                    Gia hạn thanh toán
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "payments",
      label: "Lịch sử thanh toán",
      children: (
        <div>
          {record.payments && record.payments.length > 0 ? (
            <Table columns={paymentColumns} dataSource={record.payments} pagination={false} size="small" rowKey="id" bordered />
          ) : (
            <div className="py-8 text-center text-gray-500">Không có lịch sử thanh toán</div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <Tabs defaultActiveKey="basic" items={tabItems} />
    </div>
  );
};

// ServiceUsageItem component với dữ liệu tĩnh
const ServiceUsageItem = ({ service }: { service: any }) => {
  // Tính toán thời gian đã sử dụng dựa trên serviceStartTime và serviceEndTime (dữ liệu tĩnh)
  const { displayHours, displayMinutes, displaySeconds, totalUsageMs } = useMemo(() => {
    if (!service.serviceStartTime) {
      return { displayHours: 0, displayMinutes: 0, displaySeconds: 0, totalUsageMs: 0 };
    }

    const startTime = new Date(service.serviceStartTime);
    const endTime = service.serviceEndTime ? new Date(service.serviceEndTime) : new Date();

    const usageMs = Math.max(0, endTime.getTime() - startTime.getTime());
    const totalSeconds = Math.floor(usageMs / 1000);
    const displayHours = Math.floor(totalSeconds / 3600);
    const displayMinutes = Math.floor((totalSeconds % 3600) / 60);
    const displaySeconds = totalSeconds % 60;

    return { displayHours, displayMinutes, displaySeconds, totalUsageMs: usageMs };
  }, [service.serviceStartTime, service.serviceEndTime]);

  // Tính tổng tiền dựa trên thời gian đã sử dụng thực tế
  const currentCost = useMemo(() => {
    if (service.totalPrice) {
      return service.totalPrice; // Sử dụng giá đã được tính sẵn
    }

    // Tính toán dựa trên thời gian đã sử dụng
    const actualUsageHours = totalUsageMs / (1000 * 60 * 60);
    const rawCost = (service.quantity || 0) * (service.unitPrice || 0) * actualUsageHours;
    return Math.ceil(rawCost / 1000) * 1000; // Làm tròn lên hàng nghìn
  }, [service.totalPrice, service.quantity, service.unitPrice, totalUsageMs]);

  return (
    <div className="rounded bg-blue-50 p-2 text-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-medium">{service.serviceName || "Unknown Service"}</div>
          <div className="text-xs text-gray-600">
            Số lượng: {service.quantity} • Giá: {service.unitPrice?.toLocaleString("vi-VN")} đ/giờ
          </div>
          <div className="text-xs text-gray-600">
            Thời gian bắt đầu: {service.serviceStartTime ? new Date(service.serviceStartTime).toLocaleString("vi-VN") : "N/A"}
          </div>
          <div className="text-xs text-gray-600">
            Thời gian kết thúc: {service.serviceEndTime ? new Date(service.serviceEndTime).toLocaleString("vi-VN") : "Chưa kết thúc"}
          </div>
          <div className="text-xs text-gray-600">
            Đã sử dụng: {displayHours} giờ {displayMinutes} phút {String(displaySeconds).padStart(2, "0")} giây
          </div>
        </div>
        <div className="text-right">
          <div className="font-semibold text-blue-600">{currentCost.toLocaleString("vi-VN")} đ</div>
          <div className="text-xs text-gray-500">{service.status === "Completed" ? "Đã hoàn thành" : "Đang sử dụng"}</div>
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;
