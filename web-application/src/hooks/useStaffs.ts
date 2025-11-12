import { staffService } from "@/services/staffService";
import type { ListStaffRequest, StaffRequest } from "@/types-openapi/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
    // Use the dedicated changeStatus endpoint to avoid sending a full StaffRequest
    mutationFn: async (data: { isActive: boolean }) =>
      staffService.changeStatus({ staffId: staffId, isActive: data.isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staffs"] });
      queryClient.invalidateQueries({ queryKey: ["staff", staffId] });
    },
  });
}
export function useChangeStaffStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { staffId: number; isActive: boolean }) => staffService.changeStatus(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staffs"] });
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
