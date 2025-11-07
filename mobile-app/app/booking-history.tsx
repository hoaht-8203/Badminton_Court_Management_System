import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  useColorScheme,
  RefreshControl,
  Modal,
  Animated,
  Image,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import {
  bookingService,
  ListUserBookingHistoryResponse,
} from "../services/bookingService";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { apiBaseUrl } from "../lib/axios";

const formatDate = (date?: Date) => {
  if (!date) return "";
  const d = new Date(date);
  const day = `${d.getDate()}`.padStart(2, "0");
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatTime = (time?: string) => {
  if (!time) return "";
  return time.substring(0, 5);
};

const getStatusColor = (status?: string | null) => {
  switch (status) {
    case "Active":
      return "#10b981"; // green
    case "PendingPayment":
      return "#f59e0b"; // orange
    case "Completed":
      return "#3b82f6"; // blue
    case "Cancelled":
      return "#ef4444"; // red
    default:
      return "#6b7280"; // gray
  }
};

const getStatusText = (status?: string | null) => {
  switch (status) {
    case "Active":
      return "Đã đặt & thanh toán";
    case "PendingPayment":
      return "Chờ thanh toán";
    case "Completed":
      return "Hoàn tất";
    case "Cancelled":
      return "Đã hủy";
    default:
      return status || "Không xác định";
  }
};

const formatCurrency = (amount?: number) => {
  if (!amount || amount === 0) return "0 đ";
  return `${amount.toLocaleString("vi-VN")} đ`;
};

function BookingCard({
  booking,
  colorScheme,
  backgroundColor,
  textColor,
  subTextColor,
  cardBg,
  cardBorder,
  onViewQr,
}: {
  booking: ListUserBookingHistoryResponse;
  colorScheme: "light" | "dark" | null | undefined;
  backgroundColor: string;
  textColor: string;
  subTextColor: string;
  cardBg: string;
  cardBorder: string;
  onViewQr?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const statusColor = getStatusColor(booking.status);
  const isPendingPayment = booking.status === "PendingPayment";
  const hasQrUrl = booking.qrUrl && booking.paymentId;

  const sortedOccurrences = (booking.bookingCourtOccurrences || []).sort(
    (a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime()
  );

  const allPayments = [
    ...(booking.payments || []),
    ...(booking.bookingCourtOccurrences?.flatMap((occ) => occ.payments || []) ||
      []),
  ].filter(
    (payment, index, self) =>
      index === self.findIndex((p) => p.id === payment.id)
  );

  return (
    <View
      style={{
        backgroundColor: cardBg,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: cardBorder,
        marginBottom: 16,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Pressable
        onPress={() => setExpanded(!expanded)}
        style={{
          padding: 16,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <View style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <Ionicons name="calendar-outline" size={20} color={statusColor} />
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: textColor,
                  marginLeft: 8,
                }}
              >
                {booking.courtName || "Không có tên sân"}
              </Text>
            </View>
            <View style={{ marginTop: 4 }}>
              <Text style={{ fontSize: 14, color: subTextColor }}>
                {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 4,
                }}
              >
                <Ionicons name="time-outline" size={16} color={subTextColor} />
                <Text
                  style={{ fontSize: 14, color: subTextColor, marginLeft: 4 }}
                >
                  {formatTime(booking.startTime)} -{" "}
                  {formatTime(booking.endTime)}
                </Text>
              </View>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 8,
                paddingHorizontal: 8,
                paddingVertical: 4,
                backgroundColor: statusColor + "20",
                borderRadius: 6,
                alignSelf: "flex-start",
              }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: statusColor,
                  marginRight: 6,
                }}
              />
              <Text
                style={{ fontSize: 12, fontWeight: "600", color: statusColor }}
              >
                {getStatusText(booking.status)}
              </Text>
            </View>
          </View>
          <View
            style={{ flexDirection: "column", alignItems: "center", gap: 8 }}
          >
            {isPendingPayment && hasQrUrl && onViewQr && (
              <Pressable
                onPress={onViewQr}
                style={{
                  padding: 8,
                }}
              >
                <Ionicons name="qr-code-outline" size={20} color="#3b82f6" />
              </Pressable>
            )}
            <Ionicons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={24}
              color={subTextColor}
            />
          </View>
        </View>

        {/* Summary */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 12,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: cardBorder,
          }}
        >
          <View>
            <Text style={{ fontSize: 12, color: subTextColor }}>Tổng tiền</Text>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: "#10b981",
                marginTop: 2,
              }}
            >
              {booking.totalAmount
                ? formatCurrency(booking.totalAmount)
                : "Chưa tính"}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 12, color: subTextColor }}>Đã trả</Text>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#10b981",
                marginTop: 2,
              }}
            >
              {formatCurrency(booking.paidAmount)}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 12, color: subTextColor }}>Còn lại</Text>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color:
                  booking.remainingAmount && booking.remainingAmount > 0
                    ? "#f59e0b"
                    : "#10b981",
                marginTop: 2,
              }}
            >
              {formatCurrency(booking.remainingAmount)}
            </Text>
          </View>
        </View>
      </Pressable>

      {/* Expanded Content */}
      {expanded && (
        <View
          style={{ borderTopWidth: 1, borderTopColor: cardBorder, padding: 16 }}
        >
          {/* Tabs */}
          <View
            style={{
              flexDirection: "row",
              marginBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: cardBorder,
            }}
          >
            <Pressable
              style={{
                paddingBottom: 8,
                marginRight: 16,
                borderBottomWidth: 2,
                borderBottomColor: "#3b82f6",
              }}
            >
              <Text
                style={{ fontSize: 14, fontWeight: "600", color: "#3b82f6" }}
              >
                Chi tiết đặt sân
              </Text>
            </Pressable>
          </View>

          {/* Booking Details */}
          <View style={{ gap: 12 }}>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={{ fontSize: 14, color: subTextColor }}>
                Khách hàng:
              </Text>
              <Text
                style={{ fontSize: 14, fontWeight: "600", color: textColor }}
              >
                {booking.customerName || "N/A"}
              </Text>
            </View>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={{ fontSize: 14, color: subTextColor }}>
                Tổng giờ:
              </Text>
              <Text
                style={{ fontSize: 14, fontWeight: "600", color: textColor }}
              >
                {booking.totalHours || 0} giờ
              </Text>
            </View>

            {/* Occurrences */}
            {sortedOccurrences.length > 0 && (
              <View style={{ marginTop: 12 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: textColor,
                    marginBottom: 12,
                  }}
                >
                  Chi tiết các lần sử dụng sân
                </Text>
                {sortedOccurrences.map((occurrence, index) => {
                  const occStatusColor = getStatusColor(occurrence.status);
                  return (
                    <View
                      key={occurrence.id || index}
                      style={{
                        padding: 12,
                        backgroundColor:
                          colorScheme === "dark" ? "#111827" : "#f9fafb",
                        borderRadius: 8,
                        marginBottom: 8,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: "600",
                              color: "#3b82f6",
                            }}
                          >
                            Buổi {index + 1}
                          </Text>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              marginTop: 4,
                            }}
                          >
                            <Ionicons
                              name="calendar-outline"
                              size={14}
                              color={subTextColor}
                            />
                            <Text
                              style={{
                                fontSize: 12,
                                color: subTextColor,
                                marginLeft: 4,
                              }}
                            >
                              {formatDate(occurrence.date)}
                            </Text>
                          </View>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              marginTop: 4,
                            }}
                          >
                            <Ionicons
                              name="time-outline"
                              size={14}
                              color={subTextColor}
                            />
                            <Text
                              style={{
                                fontSize: 12,
                                color: subTextColor,
                                marginLeft: 4,
                              }}
                            >
                              {formatTime(occurrence.startTime)} -{" "}
                              {formatTime(occurrence.endTime)}
                            </Text>
                          </View>
                        </View>
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            backgroundColor: occStatusColor + "20",
                            borderRadius: 6,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: "600",
                              color: occStatusColor,
                            }}
                          >
                            {getStatusText(occurrence.status)}
                          </Text>
                        </View>
                      </View>
                      {occurrence.note && (
                        <Text
                          style={{
                            fontSize: 12,
                            color: subTextColor,
                            marginTop: 8,
                          }}
                        >
                          Ghi chú: {occurrence.note}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* Payment History */}
            <View style={{ marginTop: 16 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: textColor,
                  marginBottom: 12,
                }}
              >
                Lịch sử thanh toán
              </Text>
              {allPayments.length === 0 ? (
                <Text
                  style={{
                    fontSize: 14,
                    color: subTextColor,
                    fontStyle: "italic",
                  }}
                >
                  Chưa có lịch sử thanh toán
                </Text>
              ) : (
                <View style={{ gap: 8 }}>
                  {allPayments.map((payment) => {
                    const paymentStatusColor = getStatusColor(payment.status);
                    return (
                      <View
                        key={payment.id}
                        style={{
                          padding: 12,
                          backgroundColor:
                            colorScheme === "dark" ? "#111827" : "#f9fafb",
                          borderRadius: 8,
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <Ionicons
                              name="card-outline"
                              size={16}
                              color={subTextColor}
                            />
                            <Text style={{ fontSize: 12, color: subTextColor }}>
                              {payment.id || "N/A"}
                            </Text>
                          </View>
                          <Text
                            style={{
                              fontSize: 12,
                              color: subTextColor,
                              marginTop: 4,
                            }}
                          >
                            {payment.paymentCreatedAt
                              ? formatDate(payment.paymentCreatedAt) +
                                " " +
                                new Date(
                                  payment.paymentCreatedAt
                                ).toLocaleTimeString("vi-VN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "N/A"}
                          </Text>
                          {payment.note && (
                            <Text
                              style={{
                                fontSize: 11,
                                color: subTextColor,
                                marginTop: 4,
                              }}
                            >
                              {payment.note}
                            </Text>
                          )}
                        </View>
                        <View style={{ alignItems: "flex-end", gap: 4 }}>
                          <Text
                            style={{
                              fontSize: 16,
                              fontWeight: "700",
                              color: "#10b981",
                            }}
                          >
                            {formatCurrency(payment.amount)}
                          </Text>
                          <View
                            style={{
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              backgroundColor: paymentStatusColor + "20",
                              borderRadius: 4,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 10,
                                fontWeight: "600",
                                color: paymentStatusColor,
                              }}
                            >
                              {payment.status === "Paid"
                                ? "Đã thanh toán"
                                : payment.status === "PendingPayment"
                                ? "Chờ thanh toán"
                                : payment.status === "Cancelled"
                                ? "Đã hủy"
                                : payment.status || "N/A"}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

export default function BookingHistory() {
  const [bookings, setBookings] = useState<ListUserBookingHistoryResponse[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const backgroundColor = colorScheme === "dark" ? "#000000" : "#ffffff";
  const textColor = colorScheme === "dark" ? "#ffffff" : "#000000";
  const subTextColor = colorScheme === "dark" ? "#9ca3af" : "#6b7280";
  const cardBg = colorScheme === "dark" ? "#1f2937" : "#ffffff";
  const cardBorder = colorScheme === "dark" ? "#374151" : "#e5e7eb";
  const insets = useSafeAreaInsets();

  // QR drawer state
  const [qrDrawerVisible, setQrDrawerVisible] = useState(false);
  const qrSlide = useState(new Animated.Value(1000))[0];
  const qrFade = useState(new Animated.Value(0))[0];
  const [bookingDetail, setBookingDetail] =
    useState<ListUserBookingHistoryResponse | null>(null);
  const [remainingMs, setRemainingMs] = useState<number>(0);

  const fetchBookings = async () => {
    try {
      const res = await bookingService.getUserBookingHistory();
      if (res?.data) {
        setBookings(res.data);
      }
    } catch (error) {
      console.error("Error fetching booking history:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  // Countdown timer for QR drawer
  useEffect(() => {
    if (!qrDrawerVisible || !bookingDetail?.expiresAtUtc) return;
    const id = setInterval(() => {
      const expiry = new Date(bookingDetail.expiresAtUtc as any).getTime();
      setRemainingMs(Math.max(0, expiry - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [qrDrawerVisible, bookingDetail?.expiresAtUtc]);

  // SignalR payment updates
  useEffect(() => {
    if (!qrDrawerVisible || !bookingDetail?.paymentId) return;
    const connection = new HubConnectionBuilder()
      .withUrl(`${apiBaseUrl}/hubs/booking`, { withCredentials: true })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();
    let alive = true;
    (async () => {
      try {
        await connection.start();
      } catch {}
      if (!alive) return;
      connection.on("paymentUpdated", (paymentId: string) => {
        if (paymentId === bookingDetail.paymentId) {
          // Close QR drawer and refresh data
          Animated.parallel([
            Animated.timing(qrSlide, {
              toValue: 1000,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(qrFade, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start(() => {
            setQrDrawerVisible(false);
            setBookingDetail(null);
          });
          fetchBookings();
        }
      });
    })();
    return () => {
      alive = false;
      connection.stop().catch(() => {});
    };
  }, [qrDrawerVisible, bookingDetail?.paymentId, qrSlide, qrFade]);

  const downloadQr = () => {
    const url = bookingDetail?.qrUrl as string | undefined;
    if (!url) return;
    Linking.openURL(url).catch(() => {});
  };

  const openMBBank = () => {
    const ba = "VQRQAEMLF5363@mb";
    const am = Math.round(bookingDetail?.paymentAmount || 0);
    const tn = bookingDetail?.paymentId || "";
    const url = `mbbank://pay?ba=${encodeURIComponent(
      ba
    )}&am=${am}&tn=${encodeURIComponent(tn)}`;
    Linking.openURL(url).catch(() => {});
  };

  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor,
          justifyContent: "center",
          alignItems: "center",
        }}
        edges={["top"]}
      >
        <ActivityIndicator
          size="large"
          color={colorScheme === "dark" ? "#60a5fa" : "#2563eb"}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }} edges={["top"]}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: cardBorder,
          backgroundColor: cardBg,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{ padding: 8, marginRight: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </Pressable>
        <Text
          style={{ fontSize: 18, fontWeight: "700", color: textColor, flex: 1 }}
        >
          Lịch sử đặt sân & Thanh toán
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {bookings.length === 0 ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingVertical: 48,
            }}
          >
            <Ionicons name="calendar-outline" size={64} color={subTextColor} />
            <Text
              style={{
                color: subTextColor,
                marginTop: 16,
                fontSize: 16,
                textAlign: "center",
              }}
            >
              Bạn chưa có lịch sử đặt sân nào
            </Text>
          </View>
        ) : (
          bookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              colorScheme={colorScheme}
              backgroundColor={backgroundColor}
              textColor={textColor}
              subTextColor={subTextColor}
              cardBg={cardBg}
              cardBorder={cardBorder}
              onViewQr={() => {
                setBookingDetail(booking);
                if (booking.expiresAtUtc) {
                  const expiry = new Date(
                    booking.expiresAtUtc as any
                  ).getTime();
                  setRemainingMs(Math.max(0, expiry - Date.now()));
                }
                setQrDrawerVisible(true);
                Animated.parallel([
                  Animated.timing(qrSlide, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                  }),
                  Animated.timing(qrFade, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                  }),
                ]).start();
              }}
            />
          ))
        )}
      </ScrollView>

      {/* QR Payment Drawer */}
      <Modal
        visible={qrDrawerVisible}
        animationType="none"
        transparent
        onRequestClose={() => {
          Animated.parallel([
            Animated.timing(qrSlide, {
              toValue: 1000,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(qrFade, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start(() => setQrDrawerVisible(false));
        }}
        statusBarTranslucent
      >
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
            opacity: qrFade,
          }}
        >
          <Pressable
            style={{ flex: 1 }}
            onPress={() => {
              Animated.parallel([
                Animated.timing(qrSlide, {
                  toValue: 1000,
                  duration: 300,
                  useNativeDriver: true,
                }),
                Animated.timing(qrFade, {
                  toValue: 0,
                  duration: 300,
                  useNativeDriver: true,
                }),
              ]).start(() => setQrDrawerVisible(false));
            }}
          />
          <Animated.View
            style={{
              backgroundColor: cardBg,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingBottom: Math.max(insets.bottom, 20),
              maxHeight: "95%",
              minHeight: "70%",
              transform: [{ translateY: qrSlide }],
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: cardBorder,
              }}
            >
              <Text
                style={{ fontSize: 18, fontWeight: "700", color: textColor }}
              >
                Thanh toán chuyển khoản
              </Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 16, gap: 16 }}
            >
              {/* Countdown */}
              {bookingDetail?.expiresAtUtc ? (
                <View
                  style={{
                    padding: 10,
                    borderWidth: 1,
                    borderColor: "#fecaca",
                    backgroundColor: "#fef2f2",
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: "#b91c1c", fontWeight: "700" }}>
                    Thời gian giữ chỗ còn lại:{" "}
                    {Math.floor(remainingMs / 1000 / 60)}:
                    {String(Math.floor((remainingMs / 1000) % 60)).padStart(
                      2,
                      "0"
                    )}
                  </Text>
                </View>
              ) : null}

              {/* QR */}
              <View style={{ alignItems: "center" }}>
                {bookingDetail?.qrUrl ? (
                  <Image
                    source={{ uri: bookingDetail.qrUrl }}
                    style={{ width: 260, height: 260, borderRadius: 12 }}
                  />
                ) : (
                  <Text style={{ color: subTextColor }}>Không có QR</Text>
                )}
                <Text style={{ color: textColor, marginTop: 8 }}>
                  Mã thanh toán: {bookingDetail?.paymentId ?? "-"}
                </Text>
                <Text
                  style={{ color: textColor, marginTop: 4, fontWeight: "700" }}
                >
                  Số tiền:{" "}
                  {(bookingDetail?.paymentAmount ?? 0).toLocaleString("vi-VN")}{" "}
                  đ
                </Text>
              </View>

              {/* Actions */}
              <View
                style={{
                  flexDirection: "row",
                  gap: 12,
                  justifyContent: "center",
                  marginTop: 8,
                }}
              >
                <Pressable
                  onPress={downloadQr}
                  style={{
                    backgroundColor:
                      colorScheme === "dark" ? "#374151" : "#e5e7eb",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Ionicons
                    name="download-outline"
                    size={18}
                    color={textColor}
                  />
                  <Text style={{ color: textColor, fontWeight: "600" }}>
                    Tải QR
                  </Text>
                </Pressable>
                <Pressable
                  onPress={openMBBank}
                  style={{
                    backgroundColor: "#2563eb",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Ionicons name="logo-buffer" size={18} color="#ffffff" />
                  <Text style={{ color: "#ffffff", fontWeight: "700" }}>
                    Thanh toán bằng MB Bank
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
}
