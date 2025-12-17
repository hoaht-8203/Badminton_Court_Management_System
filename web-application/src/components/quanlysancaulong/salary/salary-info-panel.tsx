import { Descriptions, Button, Row, Col, Tooltip, Modal, message } from "antd";
import { DeleteOutlined, ReloadOutlined, InfoCircleOutlined, EyeOutlined } from "@ant-design/icons";
import { PayrollDetailResponse } from "@/types-openapi/api";
import { useDeletePayroll } from "@/hooks/usePayroll";
import { ApiError } from "@/lib/axios";

export default function SalaryInfoPanel({
  payroll,
  code,
  onRefresh,
  refreshing,
}: {
  payroll?: PayrollDetailResponse;
  code?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  const payrollId = payroll?.id;
  const deleteMutation = useDeletePayroll();
  const formattedCode = code ?? (payrollId ? `BL${String(payrollId).padStart(6, "0")}` : "");
  const startDate = payroll?.startDate ? new Date(payroll.startDate).toLocaleDateString() : "";
  const endDate = payroll?.endDate ? new Date(payroll.endDate).toLocaleDateString() : "";
  const workDate = startDate || endDate ? `${startDate} - ${endDate}` : "";
  const totalStaff = payroll?.payrollItems ? payroll.payrollItems.length : 0;
  const totalSalary = payroll?.totalNetSalary ?? 0;
  const paidAmount = payroll?.totalPaidAmount ?? 0;
  const remaining = totalSalary - paidAmount;

  const handleDelete = () => {
    if (!payrollId) return;

    Modal.confirm({
      title: "Xác nhận hủy bảng lương",
      content: "Bạn có chắc chắn muốn hủy bảng lương này? Hành động này không thể hoàn tác.",
      okText: "Xác nhận",
      cancelText: "Hủy",
      okType: "danger",
      onOk: async () => {
        try {
          await deleteMutation.mutateAsync(payrollId);
          message.success("Hủy bảng lương thành công");
          // Refresh the page or navigate back
          window.location.reload();
        } catch (error: any) {
          const apiError = error as ApiError;
          if (apiError?.errors) {
            for (const key in apiError.errors) {
              message.error(apiError.errors[key]);
            }
          } else if (apiError?.message) {
            message.error(apiError.message);
          } else {
            message.error("Có lỗi khi hủy bảng lương");
          }
        }
      },
    });
  };

  return (
    <>
      <Descriptions column={3} size="small" bordered>
        <Descriptions.Item label="Mã">{formattedCode}</Descriptions.Item>
        <Descriptions.Item label="Tên">{payroll?.name}</Descriptions.Item>
        <Descriptions.Item label="Ghi chú">{payroll?.note}</Descriptions.Item>
        <Descriptions.Item label="Ngày bắt đầu">{startDate}</Descriptions.Item>
        <Descriptions.Item label="Ngày kết thúc">{endDate}</Descriptions.Item>
        <Descriptions.Item label="Kỳ làm việc">{workDate}</Descriptions.Item>
        <Descriptions.Item label="Tổng số nhân viên">{totalStaff}</Descriptions.Item>
        <Descriptions.Item label="Tổng lương">{totalSalary}</Descriptions.Item>
        <Descriptions.Item label="Trạng thái">{payroll?.status}</Descriptions.Item>
        <Descriptions.Item label="Đã trả nhân viên">{paidAmount}</Descriptions.Item>
        <Descriptions.Item label="Người cập nhật">{payroll?.updatedBy ?? ""}</Descriptions.Item>
        <Descriptions.Item label="Còn cần trả">{remaining}</Descriptions.Item>
      </Descriptions>
      <Row gutter={16} style={{ marginTop: 24, alignItems: "center" }}>
        <Col flex="none">
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={handleDelete}
            loading={deleteMutation.status === "pending"}
            disabled={!payrollId}
          >
            Hủy bỏ
          </Button>
        </Col>
        <Col flex="auto" style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
          <span style={{ color: "#222", marginRight: 8 }}>
            Dữ liệu được cập nhật vào: <b>{payroll?.updatedAt ? new Date(payroll.updatedAt).toLocaleString() : ""}</b>
          </span>
          <Button type="primary" icon={<ReloadOutlined />} loading={refreshing} onClick={onRefresh}>
            Tải lại dữ liệu
          </Button>
        </Col>
      </Row>
    </>
  );
}
