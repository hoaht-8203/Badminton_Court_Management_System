import { payrollService } from "@/services/payrollService";
import { CreatePayrollRequest, PayrollDetailResponse, PayrollItemResponse } from "@/types-openapi/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useListPayrolls(params: any) {
  return useQuery({
    queryKey: ["payrolls", params],
    queryFn: async () => payrollService.list(params),
  });
}

export function useGetPayrollById(id?: number) {
  return useQuery<PayrollDetailResponse | null>({
    queryKey: ["payroll", id],
    queryFn: async () => {
      const res = await payrollService.getById(id!);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreatePayroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreatePayrollRequest) => payrollService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payrolls"] });
    },
  });
}

export function useRefreshPayroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payrollId: number) => payrollService.refresh(payrollId),
    onSuccess: (_result, payrollId) => {
      queryClient.invalidateQueries({ queryKey: ["payrolls"] });
      queryClient.invalidateQueries({ queryKey: ["payroll", payrollId] });
    },
  });
}

export function usePayPayrollItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { payrollItemId: number; amount: number }) => payrollService.payItem(payload.payrollItemId, payload.amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payrolls"] });
    },
  });
}

export function useGetPayrollItemsByStaff(staffId?: number) {
  return useQuery<PayrollItemResponse[] | null>({
    queryKey: ["payrollItems", staffId],
    queryFn: async () => {
      if (!staffId) return null;
      const res = await payrollService.getItemsByStaff(staffId);
      return res.data;
    },
    enabled: !!staffId,
  });
}

export function useDeletePayroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payrollId: number) => payrollService.delete(payrollId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payrolls"] });
    },
  });
}
