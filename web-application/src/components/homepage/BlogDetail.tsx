"use client";

import { useDetailBlog } from "@/hooks/useBlogs";
import { CalendarOutlined, EyeOutlined } from "@ant-design/icons";
import { Breadcrumb, Card, Col, Row, Spin, Typography } from "antd";
import dayjs from "dayjs";
import Link from "next/link";

const { Title, Text } = Typography;

interface BlogDetailProps {
  blogId: string;
}

const BlogDetail = ({ blogId }: BlogDetailProps) => {
  const { data: blogData, isLoading, error } = useDetailBlog({ id: blogId });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spin size="large" />
      </div>
    );
  }

  if (error || !blogData?.data) {
    return (
      <div className="py-8 text-center">
        <Text type="danger">Không tìm thấy bài viết hoặc có lỗi xảy ra</Text>
      </div>
    );
  }

  const blog = blogData.data;

  return (
    <div className="container mx-auto py-8">
      {/* Breadcrumb */}
      <Breadcrumb
        className="!mb-4"
        items={[
          {
            title: <Link href="/homepage">Trang chủ</Link>,
          },
          {
            title: <Link href="/homepage">Bài viết</Link>,
          },
          {
            title: blog.title,
          },
        ]}
      />

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card className="h-full">
            {/* Blog Header */}
            <div className="mb-6">
              <Title level={1} className="mb-4">
                {blog.title}
              </Title>

              <div className="mb-4 flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <CalendarOutlined />
                  <span>{dayjs(blog.createdAt).format("DD/MM/YYYY HH:mm")}</span>
                </div>
                <div className="flex items-center gap-1">
                  <EyeOutlined />
                  <span>{0} lượt xem</span>
                </div>
              </div>
            </div>

            {/* Blog Content */}
            <div className="prose prose-lg max-w-none">
              <div dangerouslySetInnerHTML={{ __html: blog.content || "" }} className="blog-content" />
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <div className="sticky top-4">
            {/* Blog Info Card */}
            <Card title="Thông tin bài viết" className="mb-4">
              <div className="space-y-3">
                <div>
                  <Text strong>Ngày tạo:</Text>
                  <br />
                  <Text>{dayjs(blog.createdAt).format("DD/MM/YYYY HH:mm")}</Text>
                </div>

                {blog.updatedAt && (
                  <div>
                    <Text strong>Ngày cập nhật:</Text>
                    <br />
                    <Text>{dayjs(blog.updatedAt).format("DD/MM/YYYY HH:mm")}</Text>
                  </div>
                )}

                <div>
                  <Text strong>Lượt xem:</Text>
                  <br />
                  <Text>{0}</Text>
                </div>
              </div>
            </Card>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default BlogDetail;
