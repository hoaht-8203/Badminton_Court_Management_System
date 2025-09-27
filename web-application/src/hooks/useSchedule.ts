import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { scheduleService } from "@/services/schechuleService";
import { ScheduleRequest } from "@/types-openapi/api";

export function useGetScheduleByShift(request: ScheduleRequest) {
  return useQuery({
    queryKey: ["schedule", "by-shift", request],
    queryFn: async () => {
      const res = await scheduleService.getScheduleByShift(request);
      return res.data;
    },
  });
}

export function useGetScheduleByStaff(request: ScheduleRequest) {
  return useQuery({
    queryKey: ["schedule", "by-staff", request],
    queryFn: () => scheduleService.getScheduleByStaff(request),
  });
}

export function useAssignSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: ScheduleRequest) => scheduleService.assign(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule"] });
    },
  });
}

export function useRemoveSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: ScheduleRequest) => scheduleService.remove(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule"] });
    },
  });
}
