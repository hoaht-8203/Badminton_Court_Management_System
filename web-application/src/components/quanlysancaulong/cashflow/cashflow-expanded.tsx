"use client";

import type { CashflowResponse } from "@/types-openapi/api";
import { CheckCircleOutlined, ClockCircleOutlined, FolderOpenOutlined } from "@ant-design/icons";
import { Button, Col, Modal, Row } from "antd";
import dayjs from "dayjs";
import { useState } from "react";

export default function CashflowExpanded({
  record,
  onOpen,
  onChangeStatus,
}: {
  record: CashflowResponse;
  onOpen?: (r: CashflowResponse) => void;
  onChangeStatus?: (id: number, newStatus: string) => void;
}) {
  const [status, setStatus] = useState(record.status);

  const handleToggleStatus = () => {
    const newStatus = status === "Paid" ? "Pending" : "Paid";
    const title = status === "Paid" ? "Chuyển sang Chờ thanh toán" : "Đánh dấu Đã thanh toán";
    const content = status === "Paid" 
      ? "Bạn có chắc muốn chuyển phiếu này sang trạng thái 'Chờ thanh toán'?" 
      : "Bạn có chắc muốn đánh dấu phiếu này là 'Đã thanh toán'?";
    
    Modal.confirm({
      title,
      content,
      okText: "Xác nhận",
      cancelText: "Hủy",
      onOk: async () => {
        setStatus(newStatus);
        if (onChangeStatus && record.id) {
          await onChangeStatus(record.id, newStatus);
        }
      },
    });
  };
  return (
    <div className="bg-white p-4">
      <Row gutter={24} className="mb-3">
        <Col span={8}>
          <div className="mb-3">
            <div className="text-sm font-medium text-slate-600">Mã phiếu</div>
            <div className="text-sm font-semibold text-blue-600">{record.referenceNumber ?? record.id}</div>
          </div>

          <div>
            <div className="text-sm text-slate-600">Thời gian</div>
            <div className="text-sm">{record.time ? dayjs(record.time).format("DD/MM/YYYY HH:mm") : "-"}</div>
          </div>
        </Col>

        <Col span={8}>
          <div className="mb-3">
            <div className="text-sm text-slate-600">Thu / Chi</div>
            <div className="text-sm">{record.isPayment === true ? "Chi" : record.isPayment === false ? "Thu" : "-"}</div>
          </div>

          <div>
            <div className="text-sm text-slate-600">Loại thu chi</div>
            <div className="text-sm">{record.cashflowTypeName ?? "-"}</div>
          </div>
        </Col>

        <Col span={8}>
          <div className="mb-3">
            <div className="text-sm text-slate-600">Giá trị</div>
            <div className="text-sm font-semibold">
              {(() => {
                const displayValue = record.isPayment ? -(record.value ?? 0) : (record.value ?? 0);
                return displayValue?.toLocaleString?.() ?? displayValue ?? "-";
              })()}
            </div>
          </div>

          <div>
            <div className="text-sm text-slate-600">Trạng thái</div>
            <div className="text-sm">{status === "Paid" ? "Đã thanh toán" : status === "Pending" ? "Chờ thanh toán" : status ?? "-"}</div>
          </div>
        </Col>
      </Row>

      <Row gutter={24} className="mb-3">
        <Col span={8}>
          <div>
            <div className="text-sm text-slate-600">Người tạo</div>
            <div className="text-sm">{record.createdBy ?? "-"}</div>
          </div>
        </Col>

        <Col span={8}>
          <div>
            <div className="text-sm text-slate-600">Nhóm người nộp</div>
            <div className="text-sm">-</div>
          </div>
        </Col>

        <Col span={8}>
          <div>
            <div className="text-sm text-slate-600">Tên người nộp/nhận</div>
            <div className="text-sm">{record.relatedPerson ?? "-"}</div>
          </div>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col span={24}>
          <div>
            <div className="text-sm text-slate-600">Ghi chú</div>
            <div className="text-sm text-slate-400 italic">{record.note ?? "-"}</div>
          </div>
        </Col>
      </Row>

      <Row>
        <Col span={24}>
          <div className="flex justify-end gap-2">
            <Button type="primary" icon={<FolderOpenOutlined />} onClick={() => onOpen?.(record)}>
              Mở phiếu
            </Button>
            {status === "Paid" ? (
              <Button 
                type="default" 
                icon={<ClockCircleOutlined />} 
                onClick={handleToggleStatus}
              >
                Chuyển sang Chờ thanh toán
              </Button>
            ) : (
              <Button 
                type="primary" 
                icon={<CheckCircleOutlined />} 
                onClick={handleToggleStatus}
                style={{ background: "#52c41a", borderColor: "#52c41a" }}
              >
                Đánh dấu Đã thanh toán
              </Button>
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
}
