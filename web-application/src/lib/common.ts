import { ListBookingCourtOccurrenceResponse, ListBookingCourtResponse } from "@/types-openapi/api";
import { DayPilot } from "daypilot-pro-react";

interface BookingCourtEvent extends DayPilot.EventData, Omit<ListBookingCourtResponse, "id"> {}

export function convertOccurrencesToEvents(occurrences: ListBookingCourtOccurrenceResponse[]) {
  const events: BookingCourtEvent[] = [];

  occurrences.forEach((occurrence) => {
    events.push({
      id: occurrence.id?.toString() ?? "",
      text: occurrence.customerName ?? "",
      start: occurrence.startDate + "T" + occurrence.startTime,
      end: occurrence.endDate + "T" + occurrence.endTime,
      resource: occurrence.courtId,
      status: occurrence.status,
      customerName: occurrence.customerName,
      courtName: occurrence.courtName,
      courtId: occurrence.courtId,
      customerId: occurrence.customerId,
      bookingCourtId: occurrence.bookingCourtId,
      note: occurrence.note,
    });
  });

  return events;
}

export function getDayOfWeekToVietnamese(dayOfWeek: string) {
  if (!dayOfWeek) {
    return "";
  }

  switch (dayOfWeek) {
    case "Sunday":
      return "Chủ Nhật";
    case "Monday":
      return "Thứ Hai";
    case "Tuesday":
      return "Thứ Ba";
    case "Wednesday":
      return "Thứ Tư";
    case "Thursday":
      return "Thứ Năm";
    case "Friday":
      return "Thứ Sáu";
    case "Saturday":
      return "Thứ Bảy";
    default:
      break;
  }

  return dayOfWeek;
}

export const toTimeString = (d: Date) => d.toTimeString().split(" ")[0];
