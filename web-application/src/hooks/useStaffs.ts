import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { StaffApi } from "@/types-openapi/api";
import type { ListStaffRequest, StaffRequest, StaffResponse, StaffResponseListApiResponse } from "@/types-openapi/api";
import { staffService } from "@/services/staffService";

export function useListStaffs(params: ListStaffRequest) {
  return useQuery({
    queryKey: ["staffs", params],
    queryFn: async () => staffService.list(params),
  });
}

export function useGetStaffById(staffId: number) {
  return useQuery({
    queryKey: ["staff", staffId],
    queryFn: async () => staffService.getById(staffId),
    enabled: !!staffId,
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: StaffRequest) => staffService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staffs"] });
    },
  });
}
export function useUpdateStaff(staffId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: StaffRequest) => staffService.update(staffId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staffs"] });
      queryClient.invalidateQueries({ queryKey: ["staff", staffId] });
    },
  });
}

export function useUpdateStaffStatus(staffId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { isActive: boolean }) => staffService.update(staffId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staffs"] });
      queryClient.invalidateQueries({ queryKey: ["staff", staffId] });
    },
  });
}

// export function useDeleteStaff(staffId: number) {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: async () => staffService.delete(staffId),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["staffs"] });
//     },
//   });
// }
