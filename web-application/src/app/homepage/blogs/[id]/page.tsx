"use client";

import BlogDetail from "@/components/homepage/BlogDetail";
import { use } from "react";

interface BlogDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

const BlogDetailPage = ({ params }: BlogDetailPageProps) => {
  const { id } = use(params);
  return <BlogDetail blogId={id} />;
};

export default BlogDetailPage;
