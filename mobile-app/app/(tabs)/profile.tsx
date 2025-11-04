import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import {
  authService,
  MyProfileResponse,
  UpdateMyProfileRequest,
  UpdatePasswordRequest,
} from "../../services/authService";

export default function Profile() {
  const { user, loading, logout, refresh } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const backgroundColor = colorScheme === "dark" ? "#000000" : "#ffffff";
  const textColor = colorScheme === "dark" ? "#ffffff" : "#000000";
  const subTextColor = colorScheme === "dark" ? "#9ca3af" : "#6b7280";
  const inputBg = colorScheme === "dark" ? "#1f2937" : "#ffffff";
  const inputBorder = colorScheme === "dark" ? "#374151" : "#e5e7eb";
  const inputTextColor = colorScheme === "dark" ? "#ffffff" : "#000000";
  const cardBg = colorScheme === "dark" ? "#1f2937" : "#ffffff";
  const cardBorder = colorScheme === "dark" ? "#374151" : "#e5e7eb";

  const [profileLoading, setProfileLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [editDrawerVisible, setEditDrawerVisible] = useState(false);
  const [passwordDrawerVisible, setPasswordDrawerVisible] = useState(false);
  const slideAnim = useState(new Animated.Value(1000))[0];
  const fadeAnim = useState(new Animated.Value(0))[0];
  const passwordSlideAnim = useState(new Animated.Value(1000))[0];
  const passwordFadeAnim = useState(new Animated.Value(0))[0];

  // Profile data for display (read-only)
  const [profileData, setProfileData] = useState<MyProfileResponse | null>(
    null
  );

  // Form data for editing
  const [editFullName, setEditFullName] = useState("");
  const [editPhoneNumber, setEditPhoneNumber] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editDistrict, setEditDistrict] = useState("");
  const [editWard, setEditWard] = useState("");
  const [editDateOfBirth, setEditDateOfBirth] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());

  // Password change form
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      try {
        setProfileLoading(true);
        const res = await authService.myProfile();
        const p = res.data as MyProfileResponse | null;
        if (p) {
          setProfileData(p);
        }
      } catch (e: unknown) {
        Alert.alert(
          "Lỗi",
          (e as Error)?.message || "Không tải được thông tin hồ sơ"
        );
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setShowDatePicker(false);
        setEditDrawerVisible(false);
      };
    }, [])
  );

  const handleOpenEditDrawer = () => {
    if (profileData) {
      setEditFullName(profileData.fullName ?? "");
      setEditPhoneNumber(profileData.phoneNumber ?? "");
      setEditAddress(profileData.address ?? "");
      setEditCity(profileData.city ?? "");
      setEditDistrict(profileData.district ?? "");
      setEditWard(profileData.ward ?? "");
      setEditDateOfBirth(profileData.dateOfBirth ?? "");
      setEditDrawerVisible(true);
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
    }
  };

  const handleCloseEditDrawer = () => {
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
      setEditDrawerVisible(false);
    });
  };

  const handleOpenPasswordDrawer = () => {
    setPasswordDrawerVisible(true);
    // Animate drawer slide up and backdrop fade in
    Animated.parallel([
      Animated.timing(passwordSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(passwordFadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleClosePasswordDrawer = () => {
    // Animate drawer slide down and backdrop fade out
    Animated.parallel([
      Animated.timing(passwordSlideAnim, {
        toValue: 1000,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(passwordFadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setPasswordDrawerVisible(false);
      // Reset password fields
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    });
  };

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      const payload: UpdateMyProfileRequest = {
        fullName: editFullName || null,
        phoneNumber: editPhoneNumber || null,
        address: editAddress || null,
        city: editCity || null,
        district: editDistrict || null,
        ward: editWard || null,
        dateOfBirth: editDateOfBirth || null,
      };
      const res = await authService.updateMyProfile(payload);
      if (res?.success !== false) {
        Alert.alert("Thành công", "Cập nhật hồ sơ thành công!");
        await refresh();
        // Refresh profile data
        const profileRes = await authService.myProfile();
        const p = profileRes.data as MyProfileResponse | null;
        if (p) {
          setProfileData(p);
        }
        setEditDrawerVisible(false);
      }
    } catch (e: unknown) {
      Alert.alert("Lỗi", (e as Error)?.message || "Cập nhật hồ sơ thất bại");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp");
      return;
    }
    try {
      setChangingPassword(true);
      const payload: UpdatePasswordRequest = {
        oldPassword,
        newPassword,
        confirmPassword,
      };
      const res = await authService.updatePassword(payload);
      if (res?.success !== false) {
        Alert.alert("Thành công", "Đổi mật khẩu thành công!");
        handleClosePasswordDrawer();
      }
    } catch (e: unknown) {
      Alert.alert("Lỗi", (e as Error)?.message || "Đổi mật khẩu thất bại");
    } finally {
      setChangingPassword(false);
    }
  };

  const formatYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const formatDMYFromYMD = (ymd: string) => {
    if (!ymd) return "";
    const parts = ymd.split("-");
    if (parts.length !== 3) return ymd;
    const [y, m, d] = parts;
    return `${d}-${m}-${y}`;
  };

  const openDatePicker = () => {
    const initial = editDateOfBirth ? new Date(editDateOfBirth) : new Date();
    setTempDate(initial);
    setShowDatePicker(true);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || tempDate;
    setShowDatePicker(Platform.OS === "ios");
    setTempDate(currentDate);
    if (event.type === "set" || Platform.OS === "android") {
      setEditDateOfBirth(formatYMD(currentDate));
    }
  };

  const handleLogin = () => {
    router.push("/login");
  };

  const handleLogout = async () => {
    await logout();
  };

  if (loading || profileLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor,
        }}
      >
        <Text style={{ color: textColor }}>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor }}
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
      >
        <View className="flex-1 justify-center items-center px-6 py-10">
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              marginBottom: 16,
              color: textColor,
              textAlign: "center",
            }}
          >
            Hãy đăng nhập để sử dụng tính năng này
          </Text>
          <Pressable
            onPress={handleLogin}
            className="bg-blue-600 rounded-xl items-center justify-center py-4 px-8 mt-2"
          >
            <Text className="text-white text-base font-semibold">
              Đăng nhập
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }} edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: 10,
        }}
      >
        <View className="flex-1 justify-center px-6 pb-10">
          {/* Header with Edit Button */}
          <View className="flex-row justify-between items-center mb-8">
            <Text
              style={{
                fontSize: 24,
                fontWeight: "700",
                color: textColor,
              }}
            >
              Thông tin cá nhân
            </Text>
            <Pressable
              onPress={handleOpenEditDrawer}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 12,
                paddingVertical: 8,
                backgroundColor: "#3b82f6",
                borderRadius: 8,
              }}
            >
              <Ionicons name="pencil" size={18} color="#ffffff" />
              <Text
                style={{ color: "#ffffff", fontWeight: "600", fontSize: 14 }}
              >
                Chỉnh sửa
              </Text>
            </Pressable>
          </View>

          {/* Profile Info Display */}
          <View className="items-center mb-8">
            <View className="w-24 h-24 bg-blue-600 rounded-full items-center justify-center mb-4">
              <Text className="text-white text-3xl font-bold">
                {user.fullName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "700",
                marginBottom: 8,
                color: textColor,
              }}
            >
              {user.fullName}
            </Text>
            <Text style={{ color: subTextColor, marginBottom: 4 }}>
              {user.email}
            </Text>
            <View className="flex-row gap-2 mt-2">
              {user.roles.map((role) => (
                <View key={role} className="bg-blue-100 px-3 py-1 rounded-full">
                  <Text className="text-blue-700 text-sm font-medium">
                    {role}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Profile Details */}
          <View
            style={{
              backgroundColor: cardBg,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: cardBorder,
              padding: 16,
              marginBottom: 24,
            }}
          >
            <View style={{ gap: 16 }}>
              <View>
                <Text
                  style={{ fontSize: 12, color: subTextColor, marginBottom: 4 }}
                >
                  Họ và tên
                </Text>
                <Text
                  style={{ fontSize: 16, color: textColor, fontWeight: "500" }}
                >
                  {profileData?.fullName || "-"}
                </Text>
              </View>

              <View style={{ height: 1, backgroundColor: cardBorder }} />

              <View>
                <Text
                  style={{ fontSize: 12, color: subTextColor, marginBottom: 4 }}
                >
                  Số điện thoại
                </Text>
                <Text
                  style={{ fontSize: 16, color: textColor, fontWeight: "500" }}
                >
                  {profileData?.phoneNumber || "-"}
                </Text>
              </View>

              <View style={{ height: 1, backgroundColor: cardBorder }} />

              <View>
                <Text
                  style={{ fontSize: 12, color: subTextColor, marginBottom: 4 }}
                >
                  Địa chỉ
                </Text>
                <Text
                  style={{ fontSize: 16, color: textColor, fontWeight: "500" }}
                >
                  {profileData?.address || "-"}
                </Text>
              </View>

              <View style={{ height: 1, backgroundColor: cardBorder }} />

              <View>
                <Text
                  style={{ fontSize: 12, color: subTextColor, marginBottom: 4 }}
                >
                  Thành phố/Tỉnh
                </Text>
                <Text
                  style={{ fontSize: 16, color: textColor, fontWeight: "500" }}
                >
                  {profileData?.city || "-"}
                </Text>
              </View>

              <View style={{ height: 1, backgroundColor: cardBorder }} />

              <View>
                <Text
                  style={{ fontSize: 12, color: subTextColor, marginBottom: 4 }}
                >
                  Quận/Huyện
                </Text>
                <Text
                  style={{ fontSize: 16, color: textColor, fontWeight: "500" }}
                >
                  {profileData?.district || "-"}
                </Text>
              </View>

              <View style={{ height: 1, backgroundColor: cardBorder }} />

              <View>
                <Text
                  style={{ fontSize: 12, color: subTextColor, marginBottom: 4 }}
                >
                  Phường/Xã
                </Text>
                <Text
                  style={{ fontSize: 16, color: textColor, fontWeight: "500" }}
                >
                  {profileData?.ward || "-"}
                </Text>
              </View>

              <View style={{ height: 1, backgroundColor: cardBorder }} />

              <View>
                <Text
                  style={{ fontSize: 12, color: subTextColor, marginBottom: 4 }}
                >
                  Ngày sinh
                </Text>
                <Text
                  style={{ fontSize: 16, color: textColor, fontWeight: "500" }}
                >
                  {profileData?.dateOfBirth
                    ? formatDMYFromYMD(profileData.dateOfBirth)
                    : "-"}
                </Text>
              </View>
            </View>
          </View>

          {/* Đổi mật khẩu */}
          <Pressable
            onPress={handleOpenPasswordDrawer}
            className="bg-blue-600 rounded-xl items-center justify-center py-4 mt-6"
          >
            <View className="flex-row gap-2">
              <Ionicons name="key" size={20} color="#ffffff" />
              <Text className="text-white text-base font-semibold">
                Đổi mật khẩu
              </Text>
            </View>
          </Pressable>

          {/* Booking History */}
          <Pressable
            onPress={() => router.push("/booking-history")}
            className="bg-green-600 rounded-xl items-center justify-center py-4 mt-6"
          >
            <View className="flex-row gap-2">
              <Ionicons name="calendar" size={20} color="#ffffff" />
              <Text className="text-white text-base font-semibold">
                Xem lịch sử đặt sân và thanh toán
              </Text>
            </View>
          </Pressable>

          {/* Logout */}
          <Pressable
            onPress={handleLogout}
            className="bg-red-600 rounded-xl items-center justify-center py-4 mt-6"
          >
            <View className="flex-row gap-2">
              <Ionicons name="log-out" size={20} color="#ffffff" />
              <Text className="text-white text-base font-semibold">
                Đăng xuất
              </Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>

      {/* Edit Drawer Modal */}
      <Modal
        visible={editDrawerVisible}
        animationType="none"
        transparent={true}
        onRequestClose={handleCloseEditDrawer}
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
          <Pressable style={{ flex: 1 }} onPress={handleCloseEditDrawer} />
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
              <Pressable onPress={handleCloseEditDrawer}>
                <Text
                  style={{ color: "#ef4444", fontWeight: "600", fontSize: 16 }}
                >
                  Huỷ
                </Text>
              </Pressable>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: textColor,
                }}
              >
                Chỉnh sửa thông tin
              </Text>
              <Pressable onPress={handleSaveProfile} disabled={savingProfile}>
                <Text
                  style={{
                    color: savingProfile ? subTextColor : "#3b82f6",
                    fontWeight: "600",
                    fontSize: 16,
                  }}
                >
                  {savingProfile ? "Đang lưu..." : "Lưu"}
                </Text>
              </Pressable>
            </View>

            {/* Form Content */}
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
            >
              <View className="gap-4">
                <View>
                  <Text style={{ color: subTextColor, marginBottom: 8 }}>
                    Họ và tên
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: inputBorder,
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      fontSize: 16,
                      backgroundColor: inputBg,
                      color: inputTextColor,
                    }}
                    value={editFullName}
                    onChangeText={setEditFullName}
                    placeholder="Nhập họ và tên"
                    placeholderTextColor={subTextColor}
                  />
                </View>

                <View>
                  <Text style={{ color: subTextColor, marginBottom: 8 }}>
                    Số điện thoại
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: inputBorder,
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      fontSize: 16,
                      backgroundColor: inputBg,
                      color: inputTextColor,
                    }}
                    value={editPhoneNumber}
                    onChangeText={setEditPhoneNumber}
                    placeholder="Nhập số điện thoại"
                    placeholderTextColor={subTextColor}
                    keyboardType="phone-pad"
                  />
                </View>

                <View>
                  <Text style={{ color: subTextColor, marginBottom: 8 }}>
                    Địa chỉ
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: inputBorder,
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      fontSize: 16,
                      backgroundColor: inputBg,
                      color: inputTextColor,
                    }}
                    value={editAddress}
                    onChangeText={setEditAddress}
                    placeholder="Nhập địa chỉ"
                    placeholderTextColor={subTextColor}
                  />
                </View>

                <View>
                  <Text style={{ color: subTextColor, marginBottom: 8 }}>
                    Thành phố/Tỉnh
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: inputBorder,
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      fontSize: 16,
                      backgroundColor: inputBg,
                      color: inputTextColor,
                    }}
                    value={editCity}
                    onChangeText={setEditCity}
                    placeholder="Nhập thành phố/tỉnh"
                    placeholderTextColor={subTextColor}
                  />
                </View>

                <View>
                  <Text style={{ color: subTextColor, marginBottom: 8 }}>
                    Quận/Huyện
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: inputBorder,
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      fontSize: 16,
                      backgroundColor: inputBg,
                      color: inputTextColor,
                    }}
                    value={editDistrict}
                    onChangeText={setEditDistrict}
                    placeholder="Nhập quận/huyện"
                    placeholderTextColor={subTextColor}
                  />
                </View>

                <View>
                  <Text style={{ color: subTextColor, marginBottom: 8 }}>
                    Phường/Xã
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: inputBorder,
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      fontSize: 16,
                      backgroundColor: inputBg,
                      color: inputTextColor,
                    }}
                    value={editWard}
                    onChangeText={setEditWard}
                    placeholder="Nhập phường/xã"
                    placeholderTextColor={subTextColor}
                  />
                </View>

                <View>
                  <Text style={{ color: subTextColor, marginBottom: 8 }}>
                    Ngày sinh
                  </Text>
                  <Pressable onPress={openDatePicker}>
                    <TextInput
                      onPress={openDatePicker}
                      style={{
                        borderWidth: 1,
                        borderColor: inputBorder,
                        borderRadius: 12,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        fontSize: 16,
                        backgroundColor: inputBg,
                        color: inputTextColor,
                      }}
                      value={formatDMYFromYMD(editDateOfBirth)}
                      editable={false}
                      placeholder="VD: 31-12-2000"
                      placeholderTextColor={subTextColor}
                    />
                  </Pressable>

                  {showDatePicker && Platform.OS === "ios" && (
                    <View
                      style={{
                        marginTop: 8,
                        borderWidth: 1,
                        borderColor: inputBorder,
                        borderRadius: 12,
                        overflow: "hidden",
                      }}
                    >
                      <DateTimePicker
                        value={tempDate}
                        mode="date"
                        display="spinner"
                        onChange={onDateChange}
                      />
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "flex-end",
                          gap: 12,
                          padding: 8,
                          backgroundColor: cardBg,
                        }}
                      >
                        <Pressable
                          onPress={() => setShowDatePicker(false)}
                          style={{ paddingVertical: 8, paddingHorizontal: 12 }}
                        >
                          <Text style={{ color: subTextColor }}>Hủy</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            setEditDateOfBirth(formatYMD(tempDate));
                            setShowDatePicker(false);
                          }}
                          style={{ paddingVertical: 8, paddingHorizontal: 12 }}
                        >
                          <Text style={{ color: "#3b82f6", fontWeight: "600" }}>
                            Xong
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  )}
                  {showDatePicker && Platform.OS === "android" && (
                    <DateTimePicker
                      value={tempDate}
                      mode="date"
                      display="default"
                      onChange={onDateChange}
                    />
                  )}
                </View>
              </View>
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Password Change Drawer Modal */}
      <Modal
        visible={passwordDrawerVisible}
        animationType="none"
        transparent={true}
        onRequestClose={handleClosePasswordDrawer}
        statusBarTranslucent
      >
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "flex-end",
            opacity: passwordFadeAnim,
          }}
        >
          <Pressable style={{ flex: 1 }} onPress={handleClosePasswordDrawer} />
          <Animated.View
            style={{
              backgroundColor: cardBg,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingBottom: Math.max(insets.bottom, 20),
              maxHeight: "95%",
              minHeight: "60%",
              transform: [{ translateY: passwordSlideAnim }],
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
              <Pressable onPress={handleClosePasswordDrawer}>
                <Text
                  style={{ color: "#ef4444", fontWeight: "600", fontSize: 16 }}
                >
                  Huỷ
                </Text>
              </Pressable>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: textColor,
                }}
              >
                Đổi mật khẩu
              </Text>
              <Pressable
                onPress={handleChangePassword}
                disabled={changingPassword}
              >
                <Text
                  style={{
                    color: changingPassword ? subTextColor : "#3b82f6",
                    fontWeight: "600",
                    fontSize: 16,
                  }}
                >
                  {changingPassword ? "Đang lưu..." : "Lưu"}
                </Text>
              </Pressable>
            </View>

            {/* Form Content */}
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
            >
              <View className="gap-4">
                <View>
                  <Text style={{ color: subTextColor, marginBottom: 8 }}>
                    Mật khẩu hiện tại
                  </Text>
                  <View style={{ position: "relative" }}>
                    <TextInput
                      style={{
                        borderWidth: 1,
                        borderColor: inputBorder,
                        borderRadius: 12,
                        paddingHorizontal: 16,
                        paddingRight: 48,
                        paddingVertical: 12,
                        fontSize: 16,
                        backgroundColor: inputBg,
                        color: inputTextColor,
                      }}
                      value={oldPassword}
                      onChangeText={setOldPassword}
                      placeholder="Nhập mật khẩu hiện tại"
                      placeholderTextColor={subTextColor}
                      secureTextEntry={!showOldPassword}
                      autoCapitalize="none"
                    />
                    <Pressable
                      onPress={() => setShowOldPassword(!showOldPassword)}
                      accessibilityRole="button"
                      accessibilityLabel={
                        showOldPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"
                      }
                      style={{
                        position: "absolute",
                        right: 12,
                        top: "40%",
                        transform: [{ translateY: -10 }],
                        padding: 6,
                      }}
                    >
                      <Ionicons
                        name={
                          showOldPassword ? "eye-off-outline" : "eye-outline"
                        }
                        size={20}
                        color={subTextColor}
                      />
                    </Pressable>
                  </View>
                </View>

                <View>
                  <Text style={{ color: subTextColor, marginBottom: 8 }}>
                    Mật khẩu mới
                  </Text>
                  <View style={{ position: "relative" }}>
                    <TextInput
                      style={{
                        borderWidth: 1,
                        borderColor: inputBorder,
                        borderRadius: 12,
                        paddingHorizontal: 16,
                        paddingRight: 48,
                        paddingVertical: 12,
                        fontSize: 16,
                        backgroundColor: inputBg,
                        color: inputTextColor,
                      }}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="Nhập mật khẩu mới"
                      placeholderTextColor={subTextColor}
                      secureTextEntry={!showNewPassword}
                      autoCapitalize="none"
                    />
                    <Pressable
                      onPress={() => setShowNewPassword(!showNewPassword)}
                      accessibilityRole="button"
                      accessibilityLabel={
                        showNewPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"
                      }
                      style={{
                        position: "absolute",
                        right: 12,
                        top: "40%",
                        transform: [{ translateY: -10 }],
                        padding: 6,
                      }}
                    >
                      <Ionicons
                        name={
                          showNewPassword ? "eye-off-outline" : "eye-outline"
                        }
                        size={20}
                        color={subTextColor}
                      />
                    </Pressable>
                  </View>
                </View>

                <View>
                  <Text style={{ color: subTextColor, marginBottom: 8 }}>
                    Xác nhận mật khẩu
                  </Text>
                  <View style={{ position: "relative" }}>
                    <TextInput
                      style={{
                        borderWidth: 1,
                        borderColor: inputBorder,
                        borderRadius: 12,
                        paddingHorizontal: 16,
                        paddingRight: 48,
                        paddingVertical: 12,
                        fontSize: 16,
                        backgroundColor: inputBg,
                        color: inputTextColor,
                      }}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Nhập lại mật khẩu mới"
                      placeholderTextColor={subTextColor}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                    />
                    <Pressable
                      onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      accessibilityRole="button"
                      accessibilityLabel={
                        showConfirmPassword
                          ? "Ẩn mật khẩu"
                          : "Hiển thị mật khẩu"
                      }
                      style={{
                        position: "absolute",
                        right: 12,
                        top: "40%",
                        transform: [{ translateY: -10 }],
                        padding: 6,
                      }}
                    >
                      <Ionicons
                        name={
                          showConfirmPassword
                            ? "eye-off-outline"
                            : "eye-outline"
                        }
                        size={20}
                        color={subTextColor}
                      />
                    </Pressable>
                  </View>
                </View>
              </View>
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
}
