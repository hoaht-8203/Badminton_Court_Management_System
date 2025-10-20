import { apiBaseUrl } from "@/lib/axios";
import { ListBookingCourtOccurrenceRequest, ListBookingCourtOccurrenceResponse } from "@/types-openapi/api";
import { useQuery } from "@tanstack/react-query";

export const bookingCourtOccurrenceKeys = {
  lists: () => ["bookingCourtOccurrences", "list"] as const,
  list: (params: ListBookingCourtOccurrenceRequest) => ["bookingCourtOccurrences", "list", params] as const,
  details: () => ["bookingCourtOccurrences", "detail"] as const,
  detail: (id: string) => ["bookingCourtOccurrences", "detail", id] as const,
};

export function useListBookingCourtOccurrences(params: ListBookingCourtOccurrenceRequest) {
  return useQuery({
    queryKey: bookingCourtOccurrenceKeys.list(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params.customerId) searchParams.append("customerId", params.customerId.toString());
      if (params.courtId) searchParams.append("courtId", params.courtId);
      if (params.fromDate) searchParams.append("fromDate", params.fromDate.toISOString());
      if (params.toDate) searchParams.append("toDate", params.toDate.toISOString());
      if (params.status) searchParams.append("status", params.status);

      const response = await fetch(`${apiBaseUrl}/api/BookingCourts/occurrences?${searchParams}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch booking court occurrences");
      return response.json() as Promise<{ data: ListBookingCourtOccurrenceResponse[] }>;
    },
  });
}
