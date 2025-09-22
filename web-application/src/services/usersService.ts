import { axiosInstance } from "@/lib/axios";
import {
  ChangeUserStatusRequest,
  CreateAdministratorRequest,
  DetailAdministratorRequest,
  DetailAdministratorResponse,
  ListAdministratorRequest,
  ListAdministratorResponse,
  ListUserRoleItemResponse,
  ListUserRolesRequest,
  UpdateUserRequest,
  UpdateUserRolesRequest,
} from "@/types-openapi/api";
import { ApiResponse } from "@/types/api";

export const usersService = {
  async changeUserStatus(payload: ChangeUserStatusRequest): Promise<ApiResponse<null>> {
    const res = await axiosInstance.post<ApiResponse<null>>("/api/users/change-user-status", payload);
    return res.data;
  },

  async listAdministrator(payload: ListAdministratorRequest): Promise<ApiResponse<ListAdministratorResponse[]>> {
    const res = await axiosInstance.get<ApiResponse<ListAdministratorResponse[]>>("/api/users/list-administrator", {
      params: payload,
    });

    return res.data;
  },

  async detailAdministrator(payload: DetailAdministratorRequest): Promise<ApiResponse<DetailAdministratorResponse>> {
    const res = await axiosInstance.get<ApiResponse<DetailAdministratorResponse>>("/api/users/detail-administrator", {
      params: payload,
    });
    return res.data;
  },

  async createAdministrator(payload: CreateAdministratorRequest): Promise<ApiResponse<null>> {
    const res = await axiosInstance.post<ApiResponse<null>>("/api/users/create-administrator", payload);
    return res.data;
  },

  async updateAdministrator(payload: UpdateUserRequest): Promise<ApiResponse<null>> {
    const res = await axiosInstance.put<ApiResponse<null>>("/api/users/update-administrator", payload);
    return res.data;
  },

  async updateUserRoles(payload: UpdateUserRolesRequest): Promise<ApiResponse<null>> {
    const res = await axiosInstance.put<ApiResponse<null>>("/api/users/update-user-roles", payload);
    return res.data;
  },

  async listUserRoles(payload: ListUserRolesRequest): Promise<ApiResponse<ListUserRoleItemResponse[]>> {
    const res = await axiosInstance.get<ApiResponse<ListUserRoleItemResponse[]>>("/api/users/list-user-roles", {
      params: payload,
    });
    return res.data;
  },
};
