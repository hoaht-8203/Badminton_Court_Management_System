import { axiosInstance } from "@/lib/axios";
import {
  CreateCategoryRequest,
  DeleteCategoryRequest,
  DetailCategoryRequest,
  DetailCategoryResponse,
  ListCategoryRequest,
  ListCategoryResponse,
  UpdateCategoryRequest,
} from "@/types-openapi/api";
import { ApiResponse } from "@/types/api";

export const categoryService = {
  async list(params: ListCategoryRequest): Promise<ApiResponse<ListCategoryResponse[]>> {
    const res = await axiosInstance.get<ApiResponse<ListCategoryResponse[]>>("/api/Categories/list", { params });
    return res.data;
  },

  async detail(params: DetailCategoryRequest): Promise<ApiResponse<DetailCategoryResponse>> {
    const res = await axiosInstance.get<ApiResponse<DetailCategoryResponse>>("/api/Categories/detail", { params });
    return res.data;
  },

  async create(payload: CreateCategoryRequest): Promise<ApiResponse<null>> {
    const res = await axiosInstance.post<ApiResponse<null>>("/api/Categories/create", payload);
    return res.data;
  },

  async update(payload: UpdateCategoryRequest): Promise<ApiResponse<null>> {
    const res = await axiosInstance.put<ApiResponse<null>>("/api/Categories/update", payload);
    return res.data;
  },

  async delete(payload: DeleteCategoryRequest): Promise<ApiResponse<null>> {
    const res = await axiosInstance.delete<ApiResponse<null>>("/api/Categories/delete", { params: payload });
    return res.data;
  },
};


