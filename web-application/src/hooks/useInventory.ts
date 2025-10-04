import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import { CreateInventoryCheckRequest } from "@/types-openapi/api";
import { inventoryService } from "@/services/inventoryService";

// List inventory checks
export const useListInventoryChecks = (params: any) => {
  return useQuery({
    queryKey: ["inventoryChecks", params],
    queryFn: () => inventoryService.list(params),
    staleTime: 50000, // 30 seconds
  });
};

// Get inventory check details
export const useDetailInventoryCheck = (id: number | undefined, enabled = true) => {
  return useQuery({
    queryKey: ["inventoryCheck", id],
    queryFn: () => inventoryService.detail(id!),
    enabled: enabled && !!id,
  });
};

// Create inventory check
export const useCreateInventoryCheck = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInventoryCheckRequest) => inventoryService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventoryChecks"] });
      // Removed duplicate message - handled in component
    },
    onError: (error: any) => {
      message.error(error?.message || "Có lỗi xảy ra khi tạo phiếu kiểm kê");
    },
  });
};

export const useUpdateInventoryCheck = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateInventoryCheckRequest }) => 
      inventoryService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventoryChecks"] });
      queryClient.invalidateQueries({ queryKey: ["inventoryCheck"] });
      // Removed duplicate message - handled in component
    },
    onError: (error: any) => {
      message.error(error?.message || "Có lỗi xảy ra khi cập nhật phiếu kiểm kê");
    },
  });
};

export const useDeleteInventoryCheck = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => inventoryService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventoryChecks"] });
      message.success("Hủy phiếu kiểm kê thành công!");
    },
    onError: (error: any) => {
      message.error(error?.message || "Có lỗi xảy ra khi hủy phiếu kiểm kê");
    },
  });
};

export const useCompleteInventoryCheck = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => inventoryService.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventoryChecks"] });
      queryClient.invalidateQueries({ queryKey: ["inventoryCheck"] });
      queryClient.invalidateQueries({ queryKey: ["products"] }); // Invalidate products to refresh stock
      // Removed duplicate message - handled in component
    },
    onError: (error: any) => {
      message.error(error?.message || "Có lỗi xảy ra khi hoàn thành phiếu kiểm kê");
    },
  });
};

export const useBulkDeleteInventoryChecks = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: number[]) => inventoryService.bulkCancel(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventoryChecks"] });
      message.success("Hủy các phiếu kiểm kê thành công!");
    },
    onError: (error: any) => {
      message.error(error?.message || "Có lỗi xảy ra khi hủy các phiếu kiểm kê");
    },
  });
};

// Check low stock products
export const useCheckLowStockProducts = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (branch?: string) => inventoryService.checkLowStock(branch),
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["inventoryChecks"] });
      if (count && count > 0) {
        message.success(`Đã tạo ${count} phiếu kiểm kê cho sản phẩm có tồn kho thấp!`);
      } else {
        message.info("Không có sản phẩm nào có tồn kho dưới mức tối thiểu.");
      }
    },
    onError: (error: any) => {
      message.error(error?.message || "Có lỗi xảy ra khi kiểm tra tồn kho thấp");
    }
  });
};