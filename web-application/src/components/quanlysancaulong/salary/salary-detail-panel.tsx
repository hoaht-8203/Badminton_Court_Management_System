import { Tabs, Descriptions, Button } from "antd";

export default function SalaryDetailPanel({ salary }: { salary: any }) {
  return (
    <div style={{ background: "#fff", padding: 16 }}>
      <Tabs
        defaultActiveKey="info"
        items={[
          {
            key: "info",
            label: "Thông tin",
            children: (
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
                <Descriptions.Item label="Chi nhánh">Chi nhánh trung tâm</Descriptions.Item>
                <Descriptions.Item label="Phạm vi áp dụng">Tất cả nhân viên</Descriptions.Item>
                <Descriptions.Item label="Đã trả nhân viên">{salary.paidStaff}</Descriptions.Item>
                <Descriptions.Item label="Người chốt lương"> </Descriptions.Item>
                <Descriptions.Item label="Còn cần trả">{salary.remaining}</Descriptions.Item>
                <Descriptions.Item label="Ghi chú">
                  {" "}
                  <span style={{ color: "#aaa" }}>Ghi chú...</span>{" "}
                </Descriptions.Item>
              </Descriptions>
            ),
          },
          {
            key: "slip",
            label: "Phiếu lương",
            children: <div>Phiếu lương (demo)</div>,
          },
          {
            key: "history",
            label: "Lịch sử thanh toán",
            children: <div>Lịch sử thanh toán (demo)</div>,
          },
        ]}
      />
      <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between" }}>
        <Button danger>Hủy bỏ</Button>
        <div>
          <span style={{ color: "#888", marginRight: 16 }}>Dữ liệu được cập nhật vào: 01/10/2025 00:21:42</span>
          <Button style={{ marginRight: 8 }}>Tải lại dữ liệu</Button>
          <Button type="primary">Xem bảng lương</Button>
          <Button icon={<span className="anticon anticon-file-excel" />} style={{ marginLeft: 8 }}>
            Xuất file
          </Button>
        </div>
      </div>
    </div>
  );
}
