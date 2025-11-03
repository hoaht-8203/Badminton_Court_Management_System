import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
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
  const [profileLoading, setProfileLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [fullName, setFullName] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [ward, setWard] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        setProfileLoading(true);
        const res = await authService.myProfile();
        const p = res.data as MyProfileResponse | null;
        if (p) {
          setFullName(p.fullName ?? "");
          setUserName(p.userName ?? "");
          setEmail(p.email ?? "");
          setPhoneNumber(p.phoneNumber ?? "");
          setAddress(p.address ?? "");
          setCity(p.city ?? "");
          setDistrict(p.district ?? "");
          setWard(p.ward ?? "");
          setDateOfBirth(p.dateOfBirth ?? "");
        }
      } catch (e: unknown) {
        Alert.alert(
          "Lỗi",
          (e as Error)?.message || "Không tải được thông tin hồ sơ"
        );
      } finally {
        setProfileLoading(false);
      }
    })();
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        // Đóng date picker khi component mất focus (chuyển tab)
        setShowDatePicker(false);
      };
    }, [])
  );

  const handleLogin = () => {
    router.push("/login");
  };

  const handleLogout = async () => {
    await logout();
  };

  if (loading) {
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

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      const payload: UpdateMyProfileRequest = {
        fullName: fullName || null,
        phoneNumber: phoneNumber || null,
        address: address || null,
        city: city || null,
        district: district || null,
        ward: ward || null,
        dateOfBirth: dateOfBirth || null,
      };
      const res = await authService.updateMyProfile(payload);
      if (res?.success !== false) {
        Alert.alert("Thành công", "Cập nhật hồ sơ thành công!");
        await refresh();
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
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
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
    console.log("go to here");
    const initial = dateOfBirth ? new Date(dateOfBirth) : new Date();
    setTempDate(initial);
    setShowDatePicker(true);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || tempDate;
    setShowDatePicker(Platform.OS === "ios"); // iOS giữ picker mở, Android tự tắt
    setTempDate(currentDate);
    if (event.type === "set" || Platform.OS === "android") {
      setDateOfBirth(formatYMD(currentDate));
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }} edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: Math.max(insets.top, 12),
        }}
      >
        <View className="flex-1 justify-center px-6 py-10">
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

          {/* Thông tin cá nhân */}
          <Text
            style={{
              fontSize: 20,
              fontWeight: "600",
              marginBottom: 12,
              color: textColor,
            }}
          >
            Thông tin cá nhân
          </Text>
          <View className="gap-3">
            <Text style={{ color: subTextColor }}>Họ và tên</Text>
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
              value={fullName}
              onChangeText={setFullName}
              placeholder="Nhập họ và tên"
              placeholderTextColor={subTextColor}
            />

            <Text style={{ color: subTextColor, marginTop: 12 }}>
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
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Nhập số điện thoại"
              placeholderTextColor={subTextColor}
              keyboardType="phone-pad"
            />

            <Text style={{ color: subTextColor, marginTop: 12 }}>Địa chỉ</Text>
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
              value={address}
              onChangeText={setAddress}
              placeholder="Nhập địa chỉ"
              placeholderTextColor={subTextColor}
            />

            <Text style={{ color: subTextColor, marginTop: 12 }}>
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
              value={city}
              onChangeText={setCity}
              placeholder="Nhập thành phố/tỉnh"
              placeholderTextColor={subTextColor}
            />

            <Text style={{ color: subTextColor, marginTop: 12 }}>
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
              value={district}
              onChangeText={setDistrict}
              placeholder="Nhập quận/huyện"
              placeholderTextColor={subTextColor}
            />

            <Text style={{ color: subTextColor, marginTop: 12 }}>
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
              value={ward}
              onChangeText={setWard}
              placeholder="Nhập phường/xã"
              placeholderTextColor={subTextColor}
            />

            <Text style={{ color: subTextColor, marginTop: 12 }}>
              Ngày sinh (YYYY-MM-DD)
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
                value={formatDMYFromYMD(dateOfBirth)}
                editable={false}
                placeholder="VD: 2000-12-31"
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
                    backgroundColor,
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
                      setDateOfBirth(formatYMD(tempDate));
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

            <Pressable
              onPress={handleSaveProfile}
              disabled={savingProfile}
              className="bg-blue-600 rounded-xl items-center justify-center py-4 mt-4"
            >
              <View className="flex-row gap-2">
                <Ionicons name="save" size={20} color="#ffffff" />
                <Text className="text-white text-base font-semibold">
                  {savingProfile ? "Đang lưu..." : "Lưu thay đổi"}
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Đổi mật khẩu */}
          <Text
            style={{
              fontSize: 20,
              fontWeight: "600",
              marginBottom: 12,
              marginTop: 40,
              color: textColor,
            }}
          >
            Đổi mật khẩu
          </Text>
          <View className="gap-3">
            <Text style={{ color: subTextColor }}>Mật khẩu hiện tại</Text>
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
              />
              <Pressable
                onPress={() => setShowOldPassword(!showOldPassword)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "40%",
                  transform: [{ translateY: -10 }],
                  padding: 6,
                }}
                accessibilityRole="button"
                accessibilityLabel={
                  showOldPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"
                }
              >
                <Ionicons
                  name={showOldPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={subTextColor}
                />
              </Pressable>
            </View>

            <Text style={{ color: subTextColor, marginTop: 12 }}>
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
              />
              <Pressable
                onPress={() => setShowNewPassword(!showNewPassword)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "40%",
                  transform: [{ translateY: -10 }],
                  padding: 6,
                }}
                accessibilityRole="button"
                accessibilityLabel={
                  showNewPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"
                }
              >
                <Ionicons
                  name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={subTextColor}
                />
              </Pressable>
            </View>

            <Text style={{ color: subTextColor, marginTop: 12 }}>
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
              />
              <Pressable
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "40%",
                  transform: [{ translateY: -10 }],
                  padding: 6,
                }}
                accessibilityRole="button"
                accessibilityLabel={
                  showConfirmPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"
                }
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={subTextColor}
                />
              </Pressable>
            </View>

            <Pressable
              onPress={handleChangePassword}
              disabled={changingPassword}
              className="bg-blue-600 rounded-xl items-center justify-center py-4 mt-4"
            >
              <View className="flex-row gap-2">
                <Ionicons name="key" size={20} color="#ffffff" />
                <Text className="text-white text-base font-semibold">
                  {changingPassword ? "Đang đổi..." : "Đổi mật khẩu"}
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Logout */}
          <Pressable
            onPress={handleLogout}
            className="bg-red-600 rounded-xl items-center justify-center py-4 mt-10"
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
    </SafeAreaView>
  );
}
