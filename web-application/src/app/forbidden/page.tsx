"use client";

import { Button, Result } from "antd";
import { useRouter } from "next/navigation";

export default function ForbiddenPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Result
        status="403"
        title="403"
        subTitle="Xin lỗi, bạn không có quyền truy cập trang này."
        extra={
          <Button type="primary" onClick={() => router.push("/homepage")}>
            Về trang chủ
          </Button>
        }
      />
    </div>
  );
}
