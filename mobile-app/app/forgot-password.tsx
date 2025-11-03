import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, useColorScheme } from "react-native";
import { useRouter } from "expo-router";
import { authService } from "../services/authService";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const backgroundColor = colorScheme === "dark" ? "#000000" : "#ffffff";
  const textColor = colorScheme === "dark" ? "#ffffff" : "#000000";
  const subTextColor = colorScheme === "dark" ? "#9ca3af" : "#6b7280";
  const inputBg = colorScheme === "dark" ? "#1f2937" : "#ffffff";
  const inputBorder = colorScheme === "dark" ? "#374151" : "#e5e7eb";
  const inputTextColor = colorScheme === "dark" ? "#ffffff" : "#000000";
  const errorBorder = "#ef4444";

  const onSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Email là bắt buộc");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Email không hợp lệ");
      return;
    }
    setError(undefined);
    try {
      setSubmitting(true);
      const res = await authService.forgotPassword({ email: trimmed });
      if (res?.success !== false) {
        Alert.alert("Thành công", "OTP đã được gửi đến email của bạn.", [
          { text: "OK", onPress: () => router.replace({ pathname: "/validate-forgot-password", params: { email: trimmed } }) },
        ]);
      }
    } catch (e: unknown) {
      Alert.alert("Lỗi", (e as Error)?.message || "Gửi OTP thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor }} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
      <View className="flex-1 justify-center px-6 py-10">
        <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: 8, color: textColor }}>Quên mật khẩu</Text>
        <Text style={{ color: subTextColor, marginBottom: 32 }}>Nhập email để nhận OTP đặt lại mật khẩu</Text>

        <View className="gap-4">
          <View>
            <Text style={{ color: subTextColor, marginBottom: 8 }}>Email</Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: error ? errorBorder : inputBorder,
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
                if (error) setError(undefined);
              }}
            />
            {error && <Text style={{ color: errorBorder, fontSize: 12, marginTop: 4 }}>{error}</Text>}
          </View>

          <Pressable onPress={onSubmit} disabled={submitting} className="bg-blue-600 rounded-xl items-center justify-center py-4 mt-2">
            <Text className="text-white text-base font-semibold">{submitting ? "Đang gửi..." : "Gửi OTP"}</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}


