"use client";

import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/axios";
import { LoginRequest } from "@/types-openapi/api";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, message } from "antd";
import FormItem from "antd/es/form/FormItem";
import type { NamePath } from "antd/es/form/interface";
import { useRouter } from "next/navigation";
import React from "react";
import ForgotPasswordForm from "./ForgotPasswordForm";

interface LoginFormProps {
  isUsersMode?: boolean;
}

const LoginForm = ({ isUsersMode = false }: LoginFormProps) => {
  const [form] = Form.useForm<LoginRequest>();
  const [submitting, setSubmitting] = React.useState(false);
  const { refresh, login } = useAuth();
  const router = useRouter();

  const [showForgotPasswordForm, setShowForgotPasswordForm] = React.useState(false);

  const onFinish = async (values: LoginRequest) => {
    try {
      setSubmitting(true);
      await login({
        email: values.email,
        password: values.password,
      });
      await refresh();
      message.success("Đăng nhập thành công");

      router.push("/homepage");
    } catch (err: unknown) {
      const apiErr = err as ApiError | undefined;
      
      // Kiểm tra nếu lỗi là email chưa xác thực
      if (apiErr?.errors?.emailNotConfirmed === "true") {
        const userEmail = apiErr.errors.email;
        message.error({
          content: (
            <div>
              <p>{apiErr.message}</p>
              <p>
                Email của bạn: <strong>{userEmail}</strong>
              </p>
            </div>
          ),
          duration: 0, // Không tự đóng
          onClick: () => message.destroy(),
        });
        
        // Chuyển đến trang xác thực email
        if (userEmail) {
          router.push(`/homepage/verify-email?email=${encodeURIComponent(userEmail)}`);
        }
        return;
      }
      
      const fieldErrors = apiErr?.errors;
      if (fieldErrors) {
        const fields = Object.entries(fieldErrors).map(([name, errorMsg]) => ({
          name: name as NamePath,
          errors: [errorMsg],
        }));
        form.setFields(fields);
      }
      message.error(apiErr?.message || "Đăng nhập thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Card title={isUsersMode ? "Đăng nhập" : "Đăng nhập vào hệ thống"}>
        <Form layout="vertical" onFinish={onFinish} form={form}>
          <FormItem<LoginRequest>
            label="Email hoặc Tên đăng nhập"
            name="email"
            rules={[
              { required: true, message: "Vui lòng nhập email hoặc tên đăng nhập" },
            ]}
          >
            <Input prefix={<UserOutlined />} size="large" placeholder="Nhập email hoặc tên đăng nhập" />
          </FormItem>
          <FormItem<LoginRequest> label="Mật khẩu" name="password" rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}>
            <Input prefix={<LockOutlined />} size="large" type="password" placeholder="Nhập thông tin" />
          </FormItem>
          <FormItem>
            <div className="text-right">
              <Button variant="link" onClick={() => setShowForgotPasswordForm(true)}>
                Quên mật khẩu?
              </Button>
            </div>
          </FormItem>
          <div className="flex flex-col gap-2">
            <Button block size="large" type="primary" className="w-full" htmlType="submit" loading={submitting}>
              Đăng nhập
            </Button>

            {isUsersMode && (
              <div className="text-center">
                <Button className="w-full" size="large" variant="link" onClick={() => router.push("/homepage/sign-up")}>
                  Đăng ký
                </Button>
              </div>
            )}
          </div>
        </Form>
      </Card>
      <div className="mt-4">{showForgotPasswordForm && <ForgotPasswordForm onResetPasswordSuccess={() => setShowForgotPasswordForm(false)} />}</div>
    </div>
  );
};

export default LoginForm;
