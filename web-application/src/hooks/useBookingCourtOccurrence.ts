import { ApiError } from "@/lib/axios";
import { courtScheduleService } from "@/services/courtScheduleService";
import {
  CheckInBookingCourtRequest,
  CheckOutBookingCourtRequest,
  DetailBookingCourtOccurrenceRequest,
  DetailBookingCourtOccurrenceResponse,
  ListBookingCourtOccurrenceRequest,
  ListBookingCourtOccurrenceResponse,
  NoShowBookingCourtRequest,
} from "@/types-openapi/api";
import { ApiResponse } from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const bookingCourtOccurrenceKeys = {
  lists: () => ["bookingCourtOccurrences", "list"] as const,
  list: (params: ListBookingCourtOccurrenceRequest) => ["bookingCourtOccurrences", "list", params] as const,
  details: () => ["bookingCourtOccurrences", "detail"] as const,
  detail: (id: string) => ["bookingCourtOccurrences", "detail", id] as const,
};

export function useListBookingCourtOccurrences(params: ListBookingCourtOccurrenceRequest) {
  return useQuery<ApiResponse<ListBookingCourtOccurrenceResponse[]>, ApiError>({
    queryKey: bookingCourtOccurrenceKeys.list(params),
    queryFn: () => courtScheduleService.listBookingOccurrences(params),
  });
}

export function useDetailBookingCourtOccurrence(params: DetailBookingCourtOccurrenceRequest) {
  return useQuery<ApiResponse<DetailBookingCourtOccurrenceResponse>, ApiError>({
    queryKey: bookingCourtOccurrenceKeys.detail(params.id),
    queryFn: () => courtScheduleService.detailBookingOccurrence({ id: params.id }),
    enabled: !!params.id,
  });
}

export function useCheckInBookingCourtOccurrence() {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<boolean>, ApiError, CheckInBookingCourtRequest>({
    mutationFn: (params) => courtScheduleService.checkInBookingOccurrence(params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: bookingCourtOccurrenceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bookingCourtOccurrenceKeys.detail(variables.id) });
    },
  });
}

export function useCheckOutBookingCourtOccurrence() {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<boolean>, ApiError, CheckOutBookingCourtRequest>({
    mutationFn: (params) => courtScheduleService.checkOutBookingOccurrence(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingCourtOccurrenceKeys.lists() });
    },
  });
}

export function useNoShowBookingCourtOccurrence() {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<boolean>, ApiError, NoShowBookingCourtRequest>({
    mutationFn: (params) => courtScheduleService.noShowBookingOccurrence(params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: bookingCourtOccurrenceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bookingCourtOccurrenceKeys.detail(variables.id) });
    },
  });
}
