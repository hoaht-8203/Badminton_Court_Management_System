import { axiosInstance } from "@/lib/axios";
import {
  CreateProductRequest,
  DeleteProductRequest,
  DetailProductRequest,
  DetailProductResponse,
  ListProductRequest,
  ListProductResponse,
  ListProductsByPriceTableRequest,
  ListProductsByPriceTableResponse,
  UpdateProductRequest,
} from "@/types-openapi/api";
import { ApiResponse } from "@/types/api";

export const productService = {
  async list(payload: ListProductRequest): Promise<ApiResponse<ListProductResponse[]>> {
    const res = await axiosInstance.get<ApiResponse<ListProductResponse[]>>("/api/Products/list", { params: payload });
    return res.data;
  },

  async detail(payload: DetailProductRequest): Promise<ApiResponse<DetailProductResponse>> {
    const res = await axiosInstance.get<ApiResponse<DetailProductResponse>>("/api/Products/detail", { params: payload });
    return res.data;
  },

  async create(payload: CreateProductRequest): Promise<ApiResponse<null>> {
    const res = await axiosInstance.post<ApiResponse<null>>("/api/Products/create", payload);
    return res.data;
  },

  async update(payload: UpdateProductRequest): Promise<ApiResponse<null>> {
    const res = await axiosInstance.put<ApiResponse<null>>("/api/Products/update", payload);
    return res.data;
  },

  async updateStatus(id: number, isActive: boolean): Promise<ApiResponse<null>> {
    const res = await axiosInstance.put<ApiResponse<null>>("/api/Products/update-status", undefined, { params: { id, isActive } });
    return res.data;
  },

  async delete(payload: DeleteProductRequest): Promise<ApiResponse<null>> {
    const res = await axiosInstance.delete<ApiResponse<null>>("/api/Products/delete", { params: payload });
    return res.data;
  },

  async updateImages(id: number, files: File[]): Promise<ApiResponse<null>> {
    const form = new FormData();
    form.append("id", String(id));
    files.forEach((f) => form.append("files", f));
    const res = await axiosInstance.post<ApiResponse<null>>("/api/Products/update-images", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  async listByPriceTable(payload: ListProductsByPriceTableRequest): Promise<ApiResponse<ListProductsByPriceTableResponse[]>> {
    const res = await axiosInstance.get<ApiResponse<ListProductsByPriceTableResponse[]>>("/api/Products/list-by-price-table", { params: payload });
    return res.data;
  },
};
