import { axiosInstance, ApiResponse } from "../lib/axios";

export type ListUserBookingHistoryResponse = {
  id?: string;
  paymentId?: string | null;
  customerId?: number;
  customerName?: string | null;
  courtId?: string;
  courtName?: string | null;
  startDate?: Date;
  endDate?: Date;
  startTime?: string;
  endTime?: string;
  daysOfWeek?: Array<number> | null;
  status?: string | null;
  totalHours?: number;
  totalAmount?: number;
  paidAmount?: number;
  remainingAmount?: number;
  bookingCourtOccurrences?: Array<{
    id?: string;
    date?: Date;
    startTime?: string;
    endTime?: string;
    status?: string | null;
    note?: string | null;
    payments?: Array<PaymentDto> | null;
  }> | null;
  payments?: Array<PaymentDto> | null;
  customer?: any;
  // Inline QR/payment info for quick checkout (when transfer method)
  paymentAmount?: number | null;
  qrUrl?: string | null;
  holdMinutes?: number | null;
  expiresAtUtc?: Date | null;
};

export type PaymentDto = {
  id?: string;
  amount?: number;
  status?: string | null;
  paymentCreatedAt?: Date;
  note?: string | null;
};

export const bookingService = {
  async getUserBookingHistory(): Promise<ApiResponse<ListUserBookingHistoryResponse[]>> {
    const res = await axiosInstance.get<ApiResponse<ListUserBookingHistoryResponse[]>>(
      "/api/BookingCourts/user/history"
    );
    return res.data;
  },
};

