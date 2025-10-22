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

// convenience hook: return a function that updates a cashflow by id
export function useUpdateCashflowFn() {
  const queryClient = useQueryClient();
  return async (id: number, payload: UpdateCashflowRequest) => {
    const res = await cashflowService.updateCashflow(id, payload);
    await queryClient.invalidateQueries({ queryKey: ["cashflows"] });
    return res;
  };
}
// Get cashflow types by isPayment
export function useCashflowTypes(isPayment?: boolean) {
  return useQuery({
    queryKey: ["cashflowTypes", isPayment],
    queryFn: async () => cashflowService.getTypes(isPayment as boolean),
    enabled: typeof isPayment === "boolean",
  });
}

// Get related persons by personType
export function useRelatedPersons(personType: string) {
  return useQuery({
    queryKey: ["relatedPersons", personType],
    queryFn: async () => cashflowService.getRelatedPersons(personType),
    enabled: !!personType,
  });
}
