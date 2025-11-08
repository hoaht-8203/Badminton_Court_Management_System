import { toast } from "@backpackapp-io/react-native-toast";
import { Ionicons } from "@expo/vector-icons";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  useColorScheme,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { apiBaseUrl } from "../../lib/axios";
import { courtScheduleService } from "../../services/courtScheduleService";

const formatDate = (date?: Date) => {
  if (!date) return "";
  const d = new Date(date);
  const day = `${d.getDate()}`.padStart(2, "0");
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};
const formatHHmmss = (d: Date) => {
  const hh = `${d.getHours()}`.padStart(2, "0");
  const mm = `${d.getMinutes()}`.padStart(2, "0");
  const ss = `${d.getSeconds()}`.padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
};
const formatTime = (s: string) => s.substring(0, 5);
const formatYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const roundToMinutes = (date: Date, interval = 15) => {
  const d = new Date(date);
  d.setSeconds(0, 0);
  const minutes = d.getMinutes();
  const rounded = Math.round(minutes / interval) * interval;
  if (rounded === 60) {
    d.setHours(d.getHours() + 1);
    d.setMinutes(0);
  } else {
    d.setMinutes(rounded);
  }
  return d;
};

export default function BookingCreate() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const backgroundColor = colorScheme === "dark" ? "#000000" : "#ffffff";
  const textColor = colorScheme === "dark" ? "#ffffff" : "#000000";
  const subTextColor = colorScheme === "dark" ? "#9ca3af" : "#6b7280";
  const cardBg = colorScheme === "dark" ? "#1f2937" : "#ffffff";
  const cardBorder = colorScheme === "dark" ? "#374151" : "#e5e7eb";
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Compute initial 15-minute aligned times
  const initialStart = roundToMinutes(new Date(), 15);
  const initialEnd = roundToMinutes(new Date(Date.now() + 60 * 60 * 1000), 15);
  const [courts, setCourts] = useState<
    {
      id: string;
      name: string;
      imageUrl?: string | null;
      courtAreaId?: number | null;
      courtAreaName?: string | null;
      note?: string | null;
      status?: string | null;
    }[]
  >([]);
  const [loadingCourts, setLoadingCourts] = useState(false);
  const [createCourtId, setCreateCourtId] = useState<string>("");
  const [createMode, setCreateMode] = useState<"1" | "2">("1");
  const [createDate, setCreateDate] = useState<Date>(new Date());
  const [rangeStart, setRangeStart] = useState<Date>(new Date());
  const [rangeEnd, setRangeEnd] = useState<Date>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  );
  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState<number[]>([]);
  const [createStartTime, setCreateStartTime] = useState<Date>(initialStart);
  const [createEndTime, setCreateEndTime] = useState<Date>(initialEnd);
  const [creating, setCreating] = useState(false);
  // Payment
  const [payInFull, setPayInFull] = useState<boolean>(false); // default 30% deposit
  // Validation state
  const [errors, setErrors] = useState<{
    court?: string;
    date?: string;
    range?: string;
    daysOfWeek?: string;
    timeStart?: string;
    timeEnd?: string;
  }>({});
  // Selection flags to ensure user confirmation
  const [hasSelectedDate, setHasSelectedDate] = useState(false);
  const [hasSelectedRangeStart, setHasSelectedRangeStart] = useState(false);
  const [hasSelectedRangeEnd, setHasSelectedRangeEnd] = useState(false);
  const [hasSelectedStartTime, setHasSelectedStartTime] = useState(false);
  const [hasSelectedEndTime, setHasSelectedEndTime] = useState(false);
  // time drawer
  const [timeDrawerVisible, setTimeDrawerVisible] = useState(false);
  const timeSlide = useState(new Animated.Value(1000))[0];
  const timeFade = useState(new Animated.Value(0))[0];
  const [timeType, setTimeType] = useState<"start" | "end" | null>(null);
  const [tempTime, setTempTime] = useState<Date>(new Date());
  // Date drawer (single or range parts)
  const [dateDrawerVisible, setDateDrawerVisible] = useState(false);
  const dateSlide = useState(new Animated.Value(1000))[0];
  const dateFade = useState(new Animated.Value(0))[0];
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [dateMode, setDateMode] = useState<
    "single" | "rangeStart" | "rangeEnd"
  >("single");

  const openDateDrawer = (
    mode: "single" | "rangeStart" | "rangeEnd",
    initial: Date
  ) => {
    setDateMode(mode);
    setTempDate(initial);
    setDateDrawerVisible(true);
    Animated.parallel([
      Animated.timing(dateSlide, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(dateFade, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  };
  const closeSingleDateDrawer = () => {
    Animated.parallel([
      Animated.timing(dateSlide, {
        toValue: 1000,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(dateFade, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => setDateDrawerVisible(false));
  };
  const confirmSingleDateDrawer = () => {
    if (dateMode === "single") setCreateDate(tempDate);
    if (dateMode === "rangeStart") {
      setRangeStart(tempDate);
    }
    if (dateMode === "rangeEnd") {
      setRangeEnd(tempDate);
    }
    setErrors((prev) => ({
      ...prev,
      date: dateMode === "single" ? undefined : prev.date,
      range: dateMode !== "single" ? undefined : prev.range,
    }));
    closeSingleDateDrawer();
  };

  const openTimeDrawer = (type: "start" | "end", initial: Date) => {
    setTimeType(type);
    setTempTime(initial);
    setTimeDrawerVisible(true);
    Animated.parallel([
      Animated.timing(timeSlide, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(timeFade, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  };
  const closeTimeDrawer = () => {
    Animated.parallel([
      Animated.timing(timeSlide, {
        toValue: 1000,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(timeFade, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeDrawerVisible(false);
      setTimeType(null);
    });
  };
  const confirmTimeDrawer = () => {
    const rounded = roundToMinutes(tempTime, 15);
    if (timeType === "start") {
      setCreateStartTime(rounded);
    }
    if (timeType === "end") {
      setCreateEndTime(rounded);
    }
    setErrors((prev) => ({
      ...prev,
      timeStart: undefined,
      timeEnd: undefined,
    }));
    closeTimeDrawer();
  };

  // Reset form when tab loses focus
  useFocusEffect(
    useCallback(() => {
      return () => {
        setCreateCourtId("");
        setCreateMode("1");
        const now = new Date();
        setCreateDate(now);
        setRangeStart(now);
        setRangeEnd(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
        setSelectedDaysOfWeek([]);
        setCreateStartTime(roundToMinutes(now, 15));
        setCreateEndTime(
          roundToMinutes(new Date(Date.now() + 60 * 60 * 1000), 15)
        );
        setDateDrawerVisible(false);
        setTimeDrawerVisible(false);
        setQrDrawerVisible(false);
        setBookingDetail(null);
        setQrExpired(false);
        setRemainingMs(0);
        setErrors({});
        setHasSelectedDate(false);
        setHasSelectedRangeStart(false);
        setHasSelectedRangeEnd(false);
        setHasSelectedStartTime(false);
        setHasSelectedEndTime(false);
      };
    }, [])
  );

  // QR drawer state
  const [qrDrawerVisible, setQrDrawerVisible] = useState(false);
  const qrSlide = useState(new Animated.Value(1000))[0];
  const qrFade = useState(new Animated.Value(0))[0];
  const [bookingDetail, setBookingDetail] = useState<any>(null);
  const [remainingMs, setRemainingMs] = useState<number>(0);
  const [qrExpired, setQrExpired] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoadingCourts(true);
        const res = await courtScheduleService.listCourts();
        const data = (res?.data || []) as {
          id: string;
          name: string;
          imageUrl?: string | null;
          courtAreaId?: number | null;
          courtAreaName?: string | null;
          note?: string | null;
          status?: string | null;
        }[];
        setCourts(data);
      } finally {
        setLoadingCourts(false);
      }
    })();
  }, []);

  // Set default selected court after courts are loaded
  useEffect(() => {
    if (!createCourtId && courts[0]?.id) {
      setCreateCourtId(courts[0].id);
    }
  }, [courts, createCourtId]);

  const submitCreate = async () => {
    // Validate
    const nextErrors: {
      court?: string;
      date?: string;
      range?: string;
      daysOfWeek?: string;
      timeStart?: string;
      timeEnd?: string;
    } = {};

    if (!createCourtId) nextErrors.court = "Bạn phải chọn sân";

    if (createMode === "1") {
      if (!createDate) nextErrors.date = "Bạn phải chọn ngày";
      if (!createStartTime) nextErrors.timeStart = "Chọn thời gian bắt đầu";
      if (!createEndTime) nextErrors.timeEnd = "Chọn thời gian kết thúc";
      if (
        createStartTime &&
        createEndTime &&
        createStartTime >= createEndTime
      ) {
        nextErrors.timeEnd = "Thời gian kết thúc phải sau thời gian bắt đầu";
      }
    } else {
      if (!rangeStart || !rangeEnd)
        nextErrors.range = "Bạn phải chọn khoảng ngày";
      if (rangeStart && rangeEnd && rangeStart > rangeEnd)
        nextErrors.range = "Ngày bắt đầu phải trước ngày kết thúc";
      if (selectedDaysOfWeek.length === 0)
        nextErrors.daysOfWeek = "Bạn phải chọn các ngày trong tuần";
      if (!createStartTime) nextErrors.timeStart = "Chọn thời gian bắt đầu";
      if (!createEndTime) nextErrors.timeEnd = "Chọn thời gian kết thúc";
      if (
        createStartTime &&
        createEndTime &&
        createStartTime >= createEndTime
      ) {
        nextErrors.timeEnd = "Thời gian kết thúc phải sau thời gian bắt đầu";
      }
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    try {
      setCreating(true);
      const payload = (
        createMode === "1"
          ? {
              userId: user?.userId,
              courtId: createCourtId,
              startDate: new Date(formatYMD(createDate)),
              endDate: new Date(formatYMD(createDate)),
              startTime: formatHHmmss(createStartTime),
              endTime: formatHHmmss(createEndTime),
              payInFull: payInFull,
            }
          : {
              userId: user?.userId,
              courtId: createCourtId,
              startDate: new Date(formatYMD(rangeStart)),
              endDate: new Date(formatYMD(rangeEnd)),
              startTime: formatHHmmss(createStartTime),
              endTime: formatHHmmss(createEndTime),
              daysOfWeek: selectedDaysOfWeek,
              payInFull: payInFull,
            }
      ) as any;
      const res = await courtScheduleService.userCreateBooking(payload);
      if (res?.data) {
        setBookingDetail(res.data);
        setQrExpired(false);
        if (res.data?.expiresAtUtc) {
          const expiry = new Date(res.data.expiresAtUtc as any).getTime();
          setRemainingMs(Math.max(0, expiry - Date.now()));
        } else {
          setRemainingMs(0);
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
      }
    } catch (err: any) {
      const message =
        (err && (err.message as string)) ||
        (err?.response?.data?.message as string) ||
        "Đặt sân thất bại. Vui lòng thử lại.";
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  // countdown
  useEffect(() => {
    if (!qrDrawerVisible || !bookingDetail?.expiresAtUtc) {
      setRemainingMs(0);
      setQrExpired(false);
      return;
    }

    setQrExpired(false);
    const expiry = new Date(bookingDetail.expiresAtUtc as any).getTime();
    let intervalId: ReturnType<typeof setInterval>;

    const updateRemaining = () => {
      const diff = expiry - Date.now();
      if (diff <= 0) {
        setRemainingMs(0);
        setQrExpired(true);
        if (intervalId) clearInterval(intervalId);
      } else {
        setRemainingMs(diff);
      }
    };

    updateRemaining();
    intervalId = setInterval(updateRemaining, 1000);
    return () => clearInterval(intervalId);
  }, [qrDrawerVisible, bookingDetail?.expiresAtUtc]);

  // SignalR updates
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
    })();
    connection.on("paymentUpdated", (paymentId: string) => {
      if (paymentId === bookingDetail.paymentId) {
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
          setQrExpired(false);
          setRemainingMs(0);
          toast.success("Đặt sân thành công");
          router.push("/");
        });
      }
    });
    return () => {
      alive = false;
      connection.stop().catch(() => {});
    };
  }, [qrDrawerVisible, bookingDetail?.paymentId, qrSlide, qrFade, router]);

  const downloadQr = () => {
    if (qrExpired) return;
    const url = bookingDetail?.qrUrl as string | undefined;
    if (!url) return;
    Linking.openURL(url).catch(() => {});
  };
  const openMBBank = () => {
    if (qrExpired) return;
    const ba = "VQRQAEMLF5363@mb";
    const am = Math.round(bookingDetail?.paymentAmount || 0);
    const tn = bookingDetail?.paymentId || "";
    const url = `mbbank://pay?ba=${encodeURIComponent(
      ba
    )}&am=${am}&tn=${encodeURIComponent(tn)}`;
    Linking.openURL(url).catch(() => {});
  };

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
        <Text
          style={{ fontSize: 18, fontWeight: "700", color: textColor, flex: 1 }}
        >
          Đặt sân cầu lông
        </Text>
        <Pressable onPress={submitCreate} disabled={creating}>
          <Text
            style={{
              color: creating ? subTextColor : "#3b82f6",
              fontWeight: "600",
              fontSize: 16,
            }}
          >
            {creating ? "Đang đặt..." : "Đặt"}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
      >
        {/* Court */}
        <View style={{ marginBottom: 16 }}>
          <Text
            style={{ color: textColor, fontWeight: "600", marginBottom: 8 }}
          >
            Chọn sân
          </Text>
          {loadingCourts ? (
            <ActivityIndicator
              size="small"
              color={colorScheme === "dark" ? "#60a5fa" : "#2563eb"}
            />
          ) : courts.length === 0 ? (
            <Text style={{ color: subTextColor }}>Không có sân</Text>
          ) : (
            <>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                }}
              >
                {courts.map((c) => {
                  const active = createCourtId === c.id;
                  const areaLabel = c.courtAreaName || "";
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => setCreateCourtId(c.id)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      style={{
                        width: "48%",
                        marginBottom: 12,
                        height: 96,
                        borderWidth: 1,
                        borderColor: active ? "#3b82f6" : cardBorder,
                        borderRadius: 12,
                        backgroundColor: active
                          ? colorScheme === "dark"
                            ? "#0b203d"
                            : "#eff6ff"
                          : cardBg,
                        padding: 12,
                        justifyContent: "center",
                        alignItems: "flex-start",
                      }}
                    >
                      <Text
                        style={{
                          color: textColor,
                          fontWeight: "700",
                          fontSize: 16,
                        }}
                      >
                        {c.name}
                      </Text>
                      {!!areaLabel && (
                        <Text
                          style={{
                            color: subTextColor,
                            marginTop: 4,
                            fontSize: 13,
                          }}
                        >
                          {areaLabel}
                        </Text>
                      )}
                      {active ? (
                        <View
                          style={{ position: "absolute", top: 8, right: 8 }}
                        >
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color="#3b82f6"
                          />
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
              {errors.court ? (
                <Text style={{ color: "#ef4444", marginTop: 6 }}>
                  {errors.court}
                </Text>
              ) : null}
            </>
          )}
        </View>

        {/* Mode */}
        <View style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable
              onPress={() => setCreateMode("1")}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderWidth: 1,
                borderColor: createMode === "1" ? "#3b82f6" : cardBorder,
                borderRadius: 10,
                backgroundColor:
                  createMode === "1"
                    ? colorScheme === "dark"
                      ? "#0b203d"
                      : "#eff6ff"
                    : cardBg,
              }}
            >
              <Text style={{ color: textColor, fontWeight: "600" }}>
                Đặt lịch vãng lai
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setCreateMode("2")}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderWidth: 1,
                borderColor: createMode === "2" ? "#3b82f6" : cardBorder,
                borderRadius: 10,
                backgroundColor:
                  createMode === "2"
                    ? colorScheme === "dark"
                      ? "#0b203d"
                      : "#eff6ff"
                    : cardBg,
              }}
            >
              <Text style={{ color: textColor, fontWeight: "600" }}>
                Đặt lịch cố định
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Date/Range */}
        {createMode === "1" ? (
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{ color: textColor, fontWeight: "600", marginBottom: 8 }}
            >
              Ngày
            </Text>
            <Pressable
              onPress={() => openDateDrawer("single", createDate)}
              style={{
                borderWidth: 1,
                borderColor: errors.date ? "#ef4444" : cardBorder,
                borderRadius: 10,
                padding: 12,
              }}
            >
              <Text style={{ color: textColor }}>{formatDate(createDate)}</Text>
            </Pressable>
            {errors.date ? (
              <Text style={{ color: "#ef4444", marginTop: 6 }}>
                {errors.date}
              </Text>
            ) : null}
            {/* date selection moved to drawer below */}
          </View>
        ) : (
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{ color: textColor, fontWeight: "600", marginBottom: 8 }}
            >
              Khoảng ngày
            </Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Pressable
                  onPress={() => openDateDrawer("rangeStart", rangeStart)}
                  style={{
                    borderWidth: 1,
                    borderColor: errors.range ? "#ef4444" : cardBorder,
                    borderRadius: 10,
                    padding: 12,
                  }}
                >
                  <Text style={{ color: textColor }}>
                    {formatDate(rangeStart)}
                  </Text>
                </Pressable>
              </View>
              <View style={{ flex: 1 }}>
                <Pressable
                  onPress={() => openDateDrawer("rangeEnd", rangeEnd)}
                  style={{
                    borderWidth: 1,
                    borderColor: errors.range ? "#ef4444" : cardBorder,
                    borderRadius: 10,
                    padding: 12,
                  }}
                >
                  <Text style={{ color: textColor }}>
                    {formatDate(rangeEnd)}
                  </Text>
                </Pressable>
              </View>
            </View>
            {/* range date selection moved to drawer below */}
            {errors.range ? (
              <Text style={{ color: "#ef4444", marginTop: 6 }}>
                {errors.range}
              </Text>
            ) : null}

            {/* days chips */}
            <View
              style={{
                marginTop: 12,
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              {[
                { label: "T2", val: 2 },
                { label: "T3", val: 3 },
                { label: "T4", val: 4 },
                { label: "T5", val: 5 },
                { label: "T6", val: 6 },
                { label: "T7", val: 7 },
                { label: "CN", val: 8 },
              ].map((d) => {
                const active = selectedDaysOfWeek.includes(d.val);
                return (
                  <Pressable
                    key={d.val}
                    onPress={() =>
                      setSelectedDaysOfWeek((prev) => {
                        const next = active
                          ? prev.filter((x) => x !== d.val)
                          : [...prev, d.val];
                        setErrors((e) => ({ ...e, daysOfWeek: undefined }));
                        return next;
                      })
                    }
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderWidth: 1,
                      borderColor: active
                        ? "#3b82f6"
                        : errors.daysOfWeek
                        ? "#ef4444"
                        : cardBorder,
                      borderRadius: 16,
                      backgroundColor: active
                        ? colorScheme === "dark"
                          ? "#0b203d"
                          : "#eff6ff"
                        : cardBg,
                    }}
                  >
                    <Text style={{ color: textColor, fontWeight: "600" }}>
                      {d.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {errors.daysOfWeek ? (
              <Text style={{ color: "#ef4444", marginTop: 6 }}>
                {errors.daysOfWeek}
              </Text>
            ) : null}
          </View>
        )}

        {/* Time */}
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text
              style={{ color: textColor, fontWeight: "600", marginBottom: 8 }}
            >
              Thời gian bắt đầu
            </Text>
            <Pressable
              onPress={() => openTimeDrawer("start", createStartTime)}
              style={{
                borderWidth: 1,
                borderColor: errors.timeStart ? "#ef4444" : cardBorder,
                borderRadius: 10,
                padding: 12,
              }}
            >
              <Text style={{ color: textColor }}>
                {formatTime(formatHHmmss(createStartTime))}
              </Text>
            </Pressable>
            {errors.timeStart ? (
              <Text style={{ color: "#ef4444", marginTop: 6 }}>
                {errors.timeStart}
              </Text>
            ) : null}
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{ color: textColor, fontWeight: "600", marginBottom: 8 }}
            >
              Thời gian kết thúc
            </Text>
            <Pressable
              onPress={() => openTimeDrawer("end", createEndTime)}
              style={{
                borderWidth: 1,
                borderColor: errors.timeEnd ? "#ef4444" : cardBorder,
                borderRadius: 10,
                padding: 12,
              }}
            >
              <Text style={{ color: textColor }}>
                {formatTime(formatHHmmss(createEndTime))}
              </Text>
            </Pressable>
            {errors.timeEnd ? (
              <Text style={{ color: "#ef4444", marginTop: 6 }}>
                {errors.timeEnd}
              </Text>
            ) : null}
          </View>
        </View>
      </ScrollView>

      {/* Payment Section */}
      <View
        style={{ paddingHorizontal: 16, paddingBottom: 16, paddingTop: 16 }}
      >
        <Text style={{ color: textColor, fontWeight: "600", marginBottom: 8 }}>
          Thông tin thanh toán
        </Text>
        <Pressable
          onPress={() => setPayInFull((prev) => !prev)}
          style={{
            borderWidth: 1,
            borderColor: payInFull ? "#3b82f6" : cardBorder,
            backgroundColor: payInFull
              ? colorScheme === "dark"
                ? "#0b203d"
                : "#eff6ff"
              : cardBg,
            borderRadius: 10,
            paddingVertical: 12,
            paddingHorizontal: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Ionicons
            name={payInFull ? "checkbox" : "square-outline"}
            size={18}
            color={payInFull ? "#3b82f6" : subTextColor}
          />
          <Text style={{ color: textColor, fontWeight: "600" }}>
            Thanh toán toàn bộ
          </Text>
        </Pressable>
        <Text style={{ color: subTextColor, marginTop: 6, fontSize: 12 }}>
          {payInFull
            ? "Bạn sẽ thanh toán toàn bộ số tiền."
            : "Mặc định chỉ thanh toán cọc trước 30%."}
        </Text>
      </View>

      {/* QR Drawer */}
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
          ]).start(() => {
            setQrDrawerVisible(false);
            setBookingDetail(null);
            setQrExpired(false);
            setRemainingMs(0);
          });
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
              ]).start(() => {
                setQrDrawerVisible(false);
                setBookingDetail(null);
                setQrExpired(false);
                setRemainingMs(0);
              });
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
              {bookingDetail?.expiresAtUtc ? (
                <View
                  style={{
                    padding: 10,
                    borderWidth: 1,
                    borderColor: qrExpired ? "#fecaca" : "#fde68a",
                    backgroundColor: qrExpired ? "#fef2f2" : "#fffbeb",
                    borderRadius: 8,
                  }}
                >
                  <Text
                    style={{
                      color: qrExpired ? "#b91c1c" : "#92400e",
                      fontWeight: "700",
                      textAlign: "center",
                    }}
                  >
                    {qrExpired
                      ? "QR Code đã hết hạn. Vui lòng đặt lại hoặc liên hệ quầy để nhận mã mới."
                      : `Thời gian giữ chỗ còn lại: ${Math.floor(
                          remainingMs / 1000 / 60
                        )}:${String(
                          Math.floor((remainingMs / 1000) % 60)
                        ).padStart(2, "0")}`}
                  </Text>
                </View>
              ) : null}
              <View style={{ alignItems: "center" }}>
                {qrExpired ? (
                  <View
                    style={{
                      padding: 20,
                      borderWidth: 1,
                      borderColor: "#fca5a5",
                      backgroundColor: "#fee2e2",
                      borderRadius: 12,
                    }}
                  >
                    <Text
                      style={{
                        color: "#b91c1c",
                        fontWeight: "600",
                        textAlign: "center",
                      }}
                    >
                      Mã thanh toán đã hết hạn.
                    </Text>
                    <Text
                      style={{
                        color: "#7f1d1d",
                        fontSize: 12,
                        marginTop: 8,
                        textAlign: "center",
                      }}
                    >
                      Vui lòng tạo yêu cầu thanh toán mới để tiếp tục.
                    </Text>
                  </View>
                ) : bookingDetail?.qrUrl ? (
                  <Image
                    source={{ uri: bookingDetail.qrUrl }}
                    style={{ width: 260, height: 260, borderRadius: 12 }}
                  />
                ) : (
                  <Text style={{ color: subTextColor }}>Không có QR</Text>
                )}
                {!qrExpired && (
                  <>
                    <Text style={{ color: textColor, marginTop: 8 }}>
                      Mã thanh toán: {bookingDetail?.paymentId ?? "-"}
                    </Text>
                    <Text
                      style={{
                        color: textColor,
                        marginTop: 4,
                        fontWeight: "700",
                      }}
                    >
                      Số tiền:{" "}
                      {(bookingDetail?.paymentAmount ?? 0).toLocaleString(
                        "vi-VN"
                      )}{" "}
                      đ
                    </Text>
                  </>
                )}
              </View>
              {!qrExpired && (
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
              )}
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Single Date Picker Drawer */}
      <Modal
        visible={dateDrawerVisible}
        animationType="none"
        transparent
        onRequestClose={closeSingleDateDrawer}
        statusBarTranslucent
      >
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
            opacity: dateFade,
          }}
        >
          <Pressable style={{ flex: 1 }} onPress={closeSingleDateDrawer} />
          <Animated.View
            style={{
              backgroundColor: cardBg,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingBottom: Math.max(insets.bottom, 20),
              maxHeight: "80%",
              minHeight: "40%",
              transform: [{ translateY: dateSlide }],
            }}
          >
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
              <Pressable onPress={closeSingleDateDrawer}>
                <Text
                  style={{ color: "#ef4444", fontWeight: "600", fontSize: 16 }}
                >
                  Huỷ
                </Text>
              </Pressable>
              <Text
                style={{ fontSize: 18, fontWeight: "700", color: textColor }}
              >
                {dateMode === "single"
                  ? "Chọn ngày"
                  : dateMode === "rangeStart"
                  ? "Chọn ngày bắt đầu"
                  : "Chọn ngày kết thúc"}
              </Text>
              <Pressable onPress={confirmSingleDateDrawer}>
                <Text
                  style={{ color: "#3b82f6", fontWeight: "600", fontSize: 16 }}
                >
                  Xong
                </Text>
              </Pressable>
            </View>
            <View style={{ padding: 16, alignItems: "center" }}>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(_, d) => d && setTempDate(d)}
                style={{ width: "100%", height: 216, alignSelf: "center" }}
              />
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Time Picker Drawer */}
      <Modal
        visible={timeDrawerVisible}
        animationType="none"
        transparent
        onRequestClose={closeTimeDrawer}
        statusBarTranslucent
      >
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
            opacity: timeFade,
          }}
        >
          <Pressable style={{ flex: 1 }} onPress={closeTimeDrawer} />
          <Animated.View
            style={{
              backgroundColor: cardBg,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingBottom: Math.max(insets.bottom, 20),
              maxHeight: "80%",
              minHeight: "40%",
              transform: [{ translateY: timeSlide }],
            }}
          >
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
              <Pressable onPress={closeTimeDrawer}>
                <Text
                  style={{ color: "#ef4444", fontWeight: "600", fontSize: 16 }}
                >
                  Huỷ
                </Text>
              </Pressable>
              <Text
                style={{ fontSize: 18, fontWeight: "700", color: textColor }}
              >
                {timeType === "start"
                  ? "Chọn thời gian bắt đầu"
                  : "Chọn thời gian kết thúc"}
              </Text>
              <Pressable onPress={confirmTimeDrawer}>
                <Text
                  style={{ color: "#3b82f6", fontWeight: "600", fontSize: 16 }}
                >
                  Xong
                </Text>
              </Pressable>
            </View>
            <View style={{ padding: 16 }}>
              <View style={{ alignItems: "center" }}>
                <DateTimePicker
                  value={tempTime}
                  mode="time"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(_, d) => d && setTempTime(d)}
                  style={{ width: "100%", height: 216, alignSelf: "center" }}
                />
              </View>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
}
