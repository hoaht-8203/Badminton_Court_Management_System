import { axiosInstance } from "@/lib/axios";
import { AddOrderItemRequest, CheckoutRequest, CheckoutResponse, AddBookingServiceRequest } from "@/types-openapi/api";

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
  async estimateCheckout(payload: { bookingId: string; items: CheckoutItemInput[] }): Promise<CheckoutEstimateResponse> {
    // Note: backend endpoint to be implemented server-side
    const res = await axiosInstance.post("/api/BookingCourts/checkout/estimate", payload);
    return res.data?.data as CheckoutEstimateResponse;
  },

  async confirmCheckout(payload: { bookingId: string; items: CheckoutItemInput[] }): Promise<{ paymentId: string; finalPayable: number }> {
    const res = await axiosInstance.post("/api/BookingCourts/checkout/confirm", payload);
    return res.data?.data as { paymentId: string; finalPayable: number };
  },

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

  async checkout(payload: CheckoutRequest): Promise<CheckoutResponse> {
    const res = await axiosInstance.post("/api/Orders/checkout", payload);
    return res.data?.data as CheckoutResponse;
  },

  async addService(payload: AddBookingServiceRequest): Promise<void> {
    await axiosInstance.post("/api/Services/booking-occurrence/add-service", payload);
  },

  async getCheckoutInfo(orderId: string): Promise<CheckoutResponse> {
    const res = await axiosInstance.get(`/api/Orders/checkout/${orderId}`);
    return res.data?.data as CheckoutResponse;
  },
};
