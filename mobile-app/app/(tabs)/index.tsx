import { Text, View, useColorScheme } from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function Index() {
  const { user, loading } = useAuth();
  const colorScheme = useColorScheme();
  const backgroundColor = colorScheme === "dark" ? "#000000" : "#ffffff";
  const textColor = colorScheme === "dark" ? "#ffffff" : "#000000";
  const subTextColor = colorScheme === "dark" ? "#9ca3af" : "#4b5563";

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
        backgroundColor,
      }}
    >
      {loading ? (
        <Text style={{ color: textColor }}>Loading...</Text>
      ) : user ? (
        <>
          <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 8, color: textColor }}>
            Xin chào, {user.fullName}
          </Text>
          <Text style={{ color: subTextColor }}>{user.email}</Text>
        </>
      ) : (
        <Text style={{ color: textColor }}>Chưa đăng nhập</Text>
      )}
    </View>
  );
}
