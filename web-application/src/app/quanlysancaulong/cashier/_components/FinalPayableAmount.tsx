"use client";

import { memo, useEffect, useMemo, useState } from "react";

interface FinalPayableAmountProps {
  courtRemaining: number;
  itemsSubtotal: number;
  services: any[];
  surchargeAmount: number;
}

const FinalPayableAmount = memo(function FinalPayableAmount({ courtRemaining, itemsSubtotal, services, surchargeAmount }: FinalPayableAmountProps) {
  const [nowTs, setNowTs] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const totalPayable = useMemo(() => {
    const servicesCost = services.reduce((sum, service) => {
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

    return Math.max(0, courtRemaining + itemsSubtotal + servicesCost + surchargeAmount);
  }, [services, nowTs, surchargeAmount, courtRemaining, itemsSubtotal]);

  return <span>{totalPayable.toLocaleString("vi-VN")} đ</span>;
});

export default FinalPayableAmount;
