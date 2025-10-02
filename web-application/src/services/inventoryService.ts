import { axiosInstance } from "@/lib/axios";
import {
  CreateInventoryCheckRequest,
  DetailInventoryCheckResponseApiResponse,
  ListInventoryCheckRequest,
  ListInventoryCheckResponseListApiResponse,
} from "@/types-openapi/api";

export const inventoryService = {
  list(params: Partial<ListInventoryCheckRequest>) {
    return axiosInstance
      .get<ListInventoryCheckResponseListApiResponse>("/api/InventoryChecks/list", { params })
      .then((r) => r.data);
  },
  detail(id: number) {
    return axiosInstance
      .get<DetailInventoryCheckResponseApiResponse>(`/api/InventoryChecks/${id}`)
      .then((r) => r.data);
  },
  create(payload: CreateInventoryCheckRequest) {
    return axiosInstance
      .post("/api/InventoryChecks", payload)
      .then((r) => r.data);
  },
  update(id: number, payload: CreateInventoryCheckRequest) {
    return axiosInstance
      .put(`/api/InventoryChecks/${id}`, payload)
      .then((r) => r.data);
  },
  cancel(id: number) {
    return axiosInstance
      .put(`/api/InventoryChecks/${id}/cancel`)
      .then((r) => r.data);
  },
  bulkCancel(ids: number[]) {
    return axiosInstance
      .post(`/api/InventoryChecks/bulk-cancel`, ids)
      .then((r) => r.data);
  },
  checkLowStock(branch?: string) {
    return axiosInstance
      .post<number>(`/api/Products/check-low-stock`, undefined, { params: { branch } })
      .then((r) => r.data);
  },
}; 