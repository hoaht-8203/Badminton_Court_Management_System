import { axiosInstance } from "@/lib/axios";
import {
  CreatePriceTableRequest,
  DeletePriceTableRequest,
  DetailPriceTableRequest,
  DetailPriceTableResponse,
  ListPriceTableRequest,
  ListPriceTableResponse,
  SetPriceTableProductsRequest,
  UpdatePriceTableRequest,
  ListPriceTableProductsResponse,
} from "@/types-openapi/api";
import { ApiResponse } from "@/types/api";

export const pricesService = {
  async list(payload: ListPriceTableRequest): Promise<ApiResponse<ListPriceTableResponse[]>> {
    const res = await axiosInstance.get<ApiResponse<ListPriceTableResponse[]>>("/api/Prices/list", { params: payload });
    return res.data;
  },
  async detail(payload: DetailPriceTableRequest): Promise<ApiResponse<DetailPriceTableResponse>> {
    const res = await axiosInstance.get<ApiResponse<DetailPriceTableResponse>>("/api/Prices/detail", { params: payload });
    return res.data;
  },
  async create(payload: CreatePriceTableRequest): Promise<ApiResponse<null>> {
    const res = await axiosInstance.post<ApiResponse<null>>("/api/Prices/create", payload);
    return res.data;
  },
  async update(payload: UpdatePriceTableRequest): Promise<ApiResponse<null>> {
    const res = await axiosInstance.put<ApiResponse<null>>("/api/Prices/update", payload);
    return res.data;
  },
  async delete(payload: DeletePriceTableRequest): Promise<ApiResponse<null>> {
    const res = await axiosInstance.delete<ApiResponse<null>>("/api/Prices/delete", { params: payload });
    return res.data;
  },
  async setProducts(payload: SetPriceTableProductsRequest): Promise<ApiResponse<null>> {
    const res = await axiosInstance.post<ApiResponse<null>>("/api/Prices/set-products", payload);
    return res.data;
  },
  async getProducts(priceTableId: number): Promise<ApiResponse<ListPriceTableProductsResponse>> {
    const res = await axiosInstance.get<ApiResponse<ListPriceTableProductsResponse>>("/api/Prices/get-products", { params: { priceTableId } });
    return res.data;
  },
};
