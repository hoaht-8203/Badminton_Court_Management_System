import { axiosInstance } from "@/lib/axios";
import { SystemConfigRequest, SystemConfigResponse } from "@/types-openapi/api";
import { ApiResponse } from "@/types/api";

const HOLIDAY_CONFIG_KEY = "Holidays";

// Interface cho Holiday item trong JSON
export interface Holiday {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isSpecialDay: boolean; // true = special day (hệ số cao hơn), false = holiday thông thường
  note?: string;
}

export const systemConfigService = {
  /**
   * Lấy SystemConfig theo key
   */
  async getByKey(key: string): Promise<ApiResponse<SystemConfigResponse>> {
    const res = await axiosInstance.get<ApiResponse<SystemConfigResponse>>(`/api/SystemConfig/${key}`);
    return res.data;
  },

  /**
   * Lấy SystemConfig theo group
   */
  async getByGroup(group: string): Promise<ApiResponse<SystemConfigResponse[]>> {
    const res = await axiosInstance.get<ApiResponse<SystemConfigResponse[]>>(`/api/SystemConfig/group/${group}`);
    return res.data;
  },

  /**
   * Cập nhật SystemConfig value
   */
  async updateValue(key: string, value: string): Promise<ApiResponse<boolean>> {
    const payload: SystemConfigRequest = {
      key,
      value,
    };
    const res = await axiosInstance.put<ApiResponse<boolean>>(`/api/SystemConfig/${key}`, payload);
    return res.data;
  },

  /**
   * Lấy danh sách ngày nghỉ lễ
   */
  async getHolidays(): Promise<ApiResponse<Holiday[]>> {
    const res = await this.getByKey(HOLIDAY_CONFIG_KEY);
    if (res.success && res.data?.value) {
      const holidays: Holiday[] = JSON.parse(res.data.value);
      return {
        success: true,
        message: "Lấy danh sách ngày nghỉ lễ thành công",
        data: holidays,
      };
    }
    return {
      success: false,
      message: res.message || "Không thể lấy danh sách ngày nghỉ lễ",
      data: null,
    };
  },

  /**
   * Cập nhật danh sách ngày nghỉ lễ
   */
  async updateHolidays(holidays: Holiday[]): Promise<ApiResponse<boolean>> {
    return this.updateValue(HOLIDAY_CONFIG_KEY, JSON.stringify(holidays));
  },
};
