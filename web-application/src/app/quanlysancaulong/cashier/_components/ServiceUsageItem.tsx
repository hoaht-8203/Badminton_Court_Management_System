"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { Button } from "antd";

interface ServiceUsageItemProps {
  service: any;
  onEndService?: (serviceId: string) => void;
}

const ServiceUsageItem = memo(function ServiceUsageItem({ service, onEndService }: ServiceUsageItemProps) {
  const [nowTs, setNowTs] = useState<number>(() => Date.now());
  const [isEnding, setIsEnding] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const { displayHours, displayMinutes, displaySeconds, currentCost } = useMemo(() => {
    if (service.status === "Completed" && service.serviceEndTime) {
      const startTime = new Date(service.serviceStartTime || new Date());
      const endTime = new Date(service.serviceEndTime);
      const usageMs = Math.max(0, endTime.getTime() - startTime.getTime());
      const totalSeconds = Math.floor(usageMs / 1000);
      const displayHours = Math.floor(totalSeconds / 3600);
      const displayMinutes = Math.floor((totalSeconds % 3600) / 60);
      const displaySeconds = totalSeconds % 60;

      return {
        displayHours,
        displayMinutes,
        displaySeconds,
        currentCost: service.totalPrice || 0,
      };
    }

    const startTime = new Date(service.serviceStartTime || new Date());
    const usageMs = Math.max(0, nowTs - startTime.getTime());
    const totalSeconds = Math.floor(usageMs / 1000);
    const displayHours = Math.floor(totalSeconds / 3600);
    const displayMinutes = Math.floor((totalSeconds % 3600) / 60);
    const displaySeconds = totalSeconds % 60;

    const actualUsageHours = usageMs / (1000 * 60 * 60);
    const rawCost = (service.quantity || 0) * (service.unitPrice || 0) * actualUsageHours;
    const currentCost = service.totalPrice || Math.ceil(rawCost / 1000) * 1000;

    return { displayHours, displayMinutes, displaySeconds, currentCost };
  }, [nowTs, service.serviceStartTime, service.serviceEndTime, service.quantity, service.unitPrice, service.totalPrice, service.status]);

  const handleEndService = async () => {
    if (!onEndService || isEnding) return;

    setIsEnding(true);
    try {
      await onEndService(service.id);
    } finally {
      setIsEnding(false);
    }
  };

  return (
    <div className="rounded bg-blue-50 p-2 text-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-medium">{service.serviceName || "Unknown Service"}</div>
          <div className="text-xs text-gray-600">
            Số lượng: {service.quantity} • Giá: {service.unitPrice?.toLocaleString("vi-VN")} đ/giờ
          </div>
          <div className="text-xs text-gray-600">
            Đã sử dụng: {displayHours} giờ {displayMinutes} phút {String(displaySeconds).padStart(2, "0")} giây
          </div>
          {service.status === "Completed" && service.serviceEndTime && (
            <div className="text-xs text-gray-600">Kết thúc: {new Date(service.serviceEndTime).toLocaleString("vi-VN")}</div>
          )}
        </div>
        <div className="text-right">
          <div className="font-semibold text-blue-600">{currentCost.toLocaleString("vi-VN")} đ</div>
          <div className="mb-2 text-xs text-gray-500">{service.status === "Completed" ? "Đã hoàn thành" : "Đang sử dụng"}</div>
          {service.status !== "Completed" && onEndService && (
            <Button size="small" type="primary" danger loading={isEnding} onClick={handleEndService} className="text-xs">
              Dừng dịch vụ
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});

export default ServiceUsageItem;
