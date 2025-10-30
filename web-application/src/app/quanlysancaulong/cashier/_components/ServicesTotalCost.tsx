"use client";

import { memo, useEffect, useMemo, useState } from "react";

interface ServicesTotalCostProps {
  services: any[];
}

const ServicesTotalCost = memo(function ServicesTotalCost({ services }: ServicesTotalCostProps) {
  const [nowTs, setNowTs] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const totalCost = useMemo(() => {
    return services.reduce((sum, service) => {
      if (service.status === "Completed" && service.totalPrice) {
        return sum + service.totalPrice;
      }

      const startTime = new Date(service.serviceStartTime || new Date());
      const usageMs = Math.max(0, nowTs - startTime.getTime());
      const actualUsageHours = usageMs / (1000 * 60 * 60);
      const rawCost = (service.quantity || 0) * (service.unitPrice || 0) * actualUsageHours;
      const serviceCost = service.totalPrice || Math.ceil(rawCost / 1000) * 1000;
      return sum + serviceCost;
    }, 0);
  }, [services, nowTs]);

  return <span>{totalCost.toLocaleString("vi-VN")} đ</span>;
});

export default ServicesTotalCost;
