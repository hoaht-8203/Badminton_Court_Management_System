import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { blogService } from "@/services/blogService";
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
import { ApiError } from "@/lib/axios";

// Query Keys
export const blogsKeys = {
  all: ["blogs"] as const,
  lists: () => [...blogsKeys.all, "list"] as const,
  list: (params: ListBlogRequest) => [...blogsKeys.lists(), params] as const,
  details: () => [...blogsKeys.all, "detail"] as const,
  detail: (params: DetailBlogRequest) => [...blogsKeys.details(), params] as const,
};

// List Blogs Query
export const useListBlogs = (params: ListBlogRequest) => {
  return useQuery<ApiResponse<ListBlogResponse[]>, ApiError>({
    queryKey: blogsKeys.list(params),
    queryFn: () => blogService.listBlog(params),
    enabled: true,
  });
};

// Detail Blog Query
export const useDetailBlog = (params: DetailBlogRequest) => {
  return useQuery<ApiResponse<DetailBlogResponse>, ApiError>({
    queryKey: blogsKeys.detail(params),
    queryFn: () => blogService.detailBlog(params),
    enabled: !!params.id,
  });
};

// Create Blog Mutation
export const useCreateBlog = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<DetailBlogResponse>, ApiError, CreateBlogRequest>({
    mutationFn: (data: CreateBlogRequest) => blogService.createBlog(data),
    onSuccess: () => {
      // Invalidate and refetch blog lists
      queryClient.invalidateQueries({ queryKey: blogsKeys.lists() });
    },
  });
};

// Update Blog Mutation
export const useUpdateBlog = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<DetailBlogResponse>, ApiError, UpdateBlogRequest>({
    mutationFn: (data: UpdateBlogRequest) => blogService.updateBlog(data),
    onSuccess: (_, variables) => {
      // Invalidate and refetch blog lists
      queryClient.invalidateQueries({ queryKey: blogsKeys.lists() });
      // Invalidate specific blog detail if we have id
      if (variables.id) {
        queryClient.invalidateQueries({
          queryKey: blogsKeys.detail({ id: variables.id }),
        });
      }
    },
  });
};

// Delete Blog Mutation
export const useDeleteBlog = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<boolean>, ApiError, DeleteBlogRequest>({
    mutationFn: (data: DeleteBlogRequest) => blogService.deleteBlog(data),
    onSuccess: () => {
      // Invalidate and refetch blog lists
      queryClient.invalidateQueries({ queryKey: blogsKeys.lists() });
    },
  });
};
