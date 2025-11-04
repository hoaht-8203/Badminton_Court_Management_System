import { useEffect, useState } from "react";
import {
  Text,
  View,
  useColorScheme,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Modal,
  Animated,
  RefreshControl,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  bookingService,
  ListUserBookingHistoryResponse,
} from "../../services/bookingService";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

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
      return "#10b981";
    case "PendingPayment":
      return "#f59e0b";
    case "Completed":
      return "#3b82f6";
    case "Cancelled":
      return "#ef4444";
    default:
      return "#6b7280";
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
  textColor,
  subTextColor,
  cardBg,
  cardBorder,
  onViewDetails,
}: {
  booking: ListUserBookingHistoryResponse;
  colorScheme: "light" | "dark" | null | undefined;
  textColor: string;
  subTextColor: string;
  cardBg: string;
  cardBorder: string;
  onViewDetails: () => void;
}) {
  const statusColor = getStatusColor(booking.status);

  return (
    <View
      style={{
        backgroundColor: cardBg,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: cardBorder,
        padding: 16,
        marginBottom: 12,
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
            <Ionicons name="calendar-outline" size={18} color={statusColor} />
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: textColor,
                marginLeft: 8,
              }}
            >
              {booking.courtName || "Không có tên sân"}
            </Text>
          </View>
          <Text style={{ fontSize: 13, color: subTextColor, marginBottom: 4 }}>
            {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <Ionicons name="time-outline" size={14} color={subTextColor} />
            <Text style={{ fontSize: 13, color: subTextColor, marginLeft: 4 }}>
              {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 8,
              paddingVertical: 4,
              backgroundColor: statusColor + "20",
              borderRadius: 6,
              alignSelf: "flex-start",
            }}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: statusColor,
                marginRight: 6,
              }}
            />
            <Text
              style={{ fontSize: 11, fontWeight: "600", color: statusColor }}
            >
              {getStatusText(booking.status)}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={onViewDetails}
          style={{
            padding: 8,
            marginLeft: 8,
          }}
        >
          <Ionicons name="eye-outline" size={20} color={subTextColor} />
        </Pressable>
      </View>

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
          <Text style={{ fontSize: 11, color: subTextColor }}>Tổng tiền</Text>
          <Text
            style={{
              fontSize: 14,
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
          <Text style={{ fontSize: 11, color: subTextColor }}>Đã trả</Text>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: "#10b981",
              marginTop: 2,
            }}
          >
            {formatCurrency(booking.paidAmount)}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 11, color: subTextColor }}>Còn lại</Text>
          <Text
            style={{
              fontSize: 14,
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
    </View>
  );
}

