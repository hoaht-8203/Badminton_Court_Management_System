import { axiosInstance } from "@/lib/axios";
import { DetailPaymentResponse } from "@/types-openapi/api";
import { ApiResponse } from "@/types/api";

export interface QrPaymentResponse {
  paymentId: string;
  qrUrl: string;
  amount: number;
  expiresAtUtc?: string;
  holdMinutes: number;
}

export const paymentService = {
  async getQrByBookingId(bookingId: string): Promise<ApiResponse<QrPaymentResponse | null>> {
    const response = await axiosInstance.get("api/Payments/qr-by-booking-id", { params: { bookingId } });
    return response.data;
  },

  async getUserPaymentHistory(): Promise<ApiResponse<DetailPaymentResponse[]>> {
    const response = await axiosInstance.get("api/Payments/user/history");
    return response.data;
  },
};
