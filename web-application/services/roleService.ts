import { axiosInstance } from "@/lib/axios";
import {
  CreateRoleRequest,
  DeleteRoleRequest,
  DetailRoleRequest,
  DetailRoleResponse,
  ListRoleRequest,
  ListRoleResponse,
  UpdateRoleRequest,
} from "@/types-openapi/api";
import { ApiResponse } from "@/types/api";

export const roleService = {
  async listRole(
    payload: ListRoleRequest
  ): Promise<ApiResponse<ListRoleResponse[]>> {
    const res = await axiosInstance.get<ApiResponse<ListRoleResponse[]>>(
      "/api/roles/list",
      {
        params: payload,
      }
    );
    return res.data;
  },

  async detailRole(
    payload: DetailRoleRequest
  ): Promise<ApiResponse<DetailRoleResponse>> {
    const res = await axiosInstance.get<ApiResponse<DetailRoleResponse>>(
      "/api/roles/detail",
      {
        params: payload,
      }
    );
    return res.data;
  },

  async createRole(payload: CreateRoleRequest): Promise<ApiResponse<null>> {
    const res = await axiosInstance.post<ApiResponse<null>>(
      "/api/roles/create",
      payload
    );
    return res.data;
  },

  async updateRole(payload: UpdateRoleRequest): Promise<ApiResponse<null>> {
    const res = await axiosInstance.put<ApiResponse<null>>(
      "/api/roles/update",
      payload
    );
    return res.data;
  },

  async deleteRole(payload: DeleteRoleRequest): Promise<ApiResponse<null>> {
    const res = await axiosInstance.delete<ApiResponse<null>>(
      "/api/roles/delete",
      {
        params: payload,
      }
    );
    return res.data;
  },
};
