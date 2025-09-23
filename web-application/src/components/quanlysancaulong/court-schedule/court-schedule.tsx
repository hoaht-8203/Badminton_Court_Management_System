import { DayPilot, DayPilotScheduler } from "daypilot-pro-react";
import { useEffect, useState } from "react";
import PickCalendar from "./pick-calendar";

const CourtScheduler = () => {
  const [selectedDate, setSelectedDate] = useState<DayPilot.Date>(DayPilot.Date.today());
  const [events, setEvents] = useState<DayPilot.EventData[]>([
    {
      id: 1,
      resource: "R1",
      start: "2025-09-23T05:00:00",
      end: "2025-09-23T09:00:00",
      text: "Event 1",
    },
  ]);
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
            const modal = await DayPilot.Modal.prompt("Create a new event:", "Event 1");
            scheduler.clearSelection();
            if (modal.canceled) {
              return;
            }
            scheduler.events.add({
              start: args.start,
              end: args.end,
              id: DayPilot.guid(),
              resource: args.resource,
              text: modal.result,
            });
          }}
          onEventMove={async (args) => {
            console.log("onEventMove", args);
          }}
          onEventResize={async (args) => {
            console.log("onEventResize", args);
          }}
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
