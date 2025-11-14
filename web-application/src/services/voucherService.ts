import { axiosInstance } from "@/lib/axios";
import {
  CreateVoucherRequest,
  DeleteVoucherRequest,
  DetailVoucherRequest,
  UpdateVoucherRequest,
  VoucherResponse,
  ValidateVoucherRequest,
  ValidateVoucherResponseApiResponse,
  ValidateVoucherResponse,
} from "@/types-openapi/api";
import { ApiResponse } from "@/types/api";

export const voucherService = {
  async list(): Promise<ApiResponse<VoucherResponse[]>> {
    const res = await axiosInstance.get<ApiResponse<VoucherResponse[]>>("/api/vouchers/list");
    return res.data;
  },

  async detail(payload: DetailVoucherRequest): Promise<ApiResponse<VoucherResponse | null>> {
    const res = await axiosInstance.get<ApiResponse<VoucherResponse | null>>("/api/vouchers/detail", {
      params: payload,
    });
    return res.data;
  },

  async create(payload: CreateVoucherRequest): Promise<ApiResponse<null>> {
    const res = await axiosInstance.post<ApiResponse<null>>("/api/vouchers/create", payload);
    return res.data;
  },

  async update(id: number, payload: UpdateVoucherRequest): Promise<ApiResponse<null>> {
    const res = await axiosInstance.put<ApiResponse<null>>(`/api/vouchers/update/${id}`, payload);
    return res.data;
  },
  
  // Extend: call dedicated extend endpoint to patch only time/usage-related fields
  async extend(id: number, payload: Partial<import("@/types-openapi/api").ExtendVoucherRequest>): Promise<ApiResponse<null>> {
    const res = await axiosInstance.post<ApiResponse<null>>(`/api/vouchers/extend/${id}`, payload);
    return res.data;
  },

  async delete(payload: DeleteVoucherRequest): Promise<ApiResponse<null>> {
    const res = await axiosInstance.delete<ApiResponse<null>>("/api/vouchers/delete", {
      params: payload,
    });
    return res.data;
  },

  async getAvailable(): Promise<ApiResponse<VoucherResponse[]>> {
    const res = await axiosInstance.get<ApiResponse<VoucherResponse[]>>("/api/vouchers/available");
    return res.data;
  },

  /**
   * Validate a voucher against a booking context (date/time).
   * Expected backend endpoint: POST /api/Vouchers/validate
   */
  async validate(payload: ValidateVoucherRequest): Promise<ApiResponse<ValidateVoucherResponse | null>> {
    const res = await axiosInstance.post<ApiResponse<ValidateVoucherResponseApiResponse>>("/api/Vouchers/validate", payload);
    // The generated API wraps the ValidateVoucherResponse in a ApiResponse-like wrapper (ValidateVoucherResponseApiResponse).
    // Normalize to our ApiResponse<T> shape for consistency with other service methods.
    const apiData = res.data;
    // The backend returns ApiResponse where `data` is the ValidateVoucherResponse object.
    // Earlier code expected an extra nesting (data.data) — normalize correctly to ApiResponse<T>.
    return {
      success: apiData.success,
      message: apiData.message,
      data: apiData.data ?? null,
      errors: apiData.errors ?? null,
    } as ApiResponse<ValidateVoucherResponse | null>;
  },
};
