"use client";

import { memo, useCallback } from "react";
import { Card, Col, Row, Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import Image from "next/image";
import { ListCourtResponse } from "@/types-openapi/api";
import { CourtStatus } from "@/types/commons";

interface CourtTabProps {
  data: ListCourtResponse[];
  loading: boolean;
  onSelectCourt: (courtId: string) => void;
  selectedCourtId: string | null;
}

const CourtTab = memo(function CourtTab({ data, loading, onSelectCourt, selectedCourtId }: CourtTabProps) {
  const getStatusColor = useCallback((status?: string) => {
    switch (status) {
      case CourtStatus.InUse:
        return { dot: "bg-blue-500", text: "text-blue-600", badge: "bg-blue-50 border-blue-200" };
      case CourtStatus.Active:
        return { dot: "bg-green-500", text: "text-green-600", badge: "bg-green-50 border-green-200" };
      case CourtStatus.Maintenance:
        return { dot: "bg-yellow-500", text: "text-yellow-700", badge: "bg-yellow-50 border-yellow-200" };
      case CourtStatus.Inactive:
        return { dot: "bg-gray-400", text: "text-gray-600", badge: "bg-gray-50 border-gray-200" };
      case CourtStatus.Deleted:
        return { dot: "bg-red-500", text: "text-red-600", badge: "bg-red-50 border-red-200" };
      default:
        return { dot: "bg-gray-300", text: "text-gray-600", badge: "bg-gray-50 border-gray-200" };
    }
  }, []);

  return (
    <div className="h-full p-3">
      <Row gutter={[8, 8]} className="h-full">
        {loading ? (
          <div className="justify-cente flex h-full w-full flex-col items-center">
            <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
            <div className="text-lg font-bold">Đang tải dữ liệu...</div>
          </div>
        ) : (
          data?.map((court, index) => {
            const colors = getStatusColor((court as any)?.status as string);
            const statusText =
              court.status === CourtStatus.Active
                ? "Đang hoạt động"
                : court.status === CourtStatus.Maintenance
                  ? "Bảo trì"
                  : court.status === CourtStatus.Inactive
                    ? "Không hoạt động"
                    : court.status === CourtStatus.InUse
                      ? "Đang sử dụng"
                      : court.status === CourtStatus.Deleted
                        ? "Đã xóa"
                        : "Không xác định";
            const isSelected = selectedCourtId && String(court.id) === String(selectedCourtId);
            return (
              <Col span={24} md={12} lg={8} xl={6} key={index}>
                <Card
                  styles={{ body: { padding: 8 } }}
                  hoverable
                  onClick={() => onSelectCourt(String(court.id))}
                  className={isSelected ? "shadow-lg ring-2 ring-green-500" : ""}
                >
                  <div className={`relative flex flex-col items-center gap-2 ${isSelected ? "scale-[1.02]" : ""}`}>
                    <div className="absolute top-2 right-2">
                      <span className={`inline-block h-3 w-3 rounded-full ${colors.dot}`} />
                    </div>

                    <Image
                      draggable={false}
                      src={"/placeholder/badminton-court-placeholder.jpg"}
                      alt={court.name || "Sân"}
                      className="h-30 w-30"
                      width={120}
                      height={120}
                    />
                    <span className="font-medium">{court.name}</span>
                    <span className={`rounded border px-2 py-0.5 text-xs ${colors.badge} ${colors.text}`}>{statusText}</span>
                  </div>
                </Card>
              </Col>
            );
          })
        )}
      </Row>
    </div>
  );
});

export default CourtTab;
