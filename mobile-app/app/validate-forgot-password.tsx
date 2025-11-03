import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, useColorScheme } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { authService } from "../services/authService";

export default function ValidateForgotPassword() {
  const params = useLocalSearchParams<{ email?: string }>();
  const email = (params?.email as string) || "";
  const [token, setToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const backgroundColor = colorScheme === "dark" ? "#000000" : "#ffffff";
  const textColor = colorScheme === "dark" ? "#ffffff" : "#000000";
  const subTextColor = colorScheme === "dark" ? "#9ca3af" : "#6b7280";
  const inputBg = colorScheme === "dark" ? "#1f2937" : "#ffffff";
  const inputBorder = colorScheme === "dark" ? "#374151" : "#e5e7eb";
  const inputTextColor = colorScheme === "dark" ? "#ffffff" : "#000000";
  const errorBorder = "#ef4444";
  const [error, setError] = useState<string | undefined>(undefined);

  const onSubmit = async () => {
    const trimmed = token.trim();
    if (!trimmed) {
      setError("Mã OTP là bắt buộc");
      return;
    }
    setError(undefined);
    try {
      setSubmitting(true);
      const res = await authService.validateForgotPassword({ email, token: trimmed });
      if (res?.success !== false) {
        Alert.alert("Thành công", "Mật khẩu mới đã được gửi đến email của bạn.", [
          { text: "OK", onPress: () => router.replace("/login") },
        ]);
      }
    } catch (e: unknown) {
      Alert.alert("Lỗi", (e as Error)?.message || "Xác nhận OTP thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor }} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
      <View className="flex-1 justify-center px-6 py-10">
        <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: 8, color: textColor }}>Xác nhận OTP</Text>
        <Text style={{ color: subTextColor, marginBottom: 32, textAlign: "center" }}>Nhập mã OTP đã gửi đến: {email}</Text>

        <View className="gap-4">
          <View>
            <Text style={{ color: subTextColor, marginBottom: 8 }}>Mã OTP</Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: error ? errorBorder : inputBorder,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 18,
                letterSpacing: 4,
                textAlign: "center",
                backgroundColor: inputBg,
                color: inputTextColor,
              }}
              placeholder="Nhập mã 6 ký tự"
              placeholderTextColor={subTextColor}
              autoCapitalize="characters"
              value={token}
              onChangeText={(t) => {
                setToken(t);
                if (error) setError(undefined);
              }}
            />
            {error && <Text style={{ color: errorBorder, fontSize: 12, marginTop: 4 }}>{error}</Text>}
          </View>

          <Pressable onPress={onSubmit} disabled={submitting} className="bg-blue-600 rounded-xl items-center justify-center py-4 mt-2">
            <Text className="text-white text-base font-semibold">{submitting ? "Đang xác nhận..." : "Xác nhận"}</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}


