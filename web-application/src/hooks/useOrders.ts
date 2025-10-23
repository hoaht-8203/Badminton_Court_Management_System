import { useQuery } from "@tanstack/react-query";
import { ordersService } from "@/services/ordersService";
import { OrderResponse } from "@/types-openapi/api";

export interface PendingPaymentOrdersParams {
  status?: string;
  paymentMethod?: string;
}

export const usePendingPaymentOrders = (params?: PendingPaymentOrdersParams) => {
  return useQuery<OrderResponse[]>({
    queryKey: ["orders", "pending-payments", params],
    queryFn: async () => {
      const response = await ordersService.getPendingPaymentOrders(params);
      return response.data as OrderResponse[];
    },
  });
};
