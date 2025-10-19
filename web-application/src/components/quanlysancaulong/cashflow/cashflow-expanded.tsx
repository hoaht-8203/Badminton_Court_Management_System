"use client";

import React from "react";
import { Row, Col, Divider, Button } from "antd";
import type { CashflowResponse } from "@/types-openapi/api";
import dayjs from "dayjs";
import { PrinterOutlined, FolderOpenOutlined } from "@ant-design/icons";

export default function CashflowExpanded({
  record,
  onOpen,
  onPrint,
}: {
  record: CashflowResponse;
  onOpen?: (r: CashflowResponse) => void;
  onPrint?: (r: CashflowResponse) => void;
}) {
  return (
    <div className="bg-white p-4">
      <Row gutter={24} className="mb-4">
        <Col span={8}>
          <div className="mb-4">
            <div className="text-sm font-medium text-slate-600">Mã phiếu</div>
            <div className="text-sm font-semibold text-blue-600">{record.referenceNumber ?? record.id}</div>
          </div>

          <div className="mb-4">
            <div className="text-sm text-slate-600">Thời gian</div>
            <div className="text-sm">{record.time ? dayjs(record.time).format("DD/MM/YYYY HH:mm") : "-"}</div>
          </div>

          <div className="mb-4">
            <div className="text-sm text-slate-600">Giá trị</div>
            <div className="text-sm font-semibold">{record.value?.toLocaleString?.() ?? record.value ?? "-"}</div>
          </div>
        </Col>

        <Col span={8}>
          <div className="mb-4">
            <div className="text-sm text-slate-600">Loại thu chi</div>
            <div className="text-sm">{record.cashflowTypeName ?? "-"}</div>
          </div>

          <div className="mb-4">
            <div className="text-sm text-slate-600">Người tạo</div>
            <div className="text-sm">{record.createdBy ?? "-"}</div>
          </div>

          <div className="mb-4">
            <div className="text-sm text-slate-600">Ghi chú</div>
            <div className="text-sm text-slate-400 italic">{record.note ?? "-"}</div>
          </div>
        </Col>

        <Col span={8}>
          <div className="mb-4">
            <div className="text-sm text-slate-600">Trạng thái</div>
            <div className="text-sm">{record.status ?? "-"}</div>
          </div>

          <div className="mb-4">
            <div className="text-sm text-slate-600">Nhóm người nộp</div>
            <div className="text-sm">-</div>
          </div>

          <div className="mb-4">
            <div className="text-sm text-slate-600">Tên người nộp/nhận</div>
            <div className="text-sm">{record.relatedPerson ?? "-"}</div>
          </div>
        </Col>
      </Row>

      <Row>
        <Col span={24}>
          <div className="flex justify-end gap-2">
            <Button type="primary" icon={<FolderOpenOutlined />} onClick={() => onOpen?.(record)}>
              Mở phiếu
            </Button>
            <Button icon={<PrinterOutlined />} onClick={() => onPrint?.(record)}>
              In
            </Button>
          </div>
        </Col>
      </Row>
    </div>
  );
}
