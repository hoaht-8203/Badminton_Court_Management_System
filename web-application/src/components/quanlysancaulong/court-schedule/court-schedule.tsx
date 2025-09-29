import { expandBookings, getDayOfWeekToVietnamese } from "@/lib/common";
import { ListCourtGroupByCourtAreaResponse } from "@/types-openapi/api";
import { DayPilot, DayPilotScheduler } from "daypilot-pro-react";
import { useEffect, useRef, useState } from "react";
import PickCalendar from "./pick-calendar";
import { Modal } from "antd";

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

interface CourtSchedulerProps {
  courts: ListCourtGroupByCourtAreaResponse[];
}

const CourtScheduler = ({ courts }: CourtSchedulerProps) => {
  const schedulerRef = useRef<DayPilotScheduler>(null);
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<DayPilot.Date>(DayPilot.Date.today());
  const [events, setEvents] = useState<DayPilot.EventData[]>(expandBookings(bookings));
  const [newBooking, setNewBooking] = useState<{
    start: DayPilot.Date;
    end: DayPilot.Date;
    resource: string;
  } | null>(null);

  useEffect(() => {
    const demoEl = document.querySelector(".scheduler_default_corner > div[style*='background-color']");
    if (demoEl) {
      demoEl.remove();
    }

    if (schedulerRef.current) {
      const scheduler = schedulerRef.current.control;
      scheduler.scrollTo(new DayPilot.Date());
    }
  });

  const handlePickDate = (date: string) => {
    console.log("GO TO HERE");

    setSelectedDate(new DayPilot.Date(date));
  };

  const resources: DayPilot.ResourceData[] = courts.map((courtArea) => ({
    name: courtArea.name ?? "",
    id: courtArea.id,
    expanded: true,
    children:
      courtArea.courts?.map((court) => ({
        name: court.name ?? "",
        id: court.id,
      })) ?? [],
  }));

  const handleCreateBooking = () => {
    console.log("handleCreateBooking", newBooking);
    setEvents([
      ...events,
      {
        start: newBooking?.start ?? "",
        end: newBooking?.end ?? "",
        resource: newBooking?.resource ?? "",
        text: `Sự kiện mới ${newBooking?.start.toString("HH:mm")} - ${newBooking?.end.toString("HH:mm")}`,
        id: DayPilot.guid(),
        status: "Booked",
      },
    ]);
    setOpen(false);
    setNewBooking(null);
  };

  return (
    <div className="flex flex-row gap-4">
      <div>
        <PickCalendar onPickDate={handlePickDate} />
      </div>

      <div className="w-full">
        <DayPilotScheduler
          ref={schedulerRef}
          cellWidthSpec={"Fixed"}
          cellWidth={60}
          timeHeaders={[
            {
              groupBy: "Day",
              format: "dddd, dd/MM/yyyy",
            },
            {
              groupBy: "Hour",
              format: "HH:mm",
            },
          ]}
          separators={[{ color: "red", location: new DayPilot.Date().toString() }]}
          businessBeginsHour={0}
          businessEndsHour={24}
          businessWeekends={true}
          scale={"Hour"}
          timeRangeSelectedHandling="Enabled"
          days={1}
          startDate={selectedDate}
          resources={resources}
          onBeforeCellRender={(args) => {
            if (args.cell.isParent) {
              args.cell.properties.disabled = true;
              args.cell.properties.backColor = "#f0f0f0";
            }
          }}
          onBeforeEventRender={(args) => {
            const eventStart = new DayPilot.Date(args.data.start);
            const eventStatus = args.data.status;

            const now = DayPilot.Date.now();

            if (eventStatus === "Booked") {
              args.data.barColor = "green";
            }

            if (eventStart.getTime() < now.getTime()) {
              args.data.barColor = "#A9A9A9";
            }

            // Tùy chọn khác: Nếu sự kiện đang diễn ra
            // else if (eventEnd.getTime() > now.getTime() && new DayPilot.Date(args.data.start).getTime() < now.getTime()) {
            //     args.data.barColor = "orange"; // Màu cam cho sự kiện đang diễn ra
            // }
          }}
          onBeforeTimeHeaderRender={(args) => {
            if (args.header.level === 0) {
              const date = args.header.start;
              const dayOfWeekText = date.toString("dddd");
              const dayOfWeekTextVietnamese = getDayOfWeekToVietnamese(dayOfWeekText);
              const day = date.getDay();
              const month = date.getMonth() + 1;
              const year = date.getYear();
              args.header.html = `${dayOfWeekTextVietnamese}, ngày ${day} tháng ${month} năm ${year}`;
              args.header.cssClass = "custom-header";
            }
          }}
          onTimeRangeSelected={async (args) => {
            setOpen(true);

            setNewBooking({
              start: args.start,
              end: args.end,
              resource: args.resource.toString(),
            });

            // // Lấy danh sách events hiện tại
            // const existingEvents = scheduler.events.list;
            // // Hàm check overlap
            // const isOverlapping = existingEvents.some((ev) => {
            //   // chỉ check trong cùng resource (cùng sân)
            //   if (ev.resource !== resource) return false;
            //   // DayPilot.Date có compareTo
            //   const evStart = new DayPilot.Date(ev.start);
            //   const evEnd = new DayPilot.Date(ev.end);
            //   // nếu khoảng thời gian giao nhau
            //   return newStart < evEnd && newEnd > evStart;
            // });
            // if (isOverlapping) {
            //   DayPilot.Modal.alert("Thời gian này đã có sự kiện, vui lòng chọn slot khác.");
            //   scheduler.clearSelection();
            //   return;
            // }
            // const modal = await DayPilot.Modal.prompt("Tạo sự kiện mới:", "Sự kiện 1");
            // scheduler.clearSelection();
            // if (modal.canceled) {
            //   return;
            // }
            // // check if the start and end event is existed
            // scheduler.events.add({
            //   start: args.start,
            //   end: args.end,
            //   id: DayPilot.guid(),
            //   resource: args.resource,
            //   text: modal.result,
            // });
          }}
          eventMoveHandling="Update"
          onEventMove={async (args) => {
            console.log("onEventMove", args);
          }}
          eventResizeHandling="Update"
          onEventResize={async (args) => {
            console.log("onEventResize", args);
          }}
          onEventClick={async (args) => {
            console.log("onEventClick", args);
          }}
          treeEnabled={true}
          events={events}
          rowMinHeight={50}
          eventHeight={75}
          allowEventOverlap={false}
        />
      </div>

      <Modal
        title="Thêm mới lịch đặt sân cầu lông"
        maskClosable={false}
        centered
        open={open}
        onOk={handleCreateBooking}
        onCancel={() => setOpen(false)}
        okText="Đặt sân"
        cancelText="Bỏ qua"
        width={1000}
      >
        Khoản thời gian {newBooking?.start.toString("HH:mm")} - {newBooking?.end.toString("HH:mm")} trên sân {newBooking?.resource}
      </Modal>
    </div>
  );
};

export default CourtScheduler;
