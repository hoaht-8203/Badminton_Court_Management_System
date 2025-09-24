import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { shiftService } from "@/services/shiftService";
import { ShiftRequest, ShiftResponse } from "@/types-openapi/api";

export function useListShifts(params?: any) {
  return useQuery({
    queryKey: ["shifts"],
    queryFn: async () => {
      const res = await shiftService.list();
      return res.data ?? [];
    },
  });
}

export function useGetShiftById(id: number) {
  return useQuery({
    queryKey: ["shift", id],
    queryFn: async () => {
      const res = await shiftService.getById(id);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ShiftResponse) => shiftService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
    },
  });
}

export function useUpdateShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ShiftRequest & { id: number }) => shiftService.update(data.id, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      queryClient.invalidateQueries({ queryKey: ["shift", variables.id] });
    },
  });
}

export function useDeleteShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => shiftService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
    },
  });
}
