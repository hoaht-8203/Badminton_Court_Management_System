"use client";

import { authService } from "@/services/authService";
import { ApiError } from "@/lib/axios";
import { RegisterRequest } from "@/types-openapi/api";
import { LockOutlined, MailOutlined, PhoneOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, message } from "antd";
import FormItem from "antd/es/form/FormItem";
import type { NamePath } from "antd/es/form/interface";
import { useRouter } from "next/navigation";
import React from "react";
import VerifyEmailForm from "./VerifyEmailForm";

interface SignUpFormProps {
  isUsersMode?: boolean;
}

const SignUpForm = ({ isUsersMode = false }: SignUpFormProps) => {
  const [form] = Form.useForm<RegisterRequest>();
  const [submitting, setSubmitting] = React.useState(false);
  const router = useRouter();

  const [showVerifyEmailForm, setShowVerifyEmailForm] = React.useState(false);
  const [registeredEmail, setRegisteredEmail] = React.useState<string>("");

  const onFinish = async (values: RegisterRequest) => {
    try {
      setSubmitting(true);
      const response = await authService.signUp({
        userName: values.userName,
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        phoneNumber: values.phoneNumber,
      });

      if (response.success) {
        message.success("Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.");
        setRegisteredEmail(values.email || "");
        setShowVerifyEmailForm(true);
      }
    } catch (err: unknown) {
      const apiErr = err as ApiError | undefined;
      const fieldErrors = apiErr?.errors;
      if (fieldErrors) {
        const fields = Object.entries(fieldErrors).map(([name, errorMsg]) => ({
          name: name as NamePath,
          errors: [errorMsg],
        }));
        form.setFields(fields);
      }
      message.error(apiErr?.message || "Đăng ký thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyEmailSuccess = () => {
    message.success("Xác thực email thành công! Bạn có thể đăng nhập ngay bây giờ.");
    router.push("/homepage/login");
  };

  if (showVerifyEmailForm) {
    return <VerifyEmailForm email={registeredEmail} onVerifySuccess={handleVerifyEmailSuccess} onBack={() => setShowVerifyEmailForm(false)} />;
  }

  return (
    <div>
      <Card title="Đăng ký tài khoản">
        <Form layout="vertical" onFinish={onFinish} form={form}>
          <FormItem<RegisterRequest>
            label="Tên đăng nhập"
            name="userName"
            rules={[
              { required: true, message: "Vui lòng nhập tên đăng nhập" },
              { min: 3, message: "Tên đăng nhập phải có ít nhất 3 ký tự" },
              { max: 20, message: "Tên đăng nhập không được quá 20 ký tự" },
              {
                pattern: /^[a-zA-Z0-9_]+$/,
                message: "Tên đăng nhập không được chứa ký tự có dấu hoặc ký tự đặc biệt (chỉ cho phép chữ cái, số và dấu gạch dưới)",
              },
            ]}
          >
            <Input prefix={<UserOutlined />} size="large" placeholder="Nhập tên đăng nhập" />
          </FormItem>

          <FormItem<RegisterRequest>
            label="Họ và tên"
            name="fullName"
            rules={[
              { required: true, message: "Vui lòng nhập họ và tên" },
              { min: 2, message: "Họ và tên phải có ít nhất 2 ký tự" },
            ]}
          >
            <Input prefix={<UserOutlined />} size="large" placeholder="Nhập họ và tên" />
          </FormItem>

          <FormItem<RegisterRequest>
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Vui lòng nhập email" },
              { type: "email", message: "Email không hợp lệ" },
            ]}
          >
            <Input prefix={<MailOutlined />} size="large" placeholder="Nhập email" />
          </FormItem>

          <FormItem<RegisterRequest>
            label="Số điện thoại"
            name="phoneNumber"
            rules={[
              { required: true, message: "Vui lòng nhập số điện thoại" },
              { pattern: /^[0-9]{10,11}$/, message: "Số điện thoại phải có 10-11 chữ số" },
            ]}
          >
            <Input prefix={<PhoneOutlined />} size="large" placeholder="Nhập số điện thoại" />
          </FormItem>

          <FormItem<RegisterRequest>
            label="Mật khẩu"
            name="password"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu" },
              { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" },
            ]}
          >
            <Input prefix={<LockOutlined />} size="large" type="password" placeholder="Nhập mật khẩu" />
          </FormItem>

          <FormItem
            label="Xác nhận mật khẩu"
            name="confirmPassword"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Vui lòng xác nhận mật khẩu" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Mật khẩu xác nhận không khớp"));
                },
              }),
            ]}
          >
            <Input prefix={<LockOutlined />} size="large" type="password" placeholder="Xác nhận mật khẩu" />
          </FormItem>

          <div className="flex flex-col gap-2">
            <Button block size="large" type="primary" className="w-full" htmlType="submit" loading={submitting}>
              Đăng ký
            </Button>

            <div className="text-center">
              <Button className="w-full" size="large" variant="link" onClick={() => router.push("/homepage/login")}>
                Đã có tài khoản? Đăng nhập
              </Button>
            </div>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default SignUpForm;
