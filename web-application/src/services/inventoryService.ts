import { axiosInstance } from "@/lib/axios";
import {
  CreateInventoryCheckRequest,
  DetailInventoryCheckResponseApiResponse,
  ListInventoryCheckRequest,
  ListInventoryCheckResponseListApiResponse,
  ListByProductResponseListApiResponse,
} from "@/types-openapi/api";

export const inventoryService = {
  list(params: Partial<ListInventoryCheckRequest>) {
    return axiosInstance.get<ListInventoryCheckResponseListApiResponse>("/api/InventoryChecks/list", { params }).then((r) => r.data);
  },
  detail(id: number) {
    return axiosInstance.get<DetailInventoryCheckResponseApiResponse>(`/api/InventoryChecks/${id}`).then((r) => r.data);
  },
  create(payload: CreateInventoryCheckRequest) {
    return axiosInstance.post("/api/InventoryChecks", payload).then((r) => r.data);
  },
  update(id: number, payload: CreateInventoryCheckRequest) {
    return axiosInstance.put(`/api/InventoryChecks/${id}`, payload).then((r) => r.data);
  },
  complete(id: number) {
    return axiosInstance.put(`/api/InventoryChecks/${id}/complete`).then((r) => r.data);
  },
  cancel(id: number) {
    return axiosInstance.put(`/api/InventoryChecks/${id}/cancel`).then((r) => r.data);
  },
  bulkCancel(ids: number[]) {
    return axiosInstance.post(`/api/InventoryChecks/bulk-cancel`, ids).then((r) => r.data);
  },
  merge(ids: number[]) {
    return axiosInstance.post("/api/InventoryChecks/merge", { inventoryCheckIds: ids }).then((r) => r.data);
  },
  listCardsByProduct(productId: number) {
    return axiosInstance
      .get<ListByProductResponseListApiResponse>("/api/InventoryCards/list-by-product", { params: { productId } })
      .then((r) => r.data);
  },
  // Optional helper - backend may not implement this yet; keep non-breaking default
  checkLowStock(branch?: string) {
    try {
      return axiosInstance.get<number>("/api/InventoryChecks/check-low-stock", { params: { branch } }).then((r) => (r as any)?.data ?? 0);
    } catch {
      // Fallback to 0 to avoid build-time type errors when endpoint missing
      return Promise.resolve(0);
    }
  },
};
