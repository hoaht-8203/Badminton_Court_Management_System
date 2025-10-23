import { ApiError } from "@/lib/axios";
import { courtScheduleService } from "@/services/courtScheduleService";
import { paymentService, QrPaymentResponse } from "@/services/paymentService";
import {
  CancelBookingCourtRequest,
  CheckInBookingCourtRequest,
  CheckOutBookingCourtRequest,
  CreateBookingCourtRequest,
  DetailBookingCourtResponse,
  ListBookingCourtRequest,
  ListBookingCourtResponse,
  NoShowBookingCourtRequest,
} from "@/types-openapi/api";
import { ApiResponse } from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Query Keys
export const bookingCourtsKeys = {
  all: ["bookingCourts"] as const,
  lists: () => [...bookingCourtsKeys.all, "list"] as const,
  list: (params: ListBookingCourtRequest) => [...bookingCourtsKeys.lists(), params] as const,
  details: () => [...bookingCourtsKeys.all, "detail"] as const,
};

// List Booking Courts
export const useListBookingCourts = (params: ListBookingCourtRequest) => {
  return useQuery<ApiResponse<ListBookingCourtResponse[]>, ApiError>({
    queryKey: bookingCourtsKeys.list(params),
    queryFn: () => courtScheduleService.listBookings(params),
    enabled: true,
  });
};

// Create Booking Court
export const useCreateBookingCourt = () => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<DetailBookingCourtResponse>, ApiError, CreateBookingCourtRequest>({
    mutationFn: (data: CreateBookingCourtRequest) => courtScheduleService.createBooking(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingCourtsKeys.lists() });
    },
  });
};

export const useQrByBookingId = (bookingId?: string) => {
  return useQuery<ApiResponse<QrPaymentResponse | null>, ApiError>({
    queryKey: ["qrByBooking", bookingId],
    queryFn: () => paymentService.getQrByBookingId(bookingId as string),
    enabled: !!bookingId,
  });
};

export const useDetailBookingCourt = (id?: string) => {
  return useQuery<ApiResponse<DetailBookingCourtResponse>, ApiError>({
    queryKey: [...bookingCourtsKeys.details(), id],
    queryFn: () => courtScheduleService.detailBooking({ id: id as string }),
    enabled: !!id,
  });
};

// Cancel Booking Court
export function useCancelBookingCourt() {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<boolean>, ApiError, CancelBookingCourtRequest>({
    mutationFn: (data: CancelBookingCourtRequest) => courtScheduleService.cancelBooking(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingCourtsKeys.lists() });
    },
  });
}
