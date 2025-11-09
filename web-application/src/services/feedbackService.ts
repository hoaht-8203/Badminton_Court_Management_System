import { CreateFeedbackRequest, DetailFeedbackResponse, ListFeedbackRequest, ListFeedbackResponse } from "@/types-openapi/api";
import { axiosInstance } from "@/lib/axios";
import { ApiResponse } from "@/types/api";

export const feedbackService = {
  async createFeedback(request: CreateFeedbackRequest): Promise<ApiResponse<DetailFeedbackResponse>> {
    const response = await axiosInstance.post("api/Feedbacks/create", request);
    return response.data;
  },

  async getFeedbackById(id: number): Promise<ApiResponse<DetailFeedbackResponse>> {
    const response = await axiosInstance.get("api/Feedbacks/detail", { params: { id } });
    return response.data;
  },

  async updateFeedback(request: {
    id: number;
    rating?: number;
    comment?: string;
    courtQuality?: number;
    staffService?: number;
    cleanliness?: number;
    lighting?: number;
    valueForMoney?: number;
    mediaUrl?: string[];
    adminReply?: string | null;
  }): Promise<ApiResponse<DetailFeedbackResponse>> {
    const response = await axiosInstance.put("api/Feedbacks/update", request);
    return response.data;
  },

  async deleteFeedback(id: number): Promise<ApiResponse<boolean>> {
    const response = await axiosInstance.delete("api/Feedbacks/delete", { params: { id } });
    return response.data;
  },

  async getFeedbackByOccurrence(bookingCourtOccurrenceId: string): Promise<ApiResponse<ListFeedbackResponse[]>> {
    const response = await axiosInstance.get(`api/Feedbacks/list/${bookingCourtOccurrenceId}`);
    return response.data;
  },

  async getFeedbackByCustomer(customerId: number): Promise<ApiResponse<ListFeedbackResponse[]>> {
    const response = await axiosInstance.get(`api/Feedbacks/list/${customerId}`);
    return response.data;
  },

  async listFeedbacks(params?: ListFeedbackRequest): Promise<ApiResponse<ListFeedbackResponse[]>> {
    // Filter out null and undefined values before sending to API
    // Convert ListFeedbackRequest to query params format
    const queryParams: Record<string, any> = {};
    if (params) {
      if (params.id !== null && params.id !== undefined) {
        queryParams.id = params.id;
      }
      if (params.customerId !== null && params.customerId !== undefined) {
        queryParams.customerId = params.customerId;
      }
      if (params.bookingCourtOccurrenceId !== null && params.bookingCourtOccurrenceId !== undefined) {
        queryParams.bookingCourtOccurrenceId = params.bookingCourtOccurrenceId;
      }
      if (params.rating !== null && params.rating !== undefined) {
        queryParams.rating = params.rating;
      }
      if (params.status !== null && params.status !== undefined) {
        queryParams.status = params.status;
      }
      if (params.from !== null && params.from !== undefined) {
        queryParams.from = params.from;
      }
      if (params.to !== null && params.to !== undefined) {
        queryParams.to = params.to;
      }
    }
    const response = await axiosInstance.get("api/Feedbacks/list", { params: queryParams });
    return response.data;
  },
};
