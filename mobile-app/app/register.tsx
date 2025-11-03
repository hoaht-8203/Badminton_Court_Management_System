import { useCallback, useState } from "react";
import { Link } from "expo-router";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useFocusEffect } from "@react-navigation/native";

export default function Register() {
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { signUp } = useAuth();
  const colorScheme = useColorScheme();
  const backgroundColor = colorScheme === "dark" ? "#000000" : "#ffffff";
  const textColor = colorScheme === "dark" ? "#ffffff" : "#000000";
  const subTextColor = colorScheme === "dark" ? "#9ca3af" : "#6b7280";
  const inputBg = colorScheme === "dark" ? "#1f2937" : "#ffffff";
  const inputBorder = colorScheme === "dark" ? "#374151" : "#e5e7eb";
  const inputTextColor = colorScheme === "dark" ? "#ffffff" : "#000000";
  const errorBorder = "#ef4444";
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{
    username?: string;
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!username.trim()) newErrors.username = "Tên đăng nhập là bắt buộc";
    if (!fullName.trim()) newErrors.fullName = "Họ và tên là bắt buộc";
    if (!email.trim()) newErrors.email = "Email là bắt buộc";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Email không hợp lệ";
    if (!password.trim()) newErrors.password = "Mật khẩu là bắt buộc";
    if (!confirmPassword.trim())
      newErrors.confirmPassword = "Xác nhận mật khẩu là bắt buộc";
    else if (password !== confirmPassword)
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onRegister = async () => {
    if (!validate()) return;
    try {
      await signUp({ username, fullName, email, password, confirmPassword });
      setUsername("");
      setFullName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setErrors({});
    } catch (error) {
      // Error is already handled by AuthContext with Alert
    }
  };

  useFocusEffect(
    useCallback(() => {
      return () => {
        setUsername("");
        setFullName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
      };
    }, [])
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor }}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      <View className="flex-1 justify-center px-6 py-10">
        <Text
          style={{
            fontSize: 24,
            fontWeight: "700",
            marginBottom: 8,
            color: textColor,
          }}
        >
          Create account
        </Text>
        <Text style={{ color: subTextColor, marginBottom: 32 }}>
          Sign up to get started
        </Text>

        <View className="gap-4">
          <View>
            <Text style={{ color: subTextColor, marginBottom: 8 }}>
              Username
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: errors.username ? errorBorder : inputBorder,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16,
                backgroundColor: inputBg,
                color: inputTextColor,
              }}
              placeholder="yourusername"
              placeholderTextColor={subTextColor}
              autoCapitalize="none"
              autoCorrect={false}
              value={username}
              onChangeText={(t) => {
                setUsername(t);
                if (errors.username)
                  setErrors((p) => ({ ...p, username: undefined }));
              }}
            />
            {errors.username && (
              <Text style={{ color: errorBorder, fontSize: 12, marginTop: 4 }}>
                {errors.username}
              </Text>
            )}
          </View>

          <View>
            <Text style={{ color: subTextColor, marginBottom: 8 }}>
              Full name
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: errors.fullName ? errorBorder : inputBorder,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16,
                backgroundColor: inputBg,
                color: inputTextColor,
              }}
              placeholder="Your Name"
              placeholderTextColor={subTextColor}
              autoCapitalize="words"
              value={fullName}
              onChangeText={(t) => {
                setFullName(t);
                if (errors.fullName)
                  setErrors((p) => ({ ...p, fullName: undefined }));
              }}
            />
            {errors.fullName && (
              <Text style={{ color: errorBorder, fontSize: 12, marginTop: 4 }}>
                {errors.fullName}
              </Text>
            )}
          </View>

          <View>
            <Text style={{ color: subTextColor, marginBottom: 8 }}>Email</Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: errors.email ? errorBorder : inputBorder,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16,
                backgroundColor: inputBg,
                color: inputTextColor,
              }}
              placeholder="you@example.com"
              placeholderTextColor={subTextColor}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (errors.email)
                  setErrors((p) => ({ ...p, email: undefined }));
              }}
            />
            {errors.email && (
              <Text style={{ color: errorBorder, fontSize: 12, marginTop: 4 }}>
                {errors.email}
              </Text>
            )}
          </View>

          <View>
            <Text style={{ color: subTextColor, marginBottom: 8 }}>
              Password
            </Text>
            <View style={{ position: "relative" }}>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: errors.password ? errorBorder : inputBorder,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingRight: 48,
                  paddingVertical: 12,
                  fontSize: 16,
                  backgroundColor: inputBg,
                  color: inputTextColor,
                }}
                placeholder="••••••••"
                placeholderTextColor={subTextColor}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if (errors.password)
                    setErrors((p) => ({ ...p, password: undefined }));
                }}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                accessibilityRole="button"
                accessibilityLabel={
                  showPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"
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
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={subTextColor}
                />
              </Pressable>
            </View>
            {errors.password && (
              <Text style={{ color: errorBorder, fontSize: 12, marginTop: 4 }}>
                {errors.password}
              </Text>
            )}
          </View>

          <View>
            <Text style={{ color: subTextColor, marginBottom: 8 }}>
              Confirm password
            </Text>
            <View style={{ position: "relative" }}>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: errors.confirmPassword
                    ? errorBorder
                    : inputBorder,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingRight: 48,
                  paddingVertical: 12,
                  fontSize: 16,
                  backgroundColor: inputBg,
                  color: inputTextColor,
                }}
                placeholder="••••••••"
                placeholderTextColor={subTextColor}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                value={confirmPassword}
                onChangeText={(t) => {
                  setConfirmPassword(t);
                  if (errors.confirmPassword)
                    setErrors((p) => ({ ...p, confirmPassword: undefined }));
                }}
              />
              <Pressable
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                accessibilityRole="button"
                accessibilityLabel={
                  showConfirmPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"
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
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={subTextColor}
                />
              </Pressable>
            </View>
            {errors.confirmPassword && (
              <Text style={{ color: errorBorder, fontSize: 12, marginTop: 4 }}>
                {errors.confirmPassword}
              </Text>
            )}
          </View>

          <Pressable
            onPress={onRegister}
            className="bg-blue-600 rounded-xl items-center justify-center py-4 mt-2"
          >
            <Text className="text-white text-base font-semibold">
              Create account
            </Text>
          </Pressable>

          <View className="flex-row justify-center items-center mt-6 gap-1">
            <Text style={{ color: subTextColor }}>
              Already have an account?
            </Text>
            <Link href="/login" asChild>
              <Pressable>
                <Text style={{ color: "#3b82f6", fontWeight: "600" }}>
                  Login
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
