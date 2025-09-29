"use client";

import CourtScheduler from "@/components/quanlysancaulong/court-schedule/court-schedule";
import { useListCourtGroupByCourtArea } from "@/hooks/useCourt";

const CourtSchedulePage = () => {
  const { data: courtGroupByCourtAreaData } = useListCourtGroupByCourtArea();

  return (
    <div>
      <CourtScheduler courts={courtGroupByCourtAreaData?.data ?? []} />
    </div>
  );
};

export default CourtSchedulePage;
