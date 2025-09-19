"use client";

import { Button, Result } from "antd";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <Result
      status="404"
      title="404"
      subTitle="Xin lỗi, không tìm thấy trang này."
      extra={
        <Button type="primary" onClick={() => router.push("/")}>
          Về trang chủ
        </Button>
      }
    />
  );
}
