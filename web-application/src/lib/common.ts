import dayjs from "dayjs";

export function expandBookings(bookings: any[]) {
  const events: any[] = [];

  bookings.forEach((b) => {
    // Kiểm tra xem có phải lịch cố định (recurring) hay lịch vãng lai (one-time)
    const isRecurring = b.dayOfWeek && Array.isArray(b.dayOfWeek) && b.dayOfWeek.length > 0;

    if (isRecurring) {
      // Xử lý lịch cố định (recurring bookings)
      let current = dayjs(b.startDate);
      const endDate = dayjs(b.endDate);

      while (current.isBefore(endDate) || current.isSame(endDate, "day")) {
        // dayjs: Sunday=0, Monday=1, Tuesday=2, Wednesday=3, Thursday=4, Friday=5, Saturday=6
        // DB: Monday=2, Tuesday=3, Wednesday=4, Thursday=5, Friday=6, Saturday=7, Sunday=8
        const dayjsDow = current.day();
        const dbDow = dayjsDow === 0 ? 8 : dayjsDow + 1; // Sunday=0 -> 8, others +1

        if (b.dayOfWeek.includes(dbDow)) {
          events.push({
            id: b.id + "-" + current.format("YYYYMMDD"),
            text: b.cusId,
            start: current.format("YYYY-MM-DD") + "T" + b.startTime,
            end: current.format("YYYY-MM-DD") + "T" + b.endTime,
            resource: b.courtId,
          });
        }

        current = current.add(1, "day");
      }
    } else {
      // Xử lý lịch vãng lai (one-time bookings)
      // Chỉ tạo 1 event cho ngày cụ thể
      events.push({
        id: b.id.toString(),
        text: b.cusId,
        start: b.startDate + "T" + b.startTime,
        end: b.endDate + "T" + b.endTime,
        resource: b.courtId,
      });
    }
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
