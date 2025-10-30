"use client";

import { bookingCourtOccurrenceKeys, useListBookingCourtOccurrences } from "@/hooks/useBookingCourtOccurrence";
import { apiBaseUrl } from "@/lib/axios";
import { convertOccurrencesToEvents, getDayOfWeekToVietnamese } from "@/lib/common";
import { ListCourtGroupByCourtAreaResponse } from "@/types-openapi/api";
import { BookingCourtStatus } from "@/types/commons";
import { CalendarOutlined, LoginOutlined } from "@ant-design/icons";
import { HttpTransportType, HubConnection, HubConnectionBuilder, ILogger, LogLevel } from "@microsoft/signalr";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, Button, message } from "antd";
import { DayPilot } from "daypilot-pro-react";
import { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";
import dynamic from "next/dynamic";
import UserCreateBookingModal from "./UserCreateBookingModal";
import PickCalendar from "@/components/quanlysancaulong/court-schedule/pick-calendar";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

// Lazy load heavy components to improve initial page load
const DayPilotScheduler = dynamic(() => import("daypilot-pro-react").then((mod) => ({ default: mod.DayPilotScheduler })), {
  ssr: false, // DayPilot requires client-side rendering
  loading: () => <div className="h-96 animate-pulse rounded bg-gray-200" />,
}) as any; // Type assertion to fix ref issue

interface UserCourtSchedulerProps {
  courts: ListCourtGroupByCourtAreaResponse[];
}

const UserCourtScheduler = ({ courts }: UserCourtSchedulerProps) => {
  const { user, loading: authLoading } = useAuth();
  const schedulerRef = useRef<any>(null);
  const [isSignalRConnected, setIsSignalRConnected] = useState<boolean | null>(null);
  const [selectedDate, setSelectedDate] = useState<DayPilot.Date>(DayPilot.Date.today());
  const [newBooking, setNewBooking] = useState<{
    start: DayPilot.Date;
    end: DayPilot.Date;
    resource: string;
  } | null>(null);
  const [isBookingInPast, setIsBookingInPast] = useState(false);
  const [open, setOpen] = useState(false);

  const queryClient = useQueryClient();
  const connectionRef = useRef<HubConnection | null>(null);
  const hasStartedRef = useRef(false);
  const unmountedRef = useRef(false);

  // Memoize date conversion to prevent unnecessary API calls
  const selectedDateObj = useMemo(() => selectedDate.toDate(), [selectedDate]);

  // Always fetch booking data to show schedule, but disable interactions when not authenticated
  const { data: bookingCourtOccurrences } = useListBookingCourtOccurrences({
    fromDate: selectedDateObj,
    toDate: selectedDateObj,
  });

  // Filter out cancelled events for users
  const filteredOccurrences = useMemo(() => {
    const all = bookingCourtOccurrences?.data ?? [];
    return all.filter((o) => o.status !== BookingCourtStatus.Cancelled);
  }, [bookingCourtOccurrences]);

  // Memoize event conversion to prevent unnecessary re-renders
  const bookingCourtsEvent = useMemo(() => {
    return convertOccurrencesToEvents(filteredOccurrences);
  }, [filteredOccurrences]);

  useEffect(() => {
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
  }, [selectedDate]);

  useEffect(() => {
    // Only connect to SignalR if user is authenticated
    if (!user) {
      return;
    }

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

    conn.on("bookingCreated", () => {
      queryClient.invalidateQueries({ queryKey: bookingCourtOccurrenceKeys.lists() });
    });
    conn.on("bookingUpdated", () => {
      queryClient.invalidateQueries({ queryKey: bookingCourtOccurrenceKeys.lists() });
      message.open({ type: "info", content: "Lịch đặt sân đã được cập nhật", key: "booking-updated", duration: 3 });
    });
    conn.on("paymentCreated", () => {
      queryClient.invalidateQueries({ queryKey: bookingCourtOccurrenceKeys.lists() });
    });
    conn.on("paymentUpdated", () => {
      queryClient.invalidateQueries({ queryKey: bookingCourtOccurrenceKeys.lists() });
    });
    conn.on("bookingCancelled", () => {
      queryClient.invalidateQueries({ queryKey: bookingCourtOccurrenceKeys.lists() });
    });
    conn.on("bookingsExpired", () => {
      queryClient.invalidateQueries({ queryKey: bookingCourtOccurrenceKeys.lists() });
    });
    conn.on("paymentsCancelled", () => {
      queryClient.invalidateQueries({ queryKey: bookingCourtOccurrenceKeys.lists() });
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
  }, [queryClient, user]);

  // Memoize date picker handler to prevent unnecessary re-renders
  const handlePickDate = useCallback((date: string) => {
    setSelectedDate(new DayPilot.Date(date));
  }, []);

  // Memoize event handlers to prevent unnecessary re-renders
  const handleTimeRangeSelected = useCallback(
    async (args: any) => {
      if (!user) {
        message.warning("Vui lòng đăng nhập để đặt sân");
        return;
      }

      const currentTime = new DayPilot.Date();
      if (args.start.getTime() < currentTime.getTime()) {
        message.warning("Lưu ý: Bạn đang đặt sân trong quá khứ");
        setIsBookingInPast(true);
      }

      setOpen(true);

      setNewBooking({
        start: args.start,
        end: args.end,
        resource: args.resource.toString(),
      });
    },
    [user],
  );

  const handleModalClose = useCallback(() => {
    setOpen(false);
    setNewBooking(null);
    setIsBookingInPast(false);
  }, []);

  // Memoize resources to prevent unnecessary re-computations
  const resources: DayPilot.ResourceData[] = useMemo(
    () =>
      courts.map((courtArea) => ({
        name: courtArea.name ?? "",
        id: courtArea.id,
        expanded: true,
        children:
          courtArea.courts?.map((court) => ({
            name: court.name ?? "",
            id: court.id,
          })) ?? [],
      })),
    [courts],
  );

  return (
    <>
      <div className="mb-4">
        {isSignalRConnected === false && user && <Alert message="Không thể kết nối realtime." type="warning" showIcon closable />}
      </div>

      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarOutlined className="text-lg text-blue-500" />
          <span className="text-lg font-semibold">Lịch đặt sân</span>
        </div>
        <div className="text-sm text-gray-600">{user ? "Chọn khoảng thời gian để đặt sân" : "Đăng nhập để đặt sân"}</div>
      </div>

      {/* Show login prompt overlay when not authenticated */}
      {!user && !authLoading && (
        <div className="mb-4 rounded-lg bg-blue-50 p-4 text-center">
          <div className="mb-2">
            <LoginOutlined className="text-2xl text-blue-500" />
          </div>
          <p className="mb-3 text-sm text-blue-700">Bạn cần đăng nhập để có thể đặt sân online</p>
          <Link href="/homepage/login">
            <Button type="primary" size="small" icon={<LoginOutlined />}>
              Đăng nhập ngay
            </Button>
          </Link>
        </div>
      )}

      <div className="flex flex-row justify-between gap-4">
        <div>
          <PickCalendar onPickDate={handlePickDate} />
        </div>

        <div className="relative w-full">
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
                  args.html = `Có ${count} lượt đặt sân trong khoảng thời gian này`;
                },
              })
            }
            onBeforeGroupRender={(args: any) => {
              const totalActive = args.group.events.filter((event: DayPilot.Event) => event.data.status === BookingCourtStatus.Active).length;
              const totalPending = args.group.events.filter(
                (event: DayPilot.Event) => event.data.status === BookingCourtStatus.PendingPayment,
              ).length;

              args.group.html = `
                <div class="flex items-center justify-between">                                    
                  <div class="text-medium font-bold text-gray-700">${totalActive + totalPending} lượt đặt sân</div>
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
            timeRangeSelectedHandling={user ? "Enabled" : "Disabled"}
            days={1}
            startDate={selectedDate}
            resources={resources}
            onBeforeRowHeaderRender={(args: any) => {
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
            onBeforeCellRender={(args: any) => {
              if (args.cell.isParent) {
                args.cell.properties.disabled = true;
                args.cell.properties.backColor = "#f0f0f0";
              }
            }}
            onBeforeEventRender={(args: any) => {
              const eventStatus = args.data.status;

              if (eventStatus === BookingCourtStatus.Active) {
                args.data.barColor = "green";
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
            }}
            onBeforeTimeHeaderRender={(args: any) => {
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
            onTimeRangeSelected={handleTimeRangeSelected}
            eventMoveHandling="Disabled"
            eventResizeHandling="Disabled"
            treeEnabled={true}
            events={bookingCourtsEvent}
            allowEventOverlap={false}
            rowMinHeight={50}
            headerHeight={50}
            rowEmptyHeight={50}
            eventHeight={70}
          />
        </div>
      </div>

      <UserCreateBookingModal open={open} onClose={handleModalClose} newBooking={newBooking} isBookingInPast={isBookingInPast} />
    </>
  );
};

// Memoize the main component to prevent unnecessary re-renders when props haven't changed
export default memo(UserCourtScheduler);
