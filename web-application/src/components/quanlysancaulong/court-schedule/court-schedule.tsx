import { bookingCourtsKeys, useListBookingCourts } from "@/hooks/useBookingCourt";
import { bookingCourtOccurrenceKeys, useListBookingCourtOccurrences } from "@/hooks/useBookingCourtOccurrence";
import { apiBaseUrl } from "@/lib/axios";
import { expandBookings, convertOccurrencesToEvents, getDayOfWeekToVietnamese } from "@/lib/common";
import { ListCourtGroupByCourtAreaResponse } from "@/types-openapi/api";
import { BookingCourtStatus } from "@/types/commons";
import { CalendarOutlined, TableOutlined } from "@ant-design/icons";
import { HttpTransportType, HubConnection, HubConnectionBuilder, ILogger, LogLevel } from "@microsoft/signalr";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, Checkbox, message, Segmented } from "antd";
import { DayPilot, DayPilotScheduler } from "daypilot-pro-react";
import { PersonStandingIcon, UserCheckIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BookingDetailDrawer from "./booking-detail-drawer";
import CourtScheduleTable from "./court-schedule-table";
import ModalCreateNewBooking from "./modal-create-new-booking";
import PickCalendar from "./pick-calendar";

interface CourtSchedulerProps {
  courts: ListCourtGroupByCourtAreaResponse[];
}

const CourtScheduler = ({ courts }: CourtSchedulerProps) => {
  const schedulerRef = useRef<DayPilotScheduler>(null);
  const [activeTab, setActiveTab] = useState("1");
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
  const [statusFilter, setStatusFilter] = useState<string[]>([
    BookingCourtStatus.Active,
    BookingCourtStatus.PendingPayment,
    BookingCourtStatus.Completed,
    BookingCourtStatus.CheckedIn,
    BookingCourtStatus.Cancelled,
    BookingCourtStatus.NoShow,
  ]);
  const queryClient = useQueryClient();
  const connectionRef = useRef<HubConnection | null>(null);
  const hasStartedRef = useRef(false);
  const unmountedRef = useRef(false);

  const { data: bookingCourtOccurrences, isFetching: loadingBookingCourts } = useListBookingCourtOccurrences({
    fromDate: selectedDate.toDate(),
    toDate: selectedDate.toDate(),
  });

  const filteredOccurrences = useMemo(() => {
    const all = bookingCourtOccurrences?.data ?? [];
    return all.filter((o) => statusFilter.includes(o.status as string));
  }, [bookingCourtOccurrences, statusFilter]);

  const bookingCourtsEvent = useMemo(() => {
    return convertOccurrencesToEvents(filteredOccurrences);
  }, [filteredOccurrences]);

  // Upcoming customers within the next 1 hour (unique courts that have a start within 1 hour)
  const upcomingWithinHourCount = useMemo(() => {
    try {
      const events: any[] = (bookingCourtsEvent as any[]) || [];
      const now = new Date();
      const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
      const sel = selectedDate.toDate();
      const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
      const courts = new Set<string>();
      for (const ev of events) {
        if (!ev?.start || !ev?.resource) continue;
        const start = new Date(ev.start);
        if (!sameDay(start, sel)) continue;
        if (start >= now && start <= nextHour) {
          courts.add(String(ev.resource));
        }
      }
      return courts.size;
    } catch {
      return 0;
    }
  }, [bookingCourtsEvent, selectedDate]);

  // Arrived but not checked-in yet: events whose start time has passed (and not ended) on selected date, status is Active (paid) and not CheckedIn
  const arrivedNotCheckedInCount = useMemo(() => {
    try {
      const events: any[] = (bookingCourtsEvent as any[]) || [];
      const now = new Date();
      const sel = selectedDate.toDate();
      const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
      let count = 0;
      for (const ev of events) {
        if (!ev?.start || !ev?.end) continue;
        const start = new Date(ev.start);
        const end = new Date(ev.end);
        if (!sameDay(start, sel)) continue;
        const status = ev?.status as string | undefined;
        if (status === BookingCourtStatus.Active && start <= now && now < end) {
          count += 1;
        }
      }
      return count;
    } catch {
      return 0;
    }
  }, [bookingCourtsEvent, selectedDate]);

  // Compute totals only for bookings that actually occur on the selected date
  const selectedCustomDow = useMemo(() => {
    const jsDow = selectedDate.toDate().getDay(); // 0..6, Sunday=0
    return jsDow === 0 ? 8 : jsDow + 1; // match backend convention 2..8 (Mon..Sun)
  }, [selectedDate]);

  const occurrencesForSelectedDay = useMemo(() => {
    const all = bookingCourtOccurrences?.data ?? [];
    const sel = selectedDate.toDate();
    const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    return all.filter((o: any) => {
      const occurrenceDate = new Date(o.startDate as any);
      return sameDay(occurrenceDate, sel);
    });
  }, [bookingCourtOccurrences, selectedDate]);

  const totalCancelled = useMemo(() => {
    return occurrencesForSelectedDay.filter((event: any) => event.status === BookingCourtStatus.Cancelled).length;
  }, [occurrencesForSelectedDay]);
  const totalActive = useMemo(() => {
    return occurrencesForSelectedDay.filter((event: any) => event.status === BookingCourtStatus.Active).length;
  }, [occurrencesForSelectedDay]);
  const totalPendingPayment = useMemo(() => {
    return occurrencesForSelectedDay.filter((event: any) => event.status === BookingCourtStatus.PendingPayment).length;
  }, [occurrencesForSelectedDay]);
  const totalCompleted = useMemo(() => {
    return occurrencesForSelectedDay.filter((event: any) => event.status === BookingCourtStatus.Completed).length;
  }, [occurrencesForSelectedDay]);
  const totalNoShow = useMemo(() => {
    return occurrencesForSelectedDay.filter((event: any) => event.status === BookingCourtStatus.NoShow).length;
  }, [occurrencesForSelectedDay]);

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

  // Re-attach realtime indicator dot when selectedDate changes (scheduler DOM re-renders)
  useEffect(() => {
    if (viewOption !== "schedule") return;
    const id = setTimeout(() => {
      setupSchedulerUI();
    }, 0);
    return () => clearTimeout(id);
  }, [selectedDate, viewOption, setupSchedulerUI]);

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
      queryClient.invalidateQueries({ queryKey: bookingCourtOccurrenceKeys.lists() });
      invalidateDetailIfOpen(payload?.id);
    });
    conn.on("bookingUpdated", (bookingId: string) => {
      queryClient.invalidateQueries({ queryKey: bookingCourtsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bookingCourtOccurrenceKeys.lists() });
      message.open({ type: "info", content: "Lịch đặt sân đã được cập nhật", key: "booking-updated", duration: 3 });
      invalidateDetailIfOpen(bookingId);
    });
    conn.on("occurrenceCheckedIn", (occurrenceId: string) => {
      queryClient.invalidateQueries({ queryKey: bookingCourtOccurrenceKeys.lists() });
      message.open({ type: "info", content: "Khách đã check-in", key: "occurrence-checked-in", duration: 3 });
    });
    conn.on("occurrenceCheckedOut", (occurrenceId: string) => {
      queryClient.invalidateQueries({ queryKey: bookingCourtOccurrenceKeys.lists() });
      message.open({ type: "info", content: "Khách đã check-out", key: "occurrence-checked-out", duration: 3 });
    });
    conn.on("occurrenceNoShow", (occurrenceId: string) => {
      queryClient.invalidateQueries({ queryKey: bookingCourtOccurrenceKeys.lists() });
      message.open({ type: "info", content: "Khách không đến", key: "occurrence-no-show", duration: 3 });
    });
    conn.on("paymentCreated", (payload: any) => {
      queryClient.invalidateQueries({ queryKey: bookingCourtsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bookingCourtOccurrenceKeys.lists() });
      // payload from service includes bookingId
      invalidateDetailIfOpen(payload?.bookingId);
    });
    conn.on("paymentUpdated", () => {
      queryClient.invalidateQueries({ queryKey: bookingCourtsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bookingCourtOccurrenceKeys.lists() });
      // webhook also emits bookingUpdated separately; still refresh detail just in case
      invalidateDetailIfOpen();
    });
    conn.on("bookingCancelled", (bookingId: string) => {
      queryClient.invalidateQueries({ queryKey: bookingCourtsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bookingCourtOccurrenceKeys.lists() });
      invalidateDetailIfOpen(bookingId);
    });
    conn.on("bookingsExpired", (bookingIds: string[]) => {
      queryClient.invalidateQueries({ queryKey: bookingCourtsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bookingCourtOccurrenceKeys.lists() });
      if (Array.isArray(bookingIds)) {
        if (bookingIds.includes(detailId as string)) {
          invalidateDetailIfOpen(detailId as string);
        }
      }
    });
    conn.on("paymentsCancelled", () => {
      queryClient.invalidateQueries({ queryKey: bookingCourtsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bookingCourtOccurrenceKeys.lists() });
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

      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">Lọc trạng thái:</span>
          <Checkbox.Group
            options={[
              { label: "Đã đặt & thanh toán", value: BookingCourtStatus.Active },
              { label: "Đã đặt - chưa thanh toán", value: BookingCourtStatus.PendingPayment },
              { label: "Đã check-in", value: BookingCourtStatus.CheckedIn },
              { label: "Hoàn tất", value: BookingCourtStatus.Completed },
              { label: "Đã hủy", value: BookingCourtStatus.Cancelled },
              { label: "No-show", value: BookingCourtStatus.NoShow },
            ]}
            value={statusFilter}
            onChange={(vals) => setStatusFilter(vals as string[])}
          />
        </div>
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
            <>
              <DayPilotScheduler
                ref={schedulerRef}
                cellWidthSpec={"Fixed"}
                cellWidth={120}
                groupConcurrentEvents={true}
                groupConcurrentEventsLimit={2}
                groupBubble={
                  new DayPilot.Bubble({
                    onLoad: (args: any) => {
                      const count = args?.source?.events?.length ?? 0;
                      args.html = `Ấn để mở danh sách sự kiện (${count} sự kiện)`;
                    },
                  })
                }
                onBeforeGroupRender={(args) => {
                  const totalCancelled = args.group.events.filter(
                    (event: DayPilot.Event) => event.data.status === BookingCourtStatus.Cancelled,
                  ).length;

                  args.group.html = `
                                  <div class="flex items-center justify-between">                                    
                                    <div class="text-medium font-bold text-gray-700">${totalCancelled} sự kiện đã bị huỷ</div>

                                    <svg xmlns="http://www.w3.org/2000/svg" width="16px" height="16px" viewBox="0 0 16 16">
                                      <g fill="#2e3436">
                                        <path d="m 1 2 h 14 v 2 h -14 z m 0 0"/>
                                        <path d="m 1 7 h 14 v 2 h -14 z m 0 0"/>
                                        <path d="m 1 12 h 14 v 2 h -14 z m 0 0"/>
                                      </g>
                                    </svg>
                                  </div>
                                  `;
                }}
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
                  const hasExpanded = args.row.groups && args.row.groups.expanded && args.row.groups.expanded().length > 0;
                  const hasCollapsed = args.row.groups && args.row.groups.collapsed && args.row.groups.collapsed().length > 0;

                  if (hasExpanded && hasCollapsed) {
                    args.row.areas = [
                      {
                        visibility: "Visible",
                        right: 14,
                        top: 0,
                        height: 12,
                        width: 12,
                        style: "cursor:pointer",
                        cssClass: "!w-[14px] !h-[14px]",
                        image: "https://cdn1.iconfinder.com/data/icons/color-bold-style/21/04-512.png",
                        onClick: function () {
                          const row = args.row;
                          row.groups.expandAll();
                        },
                      },
                      {
                        visibility: "Visible",
                        right: 0,
                        top: 0,
                        height: 12,
                        width: 12,
                        style: "cursor:pointer",
                        cssClass: "!w-[14px] !h-[14px]",
                        image: "https://cdn1.iconfinder.com/data/icons/color-bold-style/21/05-512.png",
                        onClick: function () {
                          const row = args.row;
                          row.groups.collapseAll();
                        },
                      },
                    ];
                  } else if (hasCollapsed) {
                    args.row.areas = [
                      {
                        visibility: "Visible",
                        right: 0,
                        top: 0,
                        height: 12,
                        width: 12,
                        style: "cursor:pointer",
                        cssClass: "!w-[14px] !h-[14px]",
                        image: "https://cdn1.iconfinder.com/data/icons/color-bold-style/21/04-512.png",
                        onClick: function () {
                          const row = args.row;
                          row.groups.expandAll();
                        },
                      },
                    ];
                  } else if (hasExpanded) {
                    args.row.areas = [
                      {
                        visibility: "Visible",
                        right: 0,
                        top: 0,
                        height: 12,
                        width: 12,
                        style: "cursor:pointer",
                        cssClass: "!w-[14px] !h-[14px]",
                        image: "https://cdn1.iconfinder.com/data/icons/color-bold-style/21/05-512.png",
                        onClick: function () {
                          const row = args.row;
                          row.groups.collapseAll();
                        },
                      },
                    ];
                  }
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
                  if (eventStatus === BookingCourtStatus.CheckedIn) {
                    args.data.barColor = "#3b82f6"; // tailwind blue-500
                  }
                  if (eventStatus === BookingCourtStatus.NoShow) {
                    args.data.barColor = "#f97316"; // tailwind orange-500
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
                  } else if (eventStatus === BookingCourtStatus.CheckedIn) {
                    badgeText = "Đã check-in";
                    badgeClasses = "text-blue-700";
                  } else if (eventStatus === BookingCourtStatus.NoShow) {
                    badgeText = "Không đến";
                    badgeClasses = "text-orange-700";
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
                onAfterRender={() => {
                  // Ensure the realtime indicator dot exists after scheduler finishes rendering
                  setTimeout(() => {
                    setupSchedulerUI();
                  }, 0);
                }}
                onTimeRangeSelected={async (args) => {
                  const currentTime = new DayPilot.Date();
                  if (args.start.getTime() < currentTime.getTime()) {
                    message.warning("Lưu ý: Bạn đang đặt sân trong quá khứ");
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
              <div className="flex items-start justify-between">
                <div className="flex gap-2 text-sm font-bold">
                  <span className="text-green-500">Đã đặt & thanh toán: {totalActive}</span> •
                  <span className="text-yellow-500">Đã đặt - chưa thanh toán: {totalPendingPayment}</span> •
                  <span className="text-blue-500">Hoàn tất: {totalCompleted}</span> •
                  <span className="text-orange-500">Đã đặt - không đến: {totalNoShow}</span> •
                  <span className="text-red-500">Đã hủy: {totalCancelled}</span>
                </div>
                <div className="mt-1 flex flex-col items-end gap-2 text-sm">
                  <span className="flex items-center font-semibold text-green-500">
                    <PersonStandingIcon className="mr-2 h-4 w-4" /> Lượt khách sắp tới (≤ 1 giờ): {upcomingWithinHourCount} lượt
                  </span>
                  <span className="flex items-center font-semibold text-orange-500">
                    <UserCheckIcon className="mr-2 h-4 w-4" /> Đã đến nhưng chưa check-in: {arrivedNotCheckedInCount} lượt
                  </span>
                </div>
              </div>
            </>
          ) : (
            // <CourtScheduleTable data={filteredOccurrences} loading={loadingBookingCourts} />
            <></>
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
