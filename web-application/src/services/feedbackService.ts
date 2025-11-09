import { CreateFeedbackRequest, DetailFeedbackResponse, ListFeedbackResponse } from "@/types-openapi/api";
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

  async listFeedbacks(params?: {
    id?: number;
    customerId?: number;
    bookingCourtOccurrenceId?: string;
    rating?: number;
    status?: string;
    from?: Date;
    to?: Date;
  }): Promise<ApiResponse<ListFeedbackResponse[]>> {
    const response = await axiosInstance.get("api/Feedbacks/list", { params });
    return response.data;
  },
};
