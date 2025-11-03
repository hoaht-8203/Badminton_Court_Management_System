import { useCallback, useState } from "react";
import { Link, useRouter } from "expo-router";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  useColorScheme,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );
  const { login } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const backgroundColor = colorScheme === "dark" ? "#000000" : "#ffffff";
  const textColor = colorScheme === "dark" ? "#ffffff" : "#000000";
  const subTextColor = colorScheme === "dark" ? "#9ca3af" : "#6b7280";
  const inputBg = colorScheme === "dark" ? "#1f2937" : "#ffffff";
  const inputBorder = colorScheme === "dark" ? "#374151" : "#e5e7eb";
  const inputTextColor = colorScheme === "dark" ? "#ffffff" : "#000000";
  const errorBorder = "#ef4444";

  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = "Email là bắt buộc";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Email không hợp lệ";
    }

    if (!password.trim()) {
      newErrors.password = "Mật khẩu là bắt buộc";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onLogin = async () => {
    if (!validate()) {
      return;
    }

    try {
      await login({ email, password });
      setEmail("");
      setPassword("");
      setErrors({});
    } catch {
      // Error is already handled by AuthContext with Alert
    }
  };

  useFocusEffect(
    useCallback(() => {
      return () => {
        setEmail("");
        setPassword("");
        setErrors({});
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
          Welcome back
        </Text>
        <Text style={{ color: subTextColor, marginBottom: 32 }}>
          Login to continue
        </Text>

        <View className="gap-4">
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
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) {
                  setErrors((prev) => ({ ...prev, email: undefined }));
                }
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
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) {
                    setErrors((prev) => ({ ...prev, password: undefined }));
                  }
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

          <View className="items-end mt-1">
            <Pressable onPress={() => router.push("/forgot-password")}>
              <Text style={{ color: "#3b82f6", fontWeight: "500" }}>
                Forgot password?
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={onLogin}
            className="bg-blue-600 rounded-xl items-center justify-center py-4 mt-2"
          >
            <Text className="text-white text-base font-semibold">Login</Text>
          </Pressable>

          <View className="flex-row justify-center items-center mt-6 gap-1">
            <Text style={{ color: subTextColor }}>
              Don&apos;t have an account?
            </Text>
            <Link href="/register" asChild>
              <Pressable>
                <Text style={{ color: "#3b82f6", fontWeight: "600" }}>
                  Register
                </Text>
              </Pressable>
            </Link>
          </View>

          <View className="flex-row justify-center items-center mt-3">
            <Pressable
              onPress={() => router.replace("/")}
              className="px-4 py-2"
            >
              <Text style={{ color: subTextColor, fontWeight: "500" }}>
                Về trang chủ
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
