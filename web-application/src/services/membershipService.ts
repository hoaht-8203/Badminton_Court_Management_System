import { axiosInstance } from "@/lib/axios";
import {
  CreateMembershipRequest,
  DeleteMembershipRequest,
  DetailMembershipRequest,
  DetailMembershipResponse,
  ListMembershipRequest,
  ListMembershipResponse,
  UpdateMembershipRequest,
  UpdateMemberShipStatusRequest,
} from "@/types-openapi/api";
import { ApiResponse } from "@/types/api";

export const membershipService = {
  async listMembership(payload: ListMembershipRequest): Promise<ApiResponse<ListMembershipResponse[]>> {
    const res = await axiosInstance.get<ApiResponse<ListMembershipResponse[]>>("/api/memberships/list", {
      params: payload,
    });

    return res.data;
  },

  async detailMembership(payload: DetailMembershipRequest): Promise<ApiResponse<DetailMembershipResponse>> {
    const res = await axiosInstance.get<ApiResponse<DetailMembershipResponse>>("/api/memberships/detail", {
      params: payload,
    });
    return res.data;
  },

  async createMembership(payload: CreateMembershipRequest): Promise<ApiResponse<null>> {
    const res = await axiosInstance.post<ApiResponse<null>>("/api/memberships/create", payload);
    return res.data;
  },

  async updateMembership(payload: UpdateMembershipRequest): Promise<ApiResponse<null>> {
    const res = await axiosInstance.put<ApiResponse<null>>("/api/memberships/update", payload);
    return res.data;
  },

  async deleteMembership(payload: DeleteMembershipRequest): Promise<ApiResponse<null>> {
    const res = await axiosInstance.delete<ApiResponse<null>>("/api/memberships/delete", {
      params: payload,
    });
    return res.data;
  },

  async updateMembershipStatus(payload: UpdateMemberShipStatusRequest): Promise<ApiResponse<null>> {
    const res = await axiosInstance.put<ApiResponse<null>>("/api/memberships/update-status", payload);
    return res.data;
  },
};
