import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  useColorScheme,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { blogService, ListBlogResponse } from "../../services/blogService";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const formatDate = (date?: Date) => {
  if (!date) return "";
  const d = new Date(date);
  const day = `${d.getDate()}`.padStart(2, "0");
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const stripHtml = (html?: string | null) => {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").substring(0, 150) + "...";
};

export default function Blogs() {
  const [blogs, setBlogs] = useState<ListBlogResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const backgroundColor = colorScheme === "dark" ? "#000000" : "#ffffff";
  const textColor = colorScheme === "dark" ? "#ffffff" : "#000000";
  const subTextColor = colorScheme === "dark" ? "#9ca3af" : "#6b7280";
  const cardBg = colorScheme === "dark" ? "#1f2937" : "#ffffff";
  const cardBorder = colorScheme === "dark" ? "#374151" : "#e5e7eb";

  const fetchBlogs = async () => {
    try {
      const res = await blogService.listBlog({});
      if (res?.data) {
        setBlogs(res.data);
      }
    } catch (error) {
      console.error("Error fetching blogs:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBlogs();
  };

  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor, justifyContent: "center", alignItems: "center" }}
        edges={["top"]}
      >
        <ActivityIndicator size="large" color={colorScheme === "dark" ? "#60a5fa" : "#2563eb"} />
      </SafeAreaView>
    );
  }

  if (blogs.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor }} edges={["top"]}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <Ionicons name="document-text-outline" size={64} color={subTextColor} />
          <Text style={{ color: subTextColor, marginTop: 16, fontSize: 16 }}>
            Chưa có bài viết nào
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }} edges={["top"]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {blogs.map((blog) => (
          <Pressable
            key={blog.id}
            onPress={() => router.push(`/blogs/${blog.id}`)}
            style={{
              backgroundColor: cardBg,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: cardBorder,
              overflow: "hidden",
            }}
          >
            {blog.imageUrl ? (
              <Image
                source={{ uri: blog.imageUrl }}
                style={{ width: "100%", height: 200 }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={{
                  width: "100%",
                  height: 200,
                  backgroundColor: cardBorder,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons name="image-outline" size={48} color={subTextColor} />
              </View>
            )}
            <View style={{ padding: 16 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: textColor,
                  marginBottom: 8,
                }}
                numberOfLines={2}
              >
                {blog.title || "Không có tiêu đề"}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: subTextColor,
                  marginBottom: 12,
                  lineHeight: 20,
                }}
                numberOfLines={3}
              >
                {stripHtml(blog.content)}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Ionicons name="calendar-outline" size={16} color={subTextColor} />
                  <Text style={{ fontSize: 12, color: subTextColor }}>
                    {formatDate(blog.createdAt)}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Ionicons name="eye-outline" size={16} color={subTextColor} />
                  <Text style={{ fontSize: 12, color: subTextColor }}>0</Text>
                </View>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

