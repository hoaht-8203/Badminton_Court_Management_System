import { downloadFileFromEndpoint } from "@/lib/common";

export const exportService = {
  async exportBookingHistory() {
    await downloadFileFromEndpoint("/api/exports/booking-history", "booking_history.xlsx");
    return true;
  },
};
