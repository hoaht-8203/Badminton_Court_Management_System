"use client";

import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, message } from "antd";
import FormItem from "antd/es/form/FormItem";
import React from "react";
import { authService } from "@/services/authService";
import { ApiError } from "@/lib/axios";
import { LoginRequest } from "@/types-openapi/api";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const LoginForm = () => {
  const [form] = Form.useForm<LoginRequest>();
  const [submitting, setSubmitting] = React.useState(false);
  const { refresh, login } = useAuth();
  const router = useRouter();

  const onFinish = async (values: LoginRequest) => {
    try {
      setSubmitting(true);
      await login({
        email: values.email,
        password: values.password,
      });
      await refresh();
      message.success("Đăng nhập thành công");
      router.push("/quanlysancaulong/dashboard");
    } catch (err) {
      const apiErr = err as ApiError;
      const fieldErrors = apiErr?.errors;
      if (fieldErrors) {
        const fields = Object.entries(fieldErrors).map(([name, errorMsg]) => ({
          name,
          errors: [errorMsg],
        }));
        form.setFields(fields as any);
      }
      message.error(apiErr?.message || "Đăng nhập thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Card title="Đăng nhập vào hệ thống">
        <Form layout="vertical" onFinish={onFinish} form={form}>
          <FormItem<LoginRequest>
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Vui lòng nhập email" },
              { type: "email", message: "Email không hợp lệ" },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              size="large"
              placeholder="Nhập thông tin"
            />
          </FormItem>
          <FormItem<LoginRequest>
            label="Mật khẩu"
            name="password"
            rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
          >
            <Input
              prefix={<LockOutlined />}
              size="large"
              type="password"
              placeholder="Nhập thông tin"
            />
          </FormItem>
          <FormItem>
            <div className="text-right">
              <a href="#">Quên mật khẩu?</a>
            </div>
          </FormItem>
          <div>
            <Button
              block
              size="large"
              type="primary"
              className="w-full"
              htmlType="submit"
              loading={submitting}
            >
              Đăng nhập
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default LoginForm;
