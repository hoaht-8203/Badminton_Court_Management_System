import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "react-native";

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const backgroundColor = colorScheme === "dark" ? "#0b0b0b" : "#ffffff";
  const borderTopColor = colorScheme === "dark" ? "#1f2937" : "#e5e7eb";
  const activeTint = colorScheme === "dark" ? "#60a5fa" : "#2563eb";
  const inactiveTint = colorScheme === "dark" ? "#9ca3af" : "#6b7280";
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeTint,
        tabBarInactiveTintColor: inactiveTint,
        tabBarStyle: { backgroundColor, borderTopColor },
        tabBarLabelStyle: { fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Trang chủ",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          title: "Cửa hàng",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "storefront" : "storefront-outline"}
              color={color}
              size={size}
            />
          ),
        }}
      />
                  <Tabs.Screen
                    name="booking"
                    options={{
                      title: "Đặt sân",
                      tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons
                          name={focused ? "calendar" : "calendar-outline"}
                          color={color}
                          size={size}
                        />
                      ),
                    }}
                  />
      <Tabs.Screen
        name="blogs"
        options={{
          title: "Bài viết",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "document-text" : "document-text-outline"}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Hồ sơ",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}
