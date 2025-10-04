import { axiosInstance } from "@/lib/axios";
import {
  ChangeCustomerStatusRequest,
  CreateCustomerRequest,
  DeleteCustomerRequest,
  DetailCustomerRequest,
  DetailCustomerResponse,
  ListCustomerPagedRequest,
  ListCustomerRequest,
  ListCustomerResponse,
  UpdateCustomerRequest,
} from "@/types-openapi/api";
import { ApiPagedResponse, ApiResponse } from "@/types/api";

export const customerService = {
  async listCustomer(payload: ListCustomerRequest): Promise<ApiResponse<ListCustomerResponse[]>> {
    const res = await axiosInstance.get<ApiResponse<ListCustomerResponse[]>>("/api/customers/list", {
      params: payload,
    });
    return res.data;
  },

  async detailCustomer(payload: DetailCustomerRequest): Promise<ApiResponse<DetailCustomerResponse>> {
    const res = await axiosInstance.get<ApiResponse<DetailCustomerResponse>>("/api/customers/detail", {
      params: payload,
    });
    return res.data;
  },

  async createCustomer(payload: CreateCustomerRequest): Promise<ApiResponse<null>> {
    const res = await axiosInstance.post<ApiResponse<null>>("/api/customers/create", payload);
    return res.data;
  },

  async updateCustomer(payload: UpdateCustomerRequest): Promise<ApiResponse<null>> {
    const res = await axiosInstance.put<ApiResponse<null>>("/api/customers/update", payload);
    return res.data;
  },

  async deleteCustomer(payload: DeleteCustomerRequest): Promise<ApiResponse<null>> {
    const res = await axiosInstance.delete<ApiResponse<null>>("/api/customers/delete", {
      params: payload,
    });
    return res.data;
  },

  async changeCustomerStatus(payload: ChangeCustomerStatusRequest): Promise<ApiResponse<null>> {
    const res = await axiosInstance.put<ApiResponse<null>>("/api/customers/change-status", payload);
    return res.data;
  },

  async listCustomerPaged(payload: ListCustomerPagedRequest): Promise<ApiPagedResponse<ListCustomerResponse>> {
    const res = await axiosInstance.get<ApiPagedResponse<ListCustomerResponse>>("/api/customers/list-paged", {
      params: payload,
    });
    return res.data;
  },
};
