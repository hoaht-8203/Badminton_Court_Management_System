import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  ActivityIndicator,
  useColorScheme,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { blogService, DetailBlogResponse } from "../../services/blogService";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import RenderHTML from "react-native-render-html";

const formatDate = (date?: Date) => {
  if (!date) return "";
  const d = new Date(date);
  const day = `${d.getDate()}`.padStart(2, "0");
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const year = d.getFullYear();
  const hours = `${d.getHours()}`.padStart(2, "0");
  const minutes = `${d.getMinutes()}`.padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

export default function BlogDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const [blog, setBlog] = useState<DetailBlogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const backgroundColor = colorScheme === "dark" ? "#000000" : "#ffffff";
  const textColor = colorScheme === "dark" ? "#ffffff" : "#000000";
  const subTextColor = colorScheme === "dark" ? "#9ca3af" : "#6b7280";
  const cardBg = colorScheme === "dark" ? "#1f2937" : "#ffffff";
  const cardBorder = colorScheme === "dark" ? "#374151" : "#e5e7eb";

  const tagsStyles = {
    body: {
      color: textColor,
      backgroundColor: backgroundColor,
    },
    h1: {
      fontSize: 26,
      fontWeight: "bold",
      color: textColor,
      marginBottom: 10,
    },
    h2: {
      fontSize: 20,
      fontWeight: "600",
      color: textColor,
      marginBottom: 6,
    },
    p: {
      fontSize: 16,
      lineHeight: 24,
      color: textColor,
      marginBottom: 10,
    },
    img: {
      borderRadius: 12,
      marginVertical: 10,
    },
  };

  useEffect(() => {
    if (!id) return;
    const fetchBlog = async () => {
      try {
        const res = await blogService.detailBlog({ id });
        if (res?.data) {
          setBlog(res.data);
        }
      } catch (error) {
        console.error("Error fetching blog:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBlog();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor,
          justifyContent: "center",
          alignItems: "center",
        }}
        edges={["top"]}
      >
        <ActivityIndicator
          size="large"
          color={colorScheme === "dark" ? "#60a5fa" : "#2563eb"}
        />
      </SafeAreaView>
    );
  }

  if (!blog) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor }} edges={["top"]}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
        >
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={subTextColor}
          />
          <Text
            style={{
              color: textColor,
              marginTop: 16,
              fontSize: 16,
              textAlign: "center",
            }}
          >
            Không tìm thấy bài viết hoặc có lỗi xảy ra
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={{
              marginTop: 24,
              paddingVertical: 12,
              paddingHorizontal: 24,
              backgroundColor: colorScheme === "dark" ? "#3b82f6" : "#2563eb",
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "#ffffff", fontWeight: "600" }}>
              Quay lại
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            margin: 0;
            padding: 16px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: ${colorScheme === "dark" ? "#1f2937" : "#ffffff"};
            color: ${colorScheme === "dark" ? "#ffffff" : "#000000"};
          }
          img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
          }
          p {
            line-height: 1.6;
            margin-bottom: 16px;
          }
          h1, h2, h3, h4, h5, h6 {
            margin-top: 24px;
            margin-bottom: 16px;
          }
        </style>
      </head>
      <body>
        ${blog.content || ""}
      </body>
    </html>
  `;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }} edges={["top"]}>
      <View style={{ flex: 1 }}>
        {/* Header với nút back */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: cardBorder,
            backgroundColor: cardBg,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{ padding: 8, marginRight: 8 }}
          >
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </Pressable>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: textColor,
              flex: 1,
            }}
          >
            Chi tiết bài viết
          </Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {/* Blog Image */}
          {blog.imageUrl ? (
            <Image
              source={{ uri: blog.imageUrl }}
              style={{ width: "100%", height: 250 }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                width: "100%",
                height: 250,
                backgroundColor: cardBorder,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="image-outline" size={64} color={subTextColor} />
            </View>
          )}

          {/* Blog Content */}
          <View style={{ padding: 16 }}>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "700",
                color: textColor,
                marginBottom: 16,
              }}
            >
              {blog.title || "Không có tiêu đề"}
            </Text>

            <View
              style={{
                flexDirection: "row",
                gap: 16,
                marginBottom: 24,
                paddingBottom: 16,
                borderBottomWidth: 1,
                borderBottomColor: cardBorder,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={subTextColor}
                />
                <Text style={{ fontSize: 14, color: subTextColor }}>
                  {formatDate(blog.createdAt)}
                </Text>
              </View>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Ionicons name="eye-outline" size={18} color={subTextColor} />
                <Text style={{ fontSize: 14, color: subTextColor }}>
                  0 lượt xem
                </Text>
              </View>
            </View>

            {/* Blog HTML Content */}
            <RenderHTML
              contentWidth={width}
              source={{ html: htmlContent }}
              tagsStyles={tagsStyles as any}
            />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
