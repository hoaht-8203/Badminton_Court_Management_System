import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { scheduleService } from "@/services/schechuleService";
import { courtScheduleService } from "@/services/courtScheduleService";
import { ListUserBookingHistoryResponse, ScheduleRequest, WeeklyScheduleRequest } from "@/types-openapi/api";
import { ApiError } from "@/lib/axios";
import { ApiResponse } from "@/types/api";

export function useGetScheduleByShift(request: WeeklyScheduleRequest) {
  return useQuery({
    queryKey: ["schedule", "by-shift", request],
    queryFn: async () => {
      const res = await scheduleService.getScheduleByShift(request);
      return res;
    },
  });
}

export function useGetScheduleByStaff(request: WeeklyScheduleRequest) {
  return useQuery({
    queryKey: ["schedule", "by-staff", request],
    queryFn: () => scheduleService.getScheduleByStaff(request),
  });
}

export function useGetMySchedule(request: { startDate: string; endDate: string }) {
  return useQuery({
    queryKey: ["schedule", "my-schedule", request],
    queryFn: () => scheduleService.getMySchedule(request),
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

export function useGetUserBookingHistory() {
  return useQuery<ApiResponse<ListUserBookingHistoryResponse[]>, ApiError>({
    queryKey: ["booking-history", "user"],
    queryFn: () => courtScheduleService.getUserBookingHistory(),
  });
}
