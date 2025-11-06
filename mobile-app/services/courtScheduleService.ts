import { axiosInstance, ApiResponse } from "../lib/axios";

// Minimal request/response shapes to mirror web service usage
export type UserCreateBookingCourtRequest = {
  userId?: number | string | null;
  courtId: string;
  startDate: Date;
  endDate: Date;
  startTime: string; // HH:mm:ss
  endTime: string; // HH:mm:ss
  daysOfWeek?: number[];
  note?: string | null;
  payInFull?: boolean;
};

export type DetailBookingCourtResponse = any;
export type ListBookingCourtRequest = any;
export type ListBookingCourtResponse = any;
export type ListBookingCourtOccurrenceRequest = any;
export type ListBookingCourtOccurrenceResponse = any;
export type DetailBookingCourtOccurrenceRequest = any;
export type DetailBookingCourtOccurrenceResponse = any;

export const courtScheduleService = {
  async userCreateBooking(
    payload: UserCreateBookingCourtRequest
  ): Promise<ApiResponse<DetailBookingCourtResponse>> {
    const response = await axiosInstance.post(
      "api/BookingCourts/user/create",
      payload
    );
    return response.data;
  },

  async listBookings(
    payload: ListBookingCourtRequest
  ): Promise<ApiResponse<ListBookingCourtResponse[]>> {
    const response = await axiosInstance.get("api/BookingCourts/list", {
      params: payload,
    });
    return response.data;
  },

  async detailBooking(payload: {
    id: string;
  }): Promise<ApiResponse<DetailBookingCourtResponse>> {
    const response = await axiosInstance.get("api/BookingCourts/detail", {
      params: payload,
    });
    return response.data;
  },

  async listBookingOccurrences(
    payload: ListBookingCourtOccurrenceRequest
  ): Promise<ApiResponse<ListBookingCourtOccurrenceResponse[]>> {
    const response = await axiosInstance.get("api/BookingCourts/occurrences", {
      params: payload,
    });
    return response.data;
  },

  async detailBookingOccurrence(
    payload: DetailBookingCourtOccurrenceRequest
  ): Promise<ApiResponse<DetailBookingCourtOccurrenceResponse>> {
    const response = await axiosInstance.get(
      "api/BookingCourts/occurrence/detail",
      {
        params: payload,
      }
    );
    return response.data;
  },

  async listCourts(): Promise<
    ApiResponse<
      {
        id: string;
        name: string;
        imageUrl?: string | null;
        courtAreaId?: number | null;
        courtAreaName?: string | null;
        note?: string | null;
        status?: string | null;
      }[]
    >
  > {
    const response = await axiosInstance.get("/api/Courts/list");
    return response.data;
  },
};