export default function Index() {
  const { user, loading } = useAuth();
  const colorScheme = useColorScheme();
  const backgroundColor = colorScheme === "dark" ? "#000000" : "#ffffff";
  const textColor = colorScheme === "dark" ? "#ffffff" : "#000000";
  const subTextColor = colorScheme === "dark" ? "#9ca3af" : "#6b7280";
  const cardBg = colorScheme === "dark" ? "#1f2937" : "#ffffff";
  const cardBorder = colorScheme === "dark" ? "#374151" : "#e5e7eb";
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [allBookings, setAllBookings] = useState<
    ListUserBookingHistoryResponse[]
  >([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] =
    useState<ListUserBookingHistoryResponse | null>(null);
  const slideAnim = useState(new Animated.Value(1000))[0];
  const fadeAnim = useState(new Animated.Value(0))[0];

  // Chỉ hiển thị 3 booking gần nhất
  const displayedBookings = allBookings.slice(0, 3);
  const remainingCount = Math.max(0, allBookings.length - 3);

  const fetchBookings = async () => {
    try {
      const res = await bookingService.getUserBookingHistory();
      if (res?.data) {
        setAllBookings(res.data);
      }
    } catch (error) {
      console.error("Error fetching booking history:", error);
    } finally {
      setBookingsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      setBookingsLoading(true);
      fetchBookings();
    } else {
      setAllBookings([]);
    }
  }, [user]);

  const onRefresh = () => {
    if (user) {
      setRefreshing(true);
      fetchBookings();
    }
  };

  const handleOpenDetailDrawer = (booking: ListUserBookingHistoryResponse) => {
    setSelectedBooking(booking);
    setDetailDrawerVisible(true);
    // Animate drawer slide up and backdrop fade in
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleCloseDetailDrawer = () => {
    // Animate drawer slide down and backdrop fade out
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 1000,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setDetailDrawerVisible(false);
      setSelectedBooking(null);
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor }} edges={["top"]}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator
            size="large"
            color={colorScheme === "dark" ? "#60a5fa" : "#2563eb"}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }} edges={["top"]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 16),
          paddingHorizontal: 16,
          paddingBottom: 24,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colorScheme === "dark" ? "#60a5fa" : "#2563eb"}
          />
        }
      >
        {user ? (
          <>
            {/* Header */}
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "700",
                  color: textColor,
                  marginBottom: 8,
                }}
              >
                Caulong365.store
              </Text>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: textColor,
                }}
              >
                Xin chào! {user.fullName}
              </Text>
            </View>

            {/* Booking History Section */}
            <View style={{ marginBottom: 16 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "700",
                    color: textColor,
                  }}
                >
                  Lịch sử đặt sân
                </Text>
                <Pressable
                  onPress={() => router.push("/booking-history")}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      color: "#3b82f6",
                      fontWeight: "600",
                    }}
                  >
                    Xem tất cả
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#3b82f6" />
                </Pressable>
              </View>

              {bookingsLoading && !refreshing ? (
                <View style={{ paddingVertical: 24, alignItems: "center" }}>
                  <ActivityIndicator
                    size="small"
                    color={colorScheme === "dark" ? "#60a5fa" : "#2563eb"}
                  />
                </View>
              ) : displayedBookings.length === 0 ? (
                <View
                  style={{
                    padding: 24,
                    backgroundColor: cardBg,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: cardBorder,
                    alignItems: "center",
                  }}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={48}
                    color={subTextColor}
                  />
                  <Text
                    style={{
                      color: subTextColor,
                      marginTop: 12,
                      fontSize: 14,
                      textAlign: "center",
                    }}
                  >
                    Bạn chưa có lịch sử đặt sân nào
                  </Text>
                </View>
              ) : (
                <>
                  {displayedBookings.map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      colorScheme={colorScheme}
                      textColor={textColor}
                      subTextColor={subTextColor}
                      cardBg={cardBg}
                      cardBorder={cardBorder}
                      onViewDetails={() => handleOpenDetailDrawer(booking)}
                    />
                  ))}
                  {remainingCount > 0 && (
                    <Pressable
                      onPress={() => router.push("/booking-history")}
                      style={{
                        backgroundColor: cardBg,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: cardBorder,
                        padding: 20,
                        alignItems: "center",
                        marginTop: 8,
                      }}
                    >
                      <Ionicons
                        name="chevron-down-outline"
                        size={24}
                        color={subTextColor}
                      />
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "600",
                          color: textColor,
                          marginTop: 8,
                        }}
                      >
                        Xem thêm {remainingCount} đặt sân
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: subTextColor,
                          marginTop: 4,
                        }}
                      >
                        Nhấn để xem tất cả lịch sử đặt sân
                      </Text>
                    </Pressable>
                  )}
                </>
              )}
            </View>
          </>
        ) : (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingVertical: 48,
            }}
          >
            <Ionicons
              name="information-circle-outline"
              size={64}
              color={subTextColor}
            />
            <Text
              style={{
                fontSize: 16,
                color: textColor,
                marginTop: 24,
                textAlign: "center",
                lineHeight: 24,
                paddingHorizontal: 24,
              }}
            >
              Vui lòng đăng nhập để sử dụng tính năng đặt sân online và quản lý
              lịch sử đặt sân và thanh toán
            </Text>
            <Pressable
              onPress={() => router.push("/login")}
              style={{
                marginTop: 24,
                backgroundColor: "#3b82f6",
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 8,
              }}
            >
              <Text
                style={{ color: "#ffffff", fontWeight: "600", fontSize: 16 }}
              >
                Đăng nhập
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Booking Detail Drawer Modal */}
      {selectedBooking && (
        <Modal
          visible={detailDrawerVisible}
          animationType="none"
          transparent={true}
          onRequestClose={handleCloseDetailDrawer}
          statusBarTranslucent
        >
          <Animated.View
            style={{
              flex: 1,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              justifyContent: "flex-end",
              opacity: fadeAnim,
            }}
          >
            <Pressable style={{ flex: 1 }} onPress={handleCloseDetailDrawer} />
            <Animated.View
              style={{
                backgroundColor: cardBg,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                paddingBottom: Math.max(insets.bottom, 20),
                maxHeight: "95%",
                minHeight: "80%",
                transform: [{ translateY: slideAnim }],
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
                <Pressable onPress={handleCloseDetailDrawer}>
                  <Text
                    style={{
                      color: "#ef4444",
                      fontWeight: "600",
                      fontSize: 16,
                    }}
                  >
                    Đóng
                  </Text>
                </Pressable>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color: textColor,
                  }}
                >
                  Chi tiết đặt sân
                </Text>
                <View style={{ width: 40 }} />
              </View>

              {/* Content */}
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
                showsVerticalScrollIndicator={true}
              >
                {/* Booking Details */}
                <View style={{ gap: 12 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={{ fontSize: 14, color: subTextColor }}>
                      Khách hàng:
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: textColor,
                      }}
                    >
                      {selectedBooking.customerName || "N/A"}
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={{ fontSize: 14, color: subTextColor }}>
                      Tổng giờ:
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: textColor,
                      }}
                    >
                      {selectedBooking.totalHours || 0} giờ
                    </Text>
                  </View>

                  {/* Occurrences */}
                  {(() => {
                    const sortedOccurrences = (
                      selectedBooking.bookingCourtOccurrences || []
                    ).sort(
                      (a, b) =>
                        new Date(a.date || 0).getTime() -
                        new Date(b.date || 0).getTime()
                    );
                    return sortedOccurrences.length > 0 ? (
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
                          const occStatusColor = getStatusColor(
                            occurrence.status
                          );
                          return (
                            <View
                              key={occurrence.id || index}
                              style={{
                                padding: 12,
                                backgroundColor:
                                  colorScheme === "dark"
                                    ? "#111827"
                                    : "#f9fafb",
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
                    ) : null;
                  })()}

                  {/* Payment History */}
                  {(() => {
                    const allPayments = [
                      ...(selectedBooking.payments || []),
                      ...(selectedBooking.bookingCourtOccurrences?.flatMap(
                        (occ) => occ.payments || []
                      ) || []),
                    ].filter(
                      (payment, index, self) =>
                        index === self.findIndex((p) => p.id === payment.id)
                    );
                    return (
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
                              const paymentStatusColor = getStatusColor(
                                payment.status
                              );
                              return (
                                <View
                                  key={payment.id}
                                  style={{
                                    padding: 12,
                                    backgroundColor:
                                      colorScheme === "dark"
                                        ? "#111827"
                                        : "#f9fafb",
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
                                      <Text
                                        style={{
                                          fontSize: 12,
                                          color: subTextColor,
                                        }}
                                      >
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
                                  <View
                                    style={{ alignItems: "flex-end", gap: 4 }}
                                  >
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
                                        backgroundColor:
                                          paymentStatusColor + "20",
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
                    );
                  })()}
                </View>
              </ScrollView>
            </Animated.View>
          </Animated.View>
        </Modal>
      )}
    </SafeAreaView>
  );
}
