import { Holiday, systemConfigService } from "@/services/systemConfigService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * Hook lấy SystemConfig theo key
 */
export function useGetSystemConfig(key: string) {
  return useQuery({
    queryKey: ["systemConfig", key],
    queryFn: async () => {
      const response = await systemConfigService.getByKey(key);
      return response.data;
    },
    enabled: !!key,
  });
}

/**
 * Hook cập nhật SystemConfig value
 */
export function useUpdateSystemConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      return systemConfigService.updateValue(key, value);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["systemConfig", variables.key] });
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
    },
  });
}

/**
 * Hook lấy danh sách ngày nghỉ lễ
 */
export function useGetHolidays() {
  return useQuery({
    queryKey: ["holidays"],
    queryFn: async () => {
      const response = await systemConfigService.getHolidays();
      return response.data || [];
    },
  });
}

/**
 * Hook cập nhật danh sách ngày nghỉ lễ
 */
export function useUpdateHolidays() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (holidays: Holiday[]) => {
      return systemConfigService.updateHolidays(holidays);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
      queryClient.invalidateQueries({ queryKey: ["systemConfig", "Holidays"] });
    },
  });
}
