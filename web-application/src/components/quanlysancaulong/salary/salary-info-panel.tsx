import { Descriptions, Button, Row, Col, Tooltip } from "antd";
import { DeleteOutlined, ReloadOutlined, FileExcelOutlined, InfoCircleOutlined, EyeOutlined } from "@ant-design/icons";

export default function SalaryInfoPanel({ salary }: { salary: any }) {
  return (
    <>
      <Descriptions column={3} size="small" bordered>
        <Descriptions.Item label="Mã">{salary.code}</Descriptions.Item>
        <Descriptions.Item label="Tên">{salary.name}</Descriptions.Item>
        <Descriptions.Item label="Kỳ hạn trả">{salary.payPeriod}</Descriptions.Item>
        <Descriptions.Item label="Ngày tạo">01/10/2025 00:21:41</Descriptions.Item>
        <Descriptions.Item label="Người tạo">Kim Tu Dan</Descriptions.Item>
        <Descriptions.Item label="Kỳ làm việc">{salary.workDate}</Descriptions.Item>
        <Descriptions.Item label="Tổng số nhân viên">1</Descriptions.Item>
        <Descriptions.Item label="Tổng lương">{salary.totalSalary}</Descriptions.Item>
        <Descriptions.Item label="Trạng thái">{salary.status}</Descriptions.Item>
        <Descriptions.Item label="Đã trả nhân viên">{salary.paidStaff}</Descriptions.Item>
        <Descriptions.Item label="Người chốt lương"> </Descriptions.Item>
        <Descriptions.Item label="Còn cần trả">{salary.remaining}</Descriptions.Item>
      </Descriptions>
      <Row gutter={16} style={{ marginTop: 24, alignItems: "center" }}>
        <Col flex="none">
          <Button type="text" danger icon={<DeleteOutlined />}>
            Hủy bỏ
          </Button>
        </Col>
        <Col flex="auto" style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
          <span style={{ color: "#222", marginRight: 8 }}>
            Dữ liệu được cập nhật vào: <b>15/10/2025 03:55:59</b>
          </span>
          <Button type="primary" icon={<ReloadOutlined />}>
            Tải lại dữ liệu
          </Button>

          <Button icon={<FileExcelOutlined />}>Xuất file</Button>
        </Col>
      </Row>
    </>
  );
}
