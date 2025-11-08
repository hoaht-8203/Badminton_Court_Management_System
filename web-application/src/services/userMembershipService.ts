import { axiosInstance } from "@/lib/axios";
import {
  CreateUserMembershipRequest,
  CreateUserMembershipForCurrentUserRequest,
  CreateUserMembershipResponse,
  ExtendPaymentRequest,
  ListUserMembershipRequest,
  UpdateUserMembershipStatusRequest,
  UserMembershipResponse,
} from "@/types-openapi/api";
import { ApiResponse } from "@/types/api";

export const userMembershipService = {
  async list(payload: ListUserMembershipRequest): Promise<ApiResponse<UserMembershipResponse[]>> {
    const res = await axiosInstance.get<ApiResponse<UserMembershipResponse[]>>("/api/usermemberships/list", {
      params: payload,
    });
    return res.data;
  },

  async detail(id: number): Promise<ApiResponse<UserMembershipResponse>> {
    const res = await axiosInstance.get<ApiResponse<UserMembershipResponse>>("/api/usermemberships/detail", {
      params: { id },
    });
    return res.data;
  },

  async create(payload: CreateUserMembershipRequest): Promise<ApiResponse<CreateUserMembershipResponse>> {
    const res = await axiosInstance.post<ApiResponse<CreateUserMembershipResponse>>("/api/usermemberships/create", payload);
    return res.data;
  },

  async createForCurrentUser(payload: CreateUserMembershipForCurrentUserRequest): Promise<ApiResponse<CreateUserMembershipResponse>> {
    const res = await axiosInstance.post<ApiResponse<CreateUserMembershipResponse>>("/api/usermemberships/create-for-current-user", payload);
    return res.data;
  },

  async updateStatus(payload: UpdateUserMembershipStatusRequest): Promise<ApiResponse<null>> {
    const res = await axiosInstance.put<ApiResponse<null>>("/api/usermemberships/update-status", payload);
    return res.data;
  },

  async delete(payload: { id: number }): Promise<ApiResponse<null>> {
    const res = await axiosInstance.delete<ApiResponse<null>>("/api/usermemberships/delete", { params: payload });
    return res.data;
  },
  async extendPayment(payload: ExtendPaymentRequest): Promise<ApiResponse<CreateUserMembershipResponse>> {
    const res = await axiosInstance.post<ApiResponse<CreateUserMembershipResponse>>("/api/usermemberships/extend-payment", payload);
    return res.data;
  },
};
