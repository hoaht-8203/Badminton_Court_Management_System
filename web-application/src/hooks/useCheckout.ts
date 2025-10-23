import { useQuery } from "@tanstack/react-query";
import { ordersService } from "@/services/ordersService";
import { CheckoutResponse } from "@/types-openapi/api";

export const useCheckoutInfo = (orderId: string) => {
  return useQuery({
    queryKey: ["checkout", orderId],
    queryFn: async () => {
      const response = await ordersService.getCheckoutInfo(orderId);
      return response.data as CheckoutResponse;
    },
    enabled: !!orderId,
  });
};
