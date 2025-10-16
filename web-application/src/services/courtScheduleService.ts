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
import { axiosInstance } from "@/lib/axios";
import { ApiResponse } from "@/types/api";

export const courtScheduleService = {
  async createBooking(payload: CreateBookingCourtRequest): Promise<ApiResponse<DetailBookingCourtResponse>> {
    const response = await axiosInstance.post("api/BookingCourts/create", payload);
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

  async cancelBooking(payload: CancelBookingCourtRequest): Promise<ApiResponse<boolean>> {
    const response = await axiosInstance.post("api/BookingCourts/cancel", payload);
    return response.data;
  },

  async checkInBooking(payload: CheckInBookingCourtRequest): Promise<ApiResponse<boolean>> {
    const response = await axiosInstance.post("api/BookingCourts/checkin", payload);
    return response.data;
  },

  async checkOutBooking(payload: CheckOutBookingCourtRequest): Promise<ApiResponse<boolean>> {
    const response = await axiosInstance.post("api/BookingCourts/checkout", payload);
    return response.data;
  },

  async noShowBooking(payload: NoShowBookingCourtRequest): Promise<ApiResponse<boolean>> {
    const response = await axiosInstance.post("api/BookingCourts/noshow", payload);
    return response.data;
  },
};
