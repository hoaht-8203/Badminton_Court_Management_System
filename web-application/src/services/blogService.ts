import { axiosInstance } from "@/lib/axios";
import {
  CreateBlogRequest,
  DeleteBlogRequest,
  DetailBlogRequest,
  DetailBlogResponse,
  ListBlogRequest,
  ListBlogResponse,
  UpdateBlogRequest,
} from "@/types-openapi/api";
import { ApiResponse } from "@/types/api";

export const blogService = {
  async listBlog(payload: ListBlogRequest): Promise<ApiResponse<ListBlogResponse[]>> {
    const res = await axiosInstance.get<ApiResponse<ListBlogResponse[]>>("/api/blogs/list", {
      params: payload,
    });
    return res.data;
  },

  async detailBlog(payload: DetailBlogRequest): Promise<ApiResponse<DetailBlogResponse>> {
    const res = await axiosInstance.get<ApiResponse<DetailBlogResponse>>("/api/blogs/detail", {
      params: payload,
    });
    return res.data;
  },

  async createBlog(payload: CreateBlogRequest): Promise<ApiResponse<DetailBlogResponse>> {
    const res = await axiosInstance.post<ApiResponse<DetailBlogResponse>>("/api/blogs/create", payload);
    return res.data;
  },

  async updateBlog(payload: UpdateBlogRequest): Promise<ApiResponse<DetailBlogResponse>> {
    const res = await axiosInstance.put<ApiResponse<DetailBlogResponse>>("/api/blogs/update", payload);
    return res.data;
  },

  async deleteBlog(payload: DeleteBlogRequest): Promise<ApiResponse<boolean>> {
    const res = await axiosInstance.delete<ApiResponse<boolean>>("/api/blogs/delete", {
      params: payload,
    });
    return res.data;
  },
};
