import { View, Text, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function Store() {
  const colorScheme = useColorScheme();
  const backgroundColor = colorScheme === "dark" ? "#000000" : "#ffffff";
  const textColor = colorScheme === "dark" ? "#ffffff" : "#000000";
  const subTextColor = colorScheme === "dark" ? "#9ca3af" : "#6b7280";
  const accentColor = colorScheme === "dark" ? "#60a5fa" : "#2563eb";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }} edges={["top"]}>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 24,
        }}
      >
        <View
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: accentColor + "20",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <Ionicons name="construct-outline" size={64} color={accentColor} />
        </View>

        <Text
          style={{
            fontSize: 24,
            fontWeight: "700",
            color: textColor,
            marginBottom: 12,
            textAlign: "center",
          }}
        >
          Tính năng đang phát triển
        </Text>

        <Text
          style={{
            fontSize: 16,
            color: subTextColor,
            textAlign: "center",
            lineHeight: 24,
            marginBottom: 32,
          }}
        >
          Tính năng Cửa hàng đang được phát triển và sẽ sớm ra mắt. Vui lòng quay lại sau!
        </Text>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingHorizontal: 16,
            paddingVertical: 8,
            backgroundColor: accentColor + "10",
            borderRadius: 8,
            borderWidth: 1,
            borderColor: accentColor + "30",
          }}
        >
          <Ionicons name="hourglass-outline" size={20} color={accentColor} />
          <Text style={{ fontSize: 14, color: accentColor, fontWeight: "500" }}>
            Đang trong quá trình phát triển
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

