"use client";

import { useEffect, useState } from "react";
import { auditLogService } from "@/services/auditLogService";
import { AuditLogDto, AuditAction } from "@/types/audit-log";
import { Card, Table, Tag, Space, Typography, Spin, Button } from "antd";
import {
  EyeOutlined,
  ReloadOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

const { Title, Text } = Typography;

interface RecentAuditLogsProps {
  limit?: number;
}

const RecentAuditLogs: React.FC<RecentAuditLogsProps> = ({ limit = 10 }) => {
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLogDto[]>([]);
  const [loading, setLoading] = useState(false);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const response = await auditLogService.getAuditLogs({
        page: 1,
        pageSize: limit,
      });
      setLogs(response.items);
    } catch (error) {
      console.error("Error loading audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [limit]);

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

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm");
    } catch {
      return dateString;
    }
  };

  const columns = [
    {
      title: "Thời gian",
      dataIndex: "timestamp",
      key: "timestamp",
      width: 140,
      render: (text: string) => (
        <Text style={{ fontSize: "0.875rem" }}>{formatDate(text)}</Text>
      ),
    },
    {
      title: "Bảng",
      dataIndex: "tableName",
      key: "tableName",
      width: 120,
      render: (text: string) => (
        <Tag color="blue" style={{ fontSize: "0.75rem" }}>
          {text}
        </Tag>
      ),
    },
    {
      title: "Hành động",
      dataIndex: "action",
      key: "action",
      width: 100,
      render: (text: string) => (
        <Tag color={getActionColor(text)} style={{ fontSize: "0.75rem" }}>
          {getActionText(text)}
        </Tag>
      ),
    },
    {
      title: "User",
      dataIndex: "userName",
      key: "userName",
      width: 150,
      ellipsis: true,
      render: (text: string) => (
        <Text style={{ fontSize: "0.875rem" }}>{text || "N/A"}</Text>
      ),
    },
    {
      title: "IP",
      dataIndex: "ipAddress",
      key: "ipAddress",
      width: 120,
      render: (text: string) => (
        <Text style={{ fontSize: "0.875rem" }}>{text || "N/A"}</Text>
      ),
    },
  ];

  return (
    <Card
      title={
        <Space>
          <HistoryOutlined />
          <Title level={5} style={{ margin: 0 }}>
            Lịch sử thay đổi gần đây
          </Title>
        </Space>
      }
      extra={
        <Space>
          <Button
            type="text"
            size="small"
            icon={<ReloadOutlined />}
            onClick={loadLogs}
            loading={loading}
          >
            Làm mới
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => router.push("/quanlysancaulong/audit-logs")}
          >
            Xem tất cả
          </Button>
        </Space>
      }
      style={{ height: "100%" }}
    >
      <Table
        columns={columns}
        dataSource={logs}
        rowKey="id"
        loading={loading}
        pagination={false}
        size="small"
        scroll={{ y: 300 }}
        locale={{
          emptyText: "Không có dữ liệu",
        }}
      />
    </Card>
  );
};

export default RecentAuditLogs;
