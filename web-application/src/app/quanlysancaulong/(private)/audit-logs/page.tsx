"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { auditLogService } from "@/services/auditLogService";
import {
  AuditLogDto,
  AuditLogQueryDto,
  AuditAction,
} from "@/types/audit-log";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Row,
  Col,
  Select,
  Input,
  DatePicker,
  Modal,
  Descriptions,
  message,
  Spin,
} from "antd";
import {
  SearchOutlined,
  DownloadOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function AuditLogsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [logs, setLogs] = useState<AuditLogDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Pagination
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    showTotal: (total) => `Tổng ${total} logs`,
    pageSizeOptions: ["5", "10", "25", "50", "100"],
  });

  // Filters
  const [filters, setFilters] = useState<AuditLogQueryDto>({
    tableName: undefined,
    action: undefined,
    searchKeyword: undefined,
    dateFrom: undefined,
    dateTo: undefined,
  });

  // Detail modal
  const [selectedLog, setSelectedLog] = useState<AuditLogDto | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // Check admin role
  useEffect(() => {
    if (user && !user.roles?.includes("Admin")) {
      router.push("/forbidden");
    }
  }, [user, router]);

  // Load logs
  const loadLogs = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const response = await auditLogService.getAuditLogs({
        ...filters,
        page,
        pageSize,
      });

      setLogs(response.items);
      setPagination((prev) => ({
        ...prev,
        current: page,
        pageSize,
        total: response.totalItems,
      }));
    } catch (error: any) {
      message.error(error.message || "Lỗi khi tải audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.roles?.includes("Admin")) {
      loadLogs(pagination.current, pagination.pageSize);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    loadLogs(newPagination.current || 1, newPagination.pageSize || 10);
  };

  const handleSearch = () => {
    loadLogs(1, pagination.pageSize);
  };

  const handleReset = () => {
    setFilters({
      tableName: undefined,
      action: undefined,
      searchKeyword: undefined,
      dateFrom: undefined,
      dateTo: undefined,
    });
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await auditLogService.exportAuditLogs(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-${dayjs().format("YYYYMMDD-HHmmss")}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      message.success("Xuất file CSV thành công");
    } catch (error: any) {
      message.error(error.message || "Lỗi khi xuất file");
    } finally {
      setExporting(false);
    }
  };

  const handleShowDetail = (record: AuditLogDto) => {
    setSelectedLog(record);
    setDetailModalVisible(true);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case AuditAction.Create:
        return "success";
      case AuditAction.Update:
        return "processing";
      case AuditAction.Delete:
        return "error";
      default:
        return "default";
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case AuditAction.Create:
        return "Tạo mới";
      case AuditAction.Update:
        return "Cập nhật";
      case AuditAction.Delete:
        return "Xóa";
      default:
        return action;
    }
  };

  const columns: ColumnsType<AuditLogDto> = [
    {
      title: "Thời gian",
      dataIndex: "timestamp",
      key: "timestamp",
      width: 160,
      render: (text: string) => dayjs(text).format("DD/MM/YYYY HH:mm:ss"),
    },
    {
      title: "Bảng",
      dataIndex: "tableName",
      key: "tableName",
      width: 140,
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "Hành động",
      dataIndex: "action",
      key: "action",
      width: 110,
      render: (text: string) => (
        <Tag color={getActionColor(text)}>{getActionText(text)}</Tag>
      ),
    },
    {
      title: "Entity ID",
      dataIndex: "entityId",
      key: "entityId",
      width: 200,
      ellipsis: true,
    },
    {
      title: "User",
      dataIndex: "userName",
      key: "userName",
      width: 180,
      ellipsis: true,
      render: (text: string) => text || "N/A",
    },
    {
      title: "IP Address",
      dataIndex: "ipAddress",
      key: "ipAddress",
      width: 140,
      render: (text: string) => text || "N/A",
    },
    {
      title: "Thao tác",
      key: "action",
      width: 100,
      fixed: "right",
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<InfoCircleOutlined />}
          onClick={() => handleShowDetail(record)}
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  if (!user?.roles?.includes("Admin")) {
    return null;
  }

  return (
    <div style={{ padding: "24px" }}>
      <Space style={{ marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.back()}
        >
          Quay lại
        </Button>
      </Space>
      
      <Title level={3}>Audit Logs</Title>
      <Text type="secondary">Lịch sử thay đổi dữ liệu hệ thống</Text>

      {/* Filters */}
      <Card style={{ marginTop: 16, marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Tìm kiếm (User, IP, Table...)"
              value={filters.searchKeyword || ""}
              onChange={(e) =>
                setFilters({ ...filters, searchKeyword: e.target.value })
              }
              allowClear
            />
          </Col>

          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Chọn bảng"
              style={{ width: "100%" }}
              value={filters.tableName}
              onChange={(value) => setFilters({ ...filters, tableName: value })}
              allowClear
            >
              <Select.Option value="Court">Courts</Select.Option>
              <Select.Option value="BookingCourt">Bookings</Select.Option>
              <Select.Option value="Payment">Payments</Select.Option>
              <Select.Option value="Staff">Staff</Select.Option>
              <Select.Option value="ApplicationUser">Users</Select.Option>
              <Select.Option value="Order">Orders</Select.Option>
              <Select.Option value="Product">Products</Select.Option>
              <Select.Option value="Service">Services</Select.Option>
              <Select.Option value="Membership">Memberships</Select.Option>
              <Select.Option value="Payroll">Payroll</Select.Option>
            </Select>
          </Col>

          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Hành động"
              style={{ width: "100%" }}
              value={filters.action}
              onChange={(value) => setFilters({ ...filters, action: value })}
              allowClear
            >
              <Select.Option value={AuditAction.Create}>Tạo mới</Select.Option>
              <Select.Option value={AuditAction.Update}>
                Cập nhật
              </Select.Option>
              <Select.Option value={AuditAction.Delete}>Xóa</Select.Option>
            </Select>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <RangePicker
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setFilters({
                    ...filters,
                    dateFrom: dates[0].toISOString(),
                    dateTo: dates[1].toISOString(),
                  });
                } else {
                  setFilters({
                    ...filters,
                    dateFrom: undefined,
                    dateTo: undefined,
                  });
                }
              }}
            />
          </Col>

          <Col xs={24} sm={12} md={4}>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
              >
                Tìm kiếm
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                Đặt lại
              </Button>
            </Space>
          </Col>
        </Row>

        <Row style={{ marginTop: 16 }}>
          <Col>
            <Space>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleExport}
                loading={exporting}
              >
                Xuất CSV
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => loadLogs(pagination.current, pagination.pageSize)}
                loading={loading}
              >
                Làm mới
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={logs}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
          locale={{ emptyText: "Không có dữ liệu" }}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title="Chi tiết Audit Log"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Đóng
          </Button>,
        ]}
        width={800}
      >
        {selectedLog && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Bảng">
              <Tag color="blue">{selectedLog.tableName}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Hành động">
              <Tag color={getActionColor(selectedLog.action)}>
                {getActionText(selectedLog.action)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Entity ID">
              {selectedLog.entityId}
            </Descriptions.Item>
            <Descriptions.Item label="User">
              {selectedLog.userName || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="IP Address">
              {selectedLog.ipAddress || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian">
              {dayjs(selectedLog.timestamp).format("DD/MM/YYYY HH:mm:ss")}
            </Descriptions.Item>
            {selectedLog.changedColumns && (
              <Descriptions.Item label="Các cột thay đổi">
                {selectedLog.changedColumns}
              </Descriptions.Item>
            )}
            {selectedLog.oldValues && (
              <Descriptions.Item label="Giá trị cũ">
                <pre
                  style={{
                    margin: 0,
                    fontSize: "12px",
                    maxHeight: "200px",
                    overflow: "auto",
                  }}
                >
                  {JSON.stringify(JSON.parse(selectedLog.oldValues), null, 2)}
                </pre>
              </Descriptions.Item>
            )}
            {selectedLog.newValues && (
              <Descriptions.Item label="Giá trị mới">
                <pre
                  style={{
                    margin: 0,
                    fontSize: "12px",
                    maxHeight: "200px",
                    overflow: "auto",
                  }}
                >
                  {JSON.stringify(JSON.parse(selectedLog.newValues), null, 2)}
                </pre>
              </Descriptions.Item>
            )}
            {selectedLog.userAgent && (
              <Descriptions.Item label="User Agent">
                <Text style={{ fontSize: "12px", wordBreak: "break-all" }}>
                  {selectedLog.userAgent}
                </Text>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
