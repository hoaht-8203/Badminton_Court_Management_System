import { create } from "lodash";
import { cashflowService } from "@/services/cashflowService";
import { CreateCashflowRequest, ListCashflowRequest, UpdateCashflowRequest } from "@/types-openapi/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useListCashflow(params: ListCashflowRequest) {
  return useQuery({
    queryKey: ["cashflows", params],
    queryFn: async () => cashflowService.listCashflow(params),
  });
}

export function useCreateCashflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateCashflowRequest) => cashflowService.createCashflow(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashflows"] });
    },
  });
}

export function useUpdateCashflow(cashflowId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateCashflowRequest) => cashflowService.updateCashflow(cashflowId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashflows"] });
    },
  });
}
