import { DayPilot, DayPilotScheduler } from "daypilot-pro-react";
import { useEffect, useState } from "react";
import PickCalendar from "./pick-calendar";
import dayjs from "dayjs";

function expandBookings(bookings: any[]) {
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

const bookings = [
  {
    id: 1,
    cusId: "Cus1",
    courtId: "R1",
    startTime: "07:00:00",
    endTime: "10:00:00",
    startDate: "2025-09-01",
    endDate: "2025-09-30",
    dayOfWeek: [3, 5, 7], // thứ 3, 5, 7 - lịch cố định
  },
  {
    id: 2,
    cusId: "Cus2",
    courtId: "R1",
    startTime: "10:00:00",
    endTime: "14:00:00",
    startDate: "2025-09-01",
    endDate: "2025-09-15",
    dayOfWeek: [2], // thứ 2 - lịch cố định
  },
  {
    id: 3,
    cusId: "Cus3",
    courtId: "R2",
    startTime: "15:00:00",
    endTime: "17:00:00",
    startDate: "2025-09-10",
    endDate: "2025-09-10",
    // Không có dayOfWeek - lịch vãng lai
  },
  {
    id: 4,
    cusId: "Cus4",
    courtId: "R2",
    startTime: "18:00:00",
    endTime: "20:00:00",
    startDate: "2025-09-15",
    endDate: "2025-09-15",
    dayOfWeek: [], // dayOfWeek rỗng - lịch vãng lai
  },
];

const trueData = [
  {
    id: 1,
    resource: "R1",
    start: "2025-09-23T05:00:00",
    end: "2025-09-23T09:00:00",
    text: "Event 1",
  },
  {
    id: 2,
    resource: "R1",
    start: "2025-09-30T05:00:00",
    end: "2025-09-30T09:00:00",
    text: "Event 1",
  },
];

const CourtScheduler = () => {
  const [selectedDate, setSelectedDate] = useState<DayPilot.Date>(DayPilot.Date.today());
  const [events, setEvents] = useState<DayPilot.EventData[]>(expandBookings(bookings));
  useEffect(() => {
    const demoEl = document.querySelector(".scheduler_default_corner > div[style*='background-color']");
    if (demoEl) {
      demoEl.remove(); // Xoá hẳn cái div chứa chữ DEMO
    }
  });

  const handlePickDate = (date: string) => {
    console.log("GO TO HERE");

    setSelectedDate(new DayPilot.Date(date));
  };

  return (
    <div className="flex flex-row gap-4">
      <div>
        <PickCalendar onPickDate={handlePickDate} />
      </div>

      <div className="w-full">
        <DayPilotScheduler
          cellWidthSpec={"Fixed"}
          cellWidth={60}
          timeHeaders={[
            {
              groupBy: "Day",
            },
            {
              groupBy: "Hour",
            },
          ]}
          businessBeginsHour={0}
          businessEndsHour={24}
          scale={"Hour"}
          timeRangeSelectedHandling="Enabled"
          days={1}
          startDate={selectedDate}
          resources={[
            {
              name: "Group 1",
              id: "G1",
              expanded: true,
              children: [
                {
                  name: "Resource 1",
                  id: "R1",
                },
                {
                  name: "Resource 2",
                  id: "R2",
                },
              ],
            },
            {
              name: "Group 2",
              id: "G2",
              expanded: true,
              children: [
                {
                  name: "Resource 3",
                  id: "R3",
                },
                {
                  name: "Resource 4",
                  id: "R4",
                },
              ],
            },
          ]}
          onBeforeCellRender={(args) => {
            if (args.cell.isParent) {
              args.cell.properties.disabled = true;
              args.cell.properties.backColor = "#f0f0f0";
            }
          }}
          onTimeRangeSelected={async (args) => {
            const scheduler = args.control;

            // Lấy start, end của event mới
            const newStart = args.start;
            const newEnd = args.end;
            const resource = args.resource;

            // Lấy danh sách events hiện tại
            const existingEvents = scheduler.events.list;

            // Hàm check overlap
            const isOverlapping = existingEvents.some((ev) => {
              // chỉ check trong cùng resource (cùng sân)
              if (ev.resource !== resource) return false;

              // DayPilot.Date có compareTo
              const evStart = new DayPilot.Date(ev.start);
              const evEnd = new DayPilot.Date(ev.end);

              // nếu khoảng thời gian giao nhau
              return newStart < evEnd && newEnd > evStart;
            });

            if (isOverlapping) {
              DayPilot.Modal.alert("Thời gian này đã có sự kiện, vui lòng chọn slot khác.");
              scheduler.clearSelection();
              return;
            }

            const modal = await DayPilot.Modal.prompt("Tạo sự kiện mới:", "Sự kiện 1");
            scheduler.clearSelection();
            if (modal.canceled) {
              return;
            }
            // check if the start and end event is existed

            scheduler.events.add({
              start: args.start,
              end: args.end,
              id: DayPilot.guid(),
              resource: args.resource,
              text: modal.result,
            });
          }}
          eventMoveHandling="Update"
          onEventMove={async (args) => {
            console.log("onEventMove", args);
          }}
          eventResizeHandling="Update"
          onEventResize={async (args) => {
            console.log("onEventResize", args);
          }}
          eventDeleteHandling="Update"
          onEventDeleted={async (args) => {
            console.log("onEventDeleted", args);
          }}
          onEventClick={async (args) => {
            console.log("onEventClick", args);
          }}
          treeEnabled={true}
          events={events}
        />
      </div>
    </div>
  );
};

export default CourtScheduler;
