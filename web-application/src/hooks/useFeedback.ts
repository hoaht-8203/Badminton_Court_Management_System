import { feedbackService } from "@/services/feedbackService";
import { CreateFeedbackRequest, ListFeedbackRequest } from "@/types-openapi/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { message } from "antd";

export function useCreateFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateFeedbackRequest) => feedbackService.createFeedback(request),
    onSuccess: () => {
      message.success("Gửi đánh giá thành công!");
      queryClient.invalidateQueries({ queryKey: ["feedbacks"] });
      queryClient.invalidateQueries({ queryKey: ["booking-history"] });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || "Gửi đánh giá thất bại!";
      message.error(errorMessage);
    },
  });
}

export function useUpdateFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: {
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
    }) => feedbackService.updateFeedback(request),
    onSuccess: () => {
      message.success("Cập nhật đánh giá thành công!");
      queryClient.invalidateQueries({ queryKey: ["feedbacks"] });
      queryClient.invalidateQueries({ queryKey: ["booking-history"] });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || "Cập nhật đánh giá thất bại!";
      message.error(errorMessage);
    },
  });
}

export function useGetFeedbackByOccurrence(bookingCourtOccurrenceId: string | undefined, enabled: boolean = true) {
  return useQuery({
    queryKey: ["feedbacks", "occurrence", bookingCourtOccurrenceId],
    queryFn: () => feedbackService.getFeedbackByOccurrence(bookingCourtOccurrenceId!),
    enabled: enabled && !!bookingCourtOccurrenceId,
  });
}

// Hook to get feedback detail by ID (includes all fields like courtQuality, etc.)
export function useGetFeedbackDetail(id: number | undefined, enabled: boolean = true) {
  return useQuery({
    queryKey: ["feedbacks", "detail", id],
    queryFn: () => feedbackService.getFeedbackById(id!),
    enabled: enabled && !!id,
  });
}

export function useGetFeedbackByCustomer(customerId: number | undefined, enabled: boolean = true) {
  return useQuery({
    queryKey: ["feedbacks", "customer", customerId],
    queryFn: () => feedbackService.getFeedbackByCustomer(customerId!),
    enabled: enabled && !!customerId,
  });
}

export function useListFeedbacks(params?: ListFeedbackRequest) {
  return useQuery({
    queryKey: ["feedbacks", "list", params],
    queryFn: () => feedbackService.listFeedbacks(params),
  });
}

export function useDeleteFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: { id: number }) => feedbackService.deleteFeedback(request.id),
    onSuccess: () => {
      message.success("Xóa feedback thành công!");
      queryClient.invalidateQueries({ queryKey: ["feedbacks"] });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || "Xóa feedback thất bại!";
      message.error(errorMessage);
    },
  });
}
