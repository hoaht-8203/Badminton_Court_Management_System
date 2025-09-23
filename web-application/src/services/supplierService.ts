import { axiosInstance } from "@/lib/axios";
import {
  CreateSupplierRequest,
  DeleteSupplierRequest,
  DetailSupplierRequest,
  DetailSupplierResponse,
  ListSupplierResponse,
  ListSupplierRequest,
  UpdateSupplierRequest,
  ChangeSupplierStatusRequest,
} from "@/types-openapi/api";
import { ApiResponse } from "@/types/api";

export const supplierService = {
  async listSupplier(payload: ListSupplierRequest): Promise<ApiResponse<ListSupplierResponse[]>> {
    const res = await axiosInstance.get<ApiResponse<ListSupplierResponse[]>>("/api/suppliers/list", {
      params: payload,
    });
    return res.data;
  },

  async detailSupplier(payload: DetailSupplierRequest): Promise<ApiResponse<DetailSupplierResponse>> {
    const res = await axiosInstance.get<ApiResponse<DetailSupplierResponse>>("/api/suppliers/detail", {
      params: payload,
    });
    return res.data;
  },

  async createSupplier(payload: CreateSupplierRequest): Promise<ApiResponse<null>> {
    const res = await axiosInstance.post<ApiResponse<null>>("/api/suppliers/create", payload);
    return res.data;
  },

  async updateSupplier(payload: UpdateSupplierRequest): Promise<ApiResponse<null>> {
    const res = await axiosInstance.put<ApiResponse<null>>("/api/suppliers/update", payload);
    return res.data;
  },

  async deleteSupplier(payload: DeleteSupplierRequest): Promise<ApiResponse<null>> {
    const res = await axiosInstance.delete<ApiResponse<null>>("/api/suppliers/delete", {
      params: payload,
    });
    return res.data;
  },

  async changeSupplierStatus(payload: ChangeSupplierStatusRequest): Promise<ApiResponse<null>> {
    const res = await axiosInstance.put<ApiResponse<null>>("/api/suppliers/change-status", payload);
    return res.data;
  },
};
