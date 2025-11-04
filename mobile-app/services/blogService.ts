import { axiosInstance, ApiResponse } from "../lib/axios";

export type ListBlogRequest = {
  title?: string | null;
  status?: string | null;
};

export type ListBlogResponse = {
  id?: string;
  title?: string | null;
  content?: string | null;
  imageUrl?: string | null;
  status?: string | null;
  createdAt?: Date;
  updatedAt?: Date | null;
  createdBy?: string | null;
  updatedBy?: string | null;
};

export type DetailBlogRequest = {
  id: string;
};

export type DetailBlogResponse = {
  id?: string;
  title?: string | null;
  content?: string | null;
  imageUrl?: string | null;
  status?: string | null;
  createdAt?: Date;
  updatedAt?: Date | null;
  createdBy?: string | null;
  updatedBy?: string | null;
};

export const blogService = {
  async listBlog(
    payload: ListBlogRequest
  ): Promise<ApiResponse<ListBlogResponse[]>> {
    const res = await axiosInstance.get<ApiResponse<ListBlogResponse[]>>(
      "/api/blogs/list",
      {
        params: payload,
      }
    );
    return res.data;
  },

  async detailBlog(
    payload: DetailBlogRequest
  ): Promise<ApiResponse<DetailBlogResponse>> {
    const res = await axiosInstance.get<ApiResponse<DetailBlogResponse>>(
      "/api/blogs/detail",
      {
        params: payload,
      }
    );
    return res.data;
  },
};
