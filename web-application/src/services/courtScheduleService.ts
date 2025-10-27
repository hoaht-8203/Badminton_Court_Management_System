import {
  CancelBookingCourtRequest,
  CheckInBookingCourtRequest,
  CheckOutBookingCourtRequest,
  CreateBookingCourtRequest,
  DetailBookingCourtOccurrenceRequest,
  DetailBookingCourtOccurrenceResponse,
  DetailBookingCourtResponse,
  ListBookingCourtOccurrenceRequest,
  ListBookingCourtOccurrenceResponse,
  ListBookingCourtRequest,
  ListBookingCourtResponse,
  NoShowBookingCourtRequest,
  UserCreateBookingCourtRequest,
} from "@/types-openapi/api";
import { axiosInstance } from "@/lib/axios";
import { ApiResponse } from "@/types/api";

export const courtScheduleService = {
  async createBooking(payload: CreateBookingCourtRequest): Promise<ApiResponse<DetailBookingCourtResponse>> {
    const response = await axiosInstance.post("api/BookingCourts/create", payload);
    return response.data;
  },

  async userCreateBooking(payload: UserCreateBookingCourtRequest): Promise<ApiResponse<DetailBookingCourtResponse>> {
    const response = await axiosInstance.post("api/BookingCourts/user/create", payload);
    return response.data;
  },

  async listBookings(payload: ListBookingCourtRequest): Promise<ApiResponse<ListBookingCourtResponse[]>> {
    const response = await axiosInstance.get("api/BookingCourts/list", { params: payload });
    return response.data;
  },

  async detailBooking(payload: { id: string }): Promise<ApiResponse<DetailBookingCourtResponse>> {
    const response = await axiosInstance.get("api/BookingCourts/detail", { params: payload });
    return response.data;
  },

  async listBookingOccurrences(payload: ListBookingCourtOccurrenceRequest): Promise<ApiResponse<ListBookingCourtOccurrenceResponse[]>> {
    const response = await axiosInstance.get("api/BookingCourts/occurrences", { params: payload });
    return response.data;
  },

  async detailBookingOccurrence(payload: DetailBookingCourtOccurrenceRequest): Promise<ApiResponse<DetailBookingCourtOccurrenceResponse>> {
    const response = await axiosInstance.get("api/BookingCourts/occurrence/detail", { params: payload });
    return response.data;
  },

  async cancelBooking(payload: CancelBookingCourtRequest): Promise<ApiResponse<boolean>> {
    const response = await axiosInstance.post("api/BookingCourts/cancel", payload);
    return response.data;
  },

  async checkInBookingOccurrence(payload: CheckInBookingCourtRequest): Promise<ApiResponse<boolean>> {
    const response = await axiosInstance.post("api/BookingCourts/checkin", payload);
    return response.data;
  },

  async checkOutBookingOccurrence(payload: CheckOutBookingCourtRequest): Promise<ApiResponse<boolean>> {
    const response = await axiosInstance.post("api/BookingCourts/checkout", payload);
    return response.data;
  },

  async noShowBookingOccurrence(payload: NoShowBookingCourtRequest): Promise<ApiResponse<boolean>> {
    const response = await axiosInstance.post("api/BookingCourts/noshow", payload);
    return response.data;
  },
};
