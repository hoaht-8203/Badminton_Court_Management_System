import { axiosInstance } from "@/lib/axios";
import {
  AddBookingServiceRequest,
  BookingServiceDto,
  ChangeServiceStatusRequest,
  CreateServiceRequest,
  DetailServiceRequest,
  DetailServiceResponse,
  EndServiceRequest,
  ListServiceRequest,
  ListServiceResponse,
  RemoveBookingServiceRequest,
  UpdateServiceRequest,
} from "@/types-openapi/api";
import { ApiResponse } from "@/types/api";

export const serviceService = {
  async listService(payload: ListServiceRequest): Promise<ApiResponse<ListServiceResponse[]>> {
    const res = await axiosInstance.get<ApiResponse<ListServiceResponse[]>>("/api/services/list", {
      params: payload,
    });
    return res.data;
  },

  async detailService(payload: DetailServiceRequest): Promise<ApiResponse<DetailServiceResponse>> {
    const res = await axiosInstance.get<ApiResponse<DetailServiceResponse>>("/api/services/detail", {
      params: payload,
    });
    return res.data;
  },

  async createService(payload: CreateServiceRequest): Promise<ApiResponse<null>> {
    const res = await axiosInstance.post<ApiResponse<null>>("/api/services/create", payload);
    return res.data;
  },

  async updateService(payload: UpdateServiceRequest): Promise<ApiResponse<null>> {
    const res = await axiosInstance.put<ApiResponse<null>>("/api/services/update", payload);
    return res.data;
  },

  async changeServiceStatus(payload: ChangeServiceStatusRequest): Promise<ApiResponse<null>> {
    const res = await axiosInstance.put<ApiResponse<null>>("/api/services/change-status", payload);
    return res.data;
  },

  async addBookingService(payload: AddBookingServiceRequest): Promise<ApiResponse<BookingServiceDto>> {
    const res = await axiosInstance.post<ApiResponse<BookingServiceDto>>("/api/services/booking-occurrence/add-service", payload);
    return res.data;
  },

  async removeBookingService(payload: RemoveBookingServiceRequest): Promise<ApiResponse<null>> {
    const res = await axiosInstance.post<ApiResponse<null>>("/api/services/booking-occurrence/remove-service", payload);
    return res.data;
  },

  async getBookingServices(bookingCourtOccurrenceId: string): Promise<ApiResponse<BookingServiceDto[]>> {
    const res = await axiosInstance.get<ApiResponse<BookingServiceDto[]>>(`/api/services/booking-occurrence/${bookingCourtOccurrenceId}/services`, {
      params: { bookingCourtOccurrenceId },
    });
    return res.data;
  },

  async endService(payload: EndServiceRequest): Promise<ApiResponse<BookingServiceDto>> {
    const res = await axiosInstance.put<ApiResponse<BookingServiceDto>>("/api/services/booking-occurrence/end-service", payload);
    return res.data;
  },
};
