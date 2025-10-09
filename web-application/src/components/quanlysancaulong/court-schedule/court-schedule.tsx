import { bookingCourtsKeys, useListBookingCourts } from "@/hooks/useBookingCourt";
import { expandBookings, getDayOfWeekToVietnamese } from "@/lib/common";
import { ListCourtGroupByCourtAreaResponse } from "@/types-openapi/api";
import { BookingCourtStatus } from "@/types/commons";
import { DayPilot, DayPilotScheduler } from "daypilot-pro-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HubConnection, HubConnectionBuilder, LogLevel, ILogger } from "@microsoft/signalr";
import { useQueryClient } from "@tanstack/react-query";
import ModalCreateNewBooking from "./modal-create-new-booking";
import PickCalendar from "./pick-calendar";
import CourtScheduleTable from "./court-schedule-table";
import { HttpTransportType } from "@microsoft/signalr";
import { apiBaseUrl } from "@/lib/axios";
import { Alert, message, Segmented } from "antd";
import { CalendarOutlined, TableOutlined } from "@ant-design/icons";
import BookingDetailDrawer from "./booking-detail-drawer";

interface CourtSchedulerProps {
  courts: ListCourtGroupByCourtAreaResponse[];
}

const CourtScheduler = ({ courts }: CourtSchedulerProps) => {
  const schedulerRef = useRef<DayPilotScheduler>(null);
  const [viewOption, setViewOption] = useState<"schedule" | "list">("schedule");
  const [open, setOpen] = useState(false);
  const [isSignalRConnected, setIsSignalRConnected] = useState<boolean | null>(null);
  const [selectedDate, setSelectedDate] = useState<DayPilot.Date>(DayPilot.Date.today());
  const [newBooking, setNewBooking] = useState<{
    start: DayPilot.Date;
    end: DayPilot.Date;
    resource: string;
  } | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [openDetail, setOpenDetail] = useState(false);
  const queryClient = useQueryClient();
  const connectionRef = useRef<HubConnection | null>(null);
  const hasStartedRef = useRef(false);
  const unmountedRef = useRef(false);

  const { data: bookingCourts, isFetching: loadingBookingCourts } = useListBookingCourts({
    fromDate: selectedDate.toDate(),
    toDate: selectedDate.toDate(),
  });

  const bookingCourtsEvent = useMemo(() => {
    return expandBookings(bookingCourts?.data?.filter((booking) => booking.status !== BookingCourtStatus.Cancelled) ?? []);
  }, [bookingCourts]);

  // Detail is fetched inside BookingDetailDrawer component

  // Function để setup UI cho realtime connection dot
  const setupSchedulerUI = useCallback(() => {
    const corner = document.querySelector(".scheduler_default_corner") as HTMLElement | null;
    if (!corner) return;

    const dotId = "realtime-connection-dot";
    let dot = document.getElementById(dotId) as HTMLDivElement | null;
    if (!dot) {
      dot = document.createElement("div");
      dot.id = dotId;
      dot.style.width = "10px";
      dot.style.height = "10px";
      dot.style.borderRadius = "50%";
      dot.style.margin = "4px";
      dot.style.boxShadow = "0 0 0 1px rgba(0,0,0,0.1) inset";
      dot.style.display = "inline-block";
      corner.appendChild(dot);
    }

    const color = isSignalRConnected === null ? "#9CA3AF" : isSignalRConnected ? "#10B981" : "#EF4444"; // gray, green, red
    const title =
      isSignalRConnected === null ? "Đang kiểm tra kết nối realtime" : isSignalRConnected ? "Đã kết nối realtime" : "Mất kết nối realtime";
    dot.style.backgroundColor = color;
    dot.title = title;
  }, [isSignalRConnected]);

  useEffect(() => {
    // Chỉ chạy khi đang ở chế độ schedule
    if (viewOption !== "schedule") return;

    // Chạy ngay lập tức
    setupSchedulerUI();

    // Nếu DOM chưa sẵn sàng, thử lại sau một khoảng thời gian
    const timeoutId = setTimeout(() => {
      setupSchedulerUI();
    }, 200);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [viewOption, setupSchedulerUI]);

  // Thêm useEffect để setup lại UI khi modal đóng
  useEffect(() => {
    if (viewOption !== "schedule") return;

    // Khi modal đóng (open = false), setup lại UI sau một khoảng thời gian ngắn
    if (!open) {
      const timeoutId = setTimeout(() => {
        setupSchedulerUI();
      }, 100);

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [open, viewOption, setupSchedulerUI]);

  useEffect(() => {
    if (viewOption === "schedule") {
      const scrollToSevenAMOfSelected = () => {
        if (schedulerRef.current) {
          const scheduler = schedulerRef.current.control;

          const target = selectedDate.toDate();
          target.setHours(7, 0, 0, 0);

          const dpDate = new DayPilot.Date(target, true);

          scheduler.scrollTo(dpDate);
        }
      };

      // Chạy ngay lập tức
      scrollToSevenAMOfSelected();

      // Nếu scheduler chưa sẵn sàng, thử lại sau một khoảng thời gian
      const timeoutId = setTimeout(() => {
        scrollToSevenAMOfSelected();
      }, 100);

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [viewOption, selectedDate]);

  useEffect(() => {
    // Custom logger to filter benign startup races that cause noisy Next.js error overlays
    const filteredLogger: ILogger = {
      log: (level, message) => {
        const text = String(message ?? "");
        // Suppress known harmless races during StrictMode mounts/unmounts
        if (text.includes("stopped during negotiation") || text.includes("before stop() was called")) {
          return;
        }

        if (level >= LogLevel.Error) {
          console.error(`[SignalR] ${text}`);
        } else if (level >= LogLevel.Warning) {
          console.warn(`[SignalR] ${text}`);
        } else if (level >= LogLevel.Information) {
          console.info(`[SignalR] ${text}`);
        } else {
          // Trace level
          if (process.env.NODE_ENV === "development") {
            console.debug(`[SignalR] ${text}`);
          }
        }
      },
    };

    const conn = new HubConnectionBuilder()
      .withUrl(`${apiBaseUrl}/hubs/booking`, {
        withCredentials: true,
        skipNegotiation: false, // Allow negotiation to try different transports
        transport: HttpTransportType.WebSockets | HttpTransportType.ServerSentEvents | HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect()
      .configureLogging(filteredLogger)
      .build();
    connectionRef.current = conn;

    const invalidateDetailIfOpen = (bookingId?: string) => {
      if (!openDetail || !detailId) return;
      if (!bookingId || bookingId === detailId) {
        queryClient.invalidateQueries({ queryKey: [...bookingCourtsKeys.details(), detailId] });
      }
    };

    conn.on("bookingCreated", (payload: any) => {
      queryClient.invalidateQueries({ queryKey: bookingCourtsKeys.lists() });
      invalidateDetailIfOpen(payload?.id);
    });
    conn.on("bookingUpdated", (bookingId: string) => {
      queryClient.invalidateQueries({ queryKey: bookingCourtsKeys.lists() });
      invalidateDetailIfOpen(bookingId);
    });
    conn.on("paymentCreated", (payload: any) => {
      queryClient.invalidateQueries({ queryKey: bookingCourtsKeys.lists() });
      // payload from service includes bookingId
      invalidateDetailIfOpen(payload?.bookingId);
    });
    conn.on("paymentUpdated", () => {
      queryClient.invalidateQueries({ queryKey: bookingCourtsKeys.lists() });
      // webhook also emits bookingUpdated separately; still refresh detail just in case
      invalidateDetailIfOpen();
    });
    conn.on("bookingsExpired", (bookingIds: string[]) => {
      queryClient.invalidateQueries({ queryKey: bookingCourtsKeys.lists() });
      if (Array.isArray(bookingIds)) {
        if (bookingIds.includes(detailId as string)) {
          invalidateDetailIfOpen(detailId as string);
        }
      }
    });
    conn.on("paymentsCancelled", () => {
      queryClient.invalidateQueries({ queryKey: bookingCourtsKeys.lists() });
      invalidateDetailIfOpen();
    });

    let isAlive = true;
    const handleBeforeUnload = () => {
      // Ensure connection is stopped before page is unloaded
      try {
        conn.stop();
      } catch {}
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    (async () => {
      try {
        await conn.start();
        if (!isAlive) return; // component unmounted during start -> ignore
        hasStartedRef.current = true;
        setIsSignalRConnected(true);
        console.log("SignalR connected");
      } catch (err) {
        const name = (err as any)?.name as string | undefined;
        const errMessage = (err as Error)?.message || "";
        // Ignore benign race when cleanup stops connection before start resolves (StrictMode / fast remount)
        if (name === "AbortError" || errMessage.includes("before stop() was called") || errMessage.includes("stopped during negotiation")) {
          return;
        }
        console.debug("SignalR start non-fatal:", err);
        // Show user-facing error toast for real connection failures
        const humanMsg = (err as Error)?.message || "Không thể kết nối realtime.";
        setIsSignalRConnected(false);
        message.open({ type: "error", content: humanMsg, key: "signalr-connect-error", duration: 3 });
      }
    })();

    return () => {
      isAlive = false;
      unmountedRef.current = true;
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Only stop if we actually started, and avoid stopping if already disconnected
      conn
        .stop()
        .then(() => {
          // disconnected
        })
        .catch(() => {
          // swallow stop race errors
        });
    };
  }, [queryClient, openDetail, detailId]);

  const handlePickDate = (date: string) => {
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

  // const handleCreateBooking = () => {
  //   console.log("handleCreateBooking", newBooking);
  //   setEvents([
  //     ...events,
  //     {
  //       start: newBooking?.start ?? "",
  //       end: newBooking?.end ?? "",
  //       resource: newBooking?.resource ?? "",
  //       text: `Sự kiện mới ${newBooking?.start.toString("HH:mm")} - ${newBooking?.end.toString("HH:mm")}`,
  //       id: DayPilot.guid(),
  //       status: "Booked",
  //     },
  //   ]);
  //   setOpen(false);
  //   setNewBooking(null);
  // };

  return (
    <>
      <div className="mb-4">{isSignalRConnected === false && <Alert message="Không thể kết nối realtime." type="warning" showIcon closable />}</div>

      <div className="mb-2 flex justify-end">
        <Segmented
          options={[
            { label: "Xem theo lịch", value: "schedule", icon: <CalendarOutlined /> },
            { label: "Xem theo danh sách", value: "list", icon: <TableOutlined /> },
          ]}
          onChange={(value) => {
            setViewOption(value as "schedule" | "list");
          }}
          size="large"
        />
      </div>

      <div className="flex flex-row gap-4">
        <div>
          <PickCalendar onPickDate={handlePickDate} />
        </div>

        <div className="w-full">
          {viewOption === "schedule" ? (
            <DayPilotScheduler
              ref={schedulerRef}
              cellWidthSpec={"Fixed"}
              cellWidth={120}
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
              onBeforeRowHeaderRender={(args) => {
                args.row.cssClass = "resource-css";
              }}
              onBeforeCellRender={(args) => {
                if (args.cell.isParent) {
                  args.cell.properties.disabled = true;
                  args.cell.properties.backColor = "#f0f0f0";
                }
              }}
              onBeforeEventRender={(args) => {
                const eventStatus = args.data.status;

                if (eventStatus === BookingCourtStatus.Active) {
                  args.data.barColor = "green";
                }

                if (eventStatus === BookingCourtStatus.Cancelled) {
                  args.data.barColor = "red";
                }

                if (eventStatus === BookingCourtStatus.Completed) {
                  args.data.barColor = "blue";
                }

                if (eventStatus === BookingCourtStatus.PendingPayment) {
                  args.data.barColor = "yellow";
                }

                // Customize event text with a status badge + customer name + time range
                const startText = new DayPilot.Date(args.data.start).toString("HH:mm");
                const endText = new DayPilot.Date(args.data.end).toString("HH:mm");
                const customerName = args.data.text ?? "";

                let badgeText = "";
                let badgeClasses = "";
                if (eventStatus === BookingCourtStatus.Active) {
                  badgeText = "Đã đặt & thanh toán";
                  badgeClasses = "text-green-800";
                } else if (eventStatus === BookingCourtStatus.PendingPayment) {
                  badgeText = "Đã đặt - chưa thanh toán";
                  badgeClasses = "text-yellow-800";
                } else if (eventStatus === BookingCourtStatus.Completed) {
                  badgeText = "Hoàn tất";
                  badgeClasses = "text-blue-800";
                } else if (eventStatus === BookingCourtStatus.Cancelled) {
                  badgeText = "Đã hủy";
                  badgeClasses = "text-red-800";
                }

                const badgeHtml = badgeText ? `<span class="${badgeClasses}">${badgeText}</span>` : "";

                args.data.html = `
              <div class="flex flex-col gap-1">
                ${badgeHtml}
                <span class="font-semibold">${customerName}</span>
                <span class="text-xs text-gray-700">(${startText} - ${endText})</span>
              </div>
            `;

                // if (eventStart.getTime() < now.getTime()) {
                //   args.data.barColor = "orange";
                // }

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

                if (args.header.level === 1) {
                  args.header.cssClass = "custom-header";
                }
              }}
              onTimeRangeSelected={async (args) => {
                const scheduler = args.control;
                const currentTime = new DayPilot.Date();
                if (args.start.getTime() < currentTime.getTime()) {
                  message.error("Không thể đặt sân trong quá khứ");
                  scheduler.clearSelection();
                  return;
                }

                setOpen(true);

                setNewBooking({
                  start: args.start,
                  end: args.end,
                  resource: args.resource.toString(),
                });
              }}
              eventMoveHandling="Disabled"
              eventResizeHandling="Disabled"
              onEventClick={async (args) => {
                const id = String(args.e.data.id ?? "");
                if (!id) return;
                if (id.includes("@")) {
                  setDetailId(id.split("@")[0]);
                } else {
                  setDetailId(id);
                }
                setOpenDetail(true);
              }}
              treeEnabled={true}
              events={bookingCourtsEvent}
              allowEventOverlap={false}
              rowMinHeight={50}
              headerHeight={50}
              rowEmptyHeight={50}
              eventHeight={70}
            />
          ) : (
            <CourtScheduleTable data={bookingCourts?.data ?? []} loading={loadingBookingCourts} />
          )}
        </div>

        <ModalCreateNewBooking
          open={open}
          onClose={() => {
            setOpen(false);
            setNewBooking(null);
          }}
          newBooking={newBooking}
        />

        <BookingDetailDrawer
          bookingId={detailId}
          open={openDetail}
          onClose={() => {
            setOpenDetail(false);
            setDetailId(null);
          }}
        />
      </div>
    </>
  );
};

export default CourtScheduler;
