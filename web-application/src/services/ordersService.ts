import { CheckoutBookingRequest as CheckoutRequest, CheckoutResponse, ListOrderRequest, ListOrderResponse, OrderResponse } from "@/types-openapi/api";
import { axiosInstance } from "@/lib/axios";
import { ApiResponse } from "@/types/api";
import { PendingPaymentOrdersParams } from "@/hooks/useOrders";

export const ordersService = {
  async checkout(payload: CheckoutRequest): Promise<ApiResponse<CheckoutResponse>> {
    const response = await axiosInstance.post("api/Orders/checkout", payload);
    return response.data;
  },

  async getOrderById(orderId: string): Promise<ApiResponse<OrderResponse>> {
    const response = await axiosInstance.get(`api/Orders/${orderId}`);
    return response.data;
  },

  async getOrdersByBookingId(bookingId: string): Promise<ApiResponse<OrderResponse[]>> {
    const response = await axiosInstance.get(`api/Orders/booking/${bookingId}`);
    return response.data;
  },

  async getPendingPaymentOrders(params?: PendingPaymentOrdersParams): Promise<ApiResponse<OrderResponse[]>> {
    const response = await axiosInstance.get("api/Orders/pending-payments", { params });
    return response.data;
  },

  async getCheckoutInfo(orderId: string): Promise<ApiResponse<CheckoutResponse>> {
    const response = await axiosInstance.get(`api/Orders/checkout/${orderId}`);
    return response.data;
  },

  async confirmPayment(orderId: string): Promise<ApiResponse<boolean>> {
    const response = await axiosInstance.post(`api/Orders/${orderId}/confirm-payment`);
    return response.data;
  },

  async extendPaymentTime(orderId: string): Promise<ApiResponse<boolean>> {
    const response = await axiosInstance.post(`api/Orders/${orderId}/extend-payment`);
    return response.data;
  },

  async getOrders(params?: ListOrderRequest): Promise<ApiResponse<ListOrderResponse[]>> {
    const response = await axiosInstance.get("api/Orders/list", { params });
    return response.data;
  },
};
