import { CreateBookingCourtRequest, DetailBookingCourtResponse, ListBookingCourtRequest, ListBookingCourtResponse } from "@/types-openapi/api";
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
};
