import { axiosInstance } from "@/lib/axios";
import { AddOrderItemRequest } from "@/types-openapi/api";

export interface CheckoutItemInput {
  productId: number | string;
  quantity: number;
}

export interface CheckoutEstimateResponse {
  bookingId: string;
  overdueMinutes: number; // minutes late beyond booked EndTime
  surchargeAmount: number; // extra fee for overtime
  itemsSubtotal: number; // total of items/services
  courtRemaining: number; // remaining court amount to pay
  finalPayable: number; // total to pay now (courtRemaining + itemsSubtotal + surcharge)
}

export const cashierService = {
  async addOrderItem(payload: AddOrderItemRequest): Promise<void> {
    await axiosInstance.post("/api/BookingCourts/order/add-item", payload);
  },

  async listOrderItems(
    bookingId: string,
  ): Promise<Array<{ productId: number; productName: string; image?: string; unitPrice: number; quantity: number }>> {
    const res = await axiosInstance.get("/api/BookingCourts/order/list", { params: { bookingId } });
    return res.data?.data || [];
  },

  async updateOrderItem(payload: { BookingCourtOccurrenceId: string; productId: number | string; quantity: number }): Promise<void> {
    await axiosInstance.post("/api/BookingCourts/order/update-item", {
      BookingCourtOccurrenceId: payload.BookingCourtOccurrenceId,
      productId: Number(payload.productId),
      quantity: payload.quantity,
    });
  },
};
