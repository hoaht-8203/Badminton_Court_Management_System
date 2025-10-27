"use client";

import { ListBlogResponse } from "@/types-openapi/api";
import { CalendarOutlined, EyeOutlined } from "@ant-design/icons";
import { Card, Col, Row, Spin, Typography } from "antd";
import dayjs from "dayjs";
import Image from "next/image";
import Link from "next/link";

const { Title, Text, Paragraph } = Typography;

interface BlogsProps {
  blogs: ListBlogResponse[];
  isLoading?: boolean;
  limit?: number;
}

const Blogs = ({ blogs, isLoading = false, limit = 6 }: BlogsProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spin size="large" />
      </div>
    );
  }

  if (!blogs || blogs.length === 0) {
    return (
      <div className="py-8 text-center">
        <Text type="secondary">Chưa có bài viết nào</Text>
      </div>
    );
  }

  return (
    <div className="py-8">
      <Row gutter={[24, 24]}>
        {blogs.map((blog) => (
          <Col key={blog.id} xs={24} sm={12} lg={8}>
            <Link href={`/homepage/blogs/${blog.id}`}>
              <Card
                hoverable
                cover={
                  blog.imageUrl ? (
                    <div className="relative h-48 w-full overflow-hidden">
                      <Image
                        src={blog.imageUrl}
                        alt={blog.title ?? "Blog thumbnail"}
                        fill
                        className="object-cover transition-transform duration-300 hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                  ) : (
                    <div className="flex h-48 w-full items-center justify-center bg-gray-100">
                      <Text type="secondary">Không có hình ảnh</Text>
                    </div>
                  )
                }
                className="h-full"
                styles={{ body: { padding: "16px" } }}
              >
                <div className="flex h-full flex-col">
                  <Title level={4} className="mb-2 line-clamp-2" style={{ fontSize: "16px", marginBottom: "8px" }}>
                    {blog.title}
                  </Title>

                  <div className="flex flex-col">
                    <div className="line-clamp-3 flex-1 text-gray-600" style={{ marginBottom: "12px", fontSize: "14px" }}>
                      <div dangerouslySetInnerHTML={{ __html: blog.content?.substring(0, 150) + "..." }} className="line-clamp-3" />
                    </div>

                    <div className="mt-auto flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <CalendarOutlined />
                        <span>{dayjs(blog.createdAt).format("DD/MM/YYYY")}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <EyeOutlined />
                        <span>{0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>

      {blogs.length >= limit && (
        <div className="mt-6 text-center">
          <Link href="/blogs" className="inline-block rounded bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700">
            Xem tất cả bài viết
          </Link>
        </div>
      )}
    </div>
  );
};

export default Blogs;
