"use client";

import { VoucherResponse } from "@/types-openapi/api";
import { Table, TableProps, Tabs, Divider } from "antd";
import dayjs from "dayjs";
import { createVouchersColumns } from "./vouchers-columns";

interface VouchersListProps {
  vouchers: VoucherResponse[];
  loading?: boolean;
  onEdit: (voucher: VoucherResponse) => void;
  onDelete: (id: number) => void;
  onExtend: (voucher: VoucherResponse) => void;
}

const VouchersList = ({ vouchers, loading, onEdit, onDelete, onExtend }: VouchersListProps) => {
  const columns = createVouchersColumns({ onEdit, onDelete, onExtend });

  const expandedRowRender = (record: VoucherResponse) => {
    const discountLabel =
      record.discountType === "percentage"
        ? `${record.discountPercentage ?? 0}%${record.maxDiscountValue ? ` (tối đa ${record.maxDiscountValue.toLocaleString("vi-VN")} VNĐ)` : ""}`
        : `${(record.discountValue ?? 0).toLocaleString("vi-VN")} VNĐ`;

    const items = [
      {
        key: "1",
        label: "Thông tin cơ bản",
        children: (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
            <div>
              <div>
                <strong>Mã voucher:</strong> {record.code}
              </div>
              <div>
                <strong>Tiêu đề:</strong> {record.title}
              </div>
              <div>
                <strong>Mô tả:</strong> {record.description ?? "-"}
              </div>
              <div>
                <strong>Loại giảm giá:</strong> {record.discountType ?? "-"}
              </div>
              <div>
                <strong>Giá trị giảm:</strong> {discountLabel}
              </div>
            </div>
            <div>
              <div>
                <strong>Ngày bắt đầu:</strong> {record.startAt ? dayjs(record.startAt).format("DD/MM/YYYY HH:mm") : "-"}
              </div>
              <div>
                <strong>Ngày kết thúc:</strong> {record.endAt ? dayjs(record.endAt).format("DD/MM/YYYY HH:mm") : "-"}
              </div>
              <div>
                <strong>Giới hạn tổng:</strong> {record.usageLimitTotal === 0 ? "Không giới hạn" : (record.usageLimitTotal ?? "-")}
              </div>
              <div>
                <strong>Giới hạn mỗi user:</strong> {record.usageLimitPerUser === 0 ? "Không giới hạn" : (record.usageLimitPerUser ?? "-")}
              </div>
              <div>
                <strong>Trạng thái:</strong> {record.isActive ? "Hoạt động" : "Không hoạt động"}
              </div>
            </div>
          </div>
        ),
      },
      {
        key: "2",
        label: "Đối tượng áp dụng",
        children: (
          <div>
            <Divider orientation="left">Quy tắc thời gian</Divider>
            {!(record.timeRules && record.timeRules.length) ? (
              <div>-</div>
            ) : (
              (record.timeRules || []).map((r, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  {r.dayOfWeek != null ? (
                    <div>
                      <strong>Thứ:</strong> {r.dayOfWeek}
                    </div>
                  ) : null}
                  {r.specificDate ? (
                    <div>
                      <strong>Ngày cụ thể:</strong> {dayjs(r.specificDate).format("DD/MM/YYYY")}
                    </div>
                  ) : null}
                  {(r.startTime || r.endTime) && (
                    <div>
                      <strong>Giờ:</strong> {r.startTime ?? "-"} - {r.endTime ?? "-"}
                    </div>
                  )}
                </div>
              ))
            )}

            <Divider orientation="left">Quy tắc người dùng</Divider>
            {!(record.userRules && record.userRules.length) ? (
              <div>-</div>
            ) : (
              (record.userRules || []).map((u, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  {u.isNewCustomer != null ? (
                    <div>
                      <strong>Khách hàng mới:</strong> {u.isNewCustomer ? "Có" : "Không"}
                    </div>
                  ) : null}
                  {u.userType ? (
                    <div>
                      <strong>Loại người dùng:</strong> {u.userType}
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        ),
      },
    ];

    return <Tabs defaultActiveKey="1" items={items} />;
  };

  return (
    <Table
      columns={columns}
      dataSource={vouchers}
      loading={loading}
      rowKey="id"
      scroll={{ x: 1400 }}
      expandable={{
        expandedRowRender,
        expandRowByClick: true,
      }}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showTotal: (total) => `Tổng ${total} voucher`,
      }}
    />
  );
};

export default VouchersList;
