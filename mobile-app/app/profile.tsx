import { View, Text, Pressable, ScrollView } from "react-native";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "expo-router";

export default function Profile() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const handleLogin = () => {
    router.push("/login");
  };

  const handleLogout = async () => {
    await logout();
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <ScrollView
        className="flex-1 bg-white"
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
      >
        <View className="flex-1 justify-center items-center px-6 py-10">
          <Text className="text-xl font-semibold text-gray-900 mb-4 text-center">
            Hãy đăng nhập để sử dụng tính năng này
          </Text>
          <Pressable
            onPress={handleLogin}
            className="bg-blue-600 rounded-xl items-center justify-center py-4 px-8 mt-4"
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
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <View className="flex-1 justify-center px-6 py-10">
        <View className="items-center mb-8">
          <View className="w-24 h-24 bg-blue-600 rounded-full items-center justify-center mb-4">
            <Text className="text-white text-3xl font-bold">
              {user.fullName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            {user.fullName}
          </Text>
          <Text className="text-gray-600 mb-1">{user.email}</Text>
          <View className="flex-row gap-2 mt-2">
            {user.roles.map((role) => (
              <View
                key={role}
                className="bg-blue-100 px-3 py-1 rounded-full"
              >
                <Text className="text-blue-700 text-sm font-medium">
                  {role}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View className="gap-4">
          <Pressable
            onPress={handleLogout}
            className="bg-red-600 rounded-xl items-center justify-center py-4 mt-4"
          >
            <Text className="text-white text-base font-semibold">
              Đăng xuất
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

