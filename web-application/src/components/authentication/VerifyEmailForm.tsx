"use client";

import { authService } from "@/services/authService";
import { ApiError } from "@/lib/axios";
import { VerifyEmailRequest } from "@/types-openapi/api";
import { ArrowLeftOutlined, MailOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, message } from "antd";
import FormItem from "antd/es/form/FormItem";
import type { NamePath } from "antd/es/form/interface";
import React from "react";

interface VerifyEmailFormProps {
  email: string;
  onVerifySuccess: () => void;
  onBack: () => void;
}

const VerifyEmailForm = ({ email, onVerifySuccess, onBack }: VerifyEmailFormProps) => {
  const [form] = Form.useForm<VerifyEmailRequest>();
  const [submitting, setSubmitting] = React.useState(false);
  const [resendDisabled, setResendDisabled] = React.useState(false);
  const [countdown, setCountdown] = React.useState(0);
  const [resending, setResending] = React.useState(false);

  const onFinish = async (values: VerifyEmailRequest) => {
    try {
      setSubmitting(true);
      const response = await authService.verifyEmail({
        email: email,
        token: values.token,
      });

      if (response.success) {
        onVerifySuccess();
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
      message.error(apiErr?.message || "Xác thực email thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendVerifyEmail = async () => {
    try {
      setResending(true);
      const response = await authService.resendVerifyEmail({
        email: email,
      });

      if (response.success) {
        message.success("Đã gửi lại mã xác thực email thành công");
        setResendDisabled(true);
        setCountdown(60);
      }
    } catch (err: unknown) {
      const apiErr = err as ApiError | undefined;
      message.error(apiErr?.message || "Gửi lại mã xác thực thất bại");
    } finally {
      setResending(false);
    }
  };

  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && resendDisabled) {
      setResendDisabled(false);
    }
  }, [countdown, resendDisabled]);

  return (
    <div>
      <Card
        title={
          <div className="flex items-center gap-2">
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={onBack} className="p-0" />
            <span>Xác thực email</span>
          </div>
        }
      >
        <div className="mb-4 text-center">
          <MailOutlined className="mb-2 text-4xl text-blue-500" />
          <p className="text-gray-600">Chúng tôi đã gửi mã xác thực đến email:</p>
          <p className="font-semibold text-blue-600">{email}</p>
          <p className="mt-2 text-sm text-gray-500">Vui lòng kiểm tra hộp thư và nhập mã xác thực bên dưới</p>
        </div>

        <Form layout="vertical" onFinish={onFinish} form={form}>
          <FormItem<VerifyEmailRequest> label="Mã xác thực" name="token" rules={[{ required: true, message: "Vui lòng nhập mã xác thực" }]}>
            <Input size="large" placeholder="Nhập mã xác thực 6 ký tự" className="text-center text-lg tracking-widest" />
          </FormItem>

          <div className="flex flex-col gap-2">
            <Button block size="large" type="primary" className="w-full" htmlType="submit" loading={submitting}>
              Xác thực email
            </Button>

            <div className="text-center">
              <Button
                className="w-full"
                size="large"
                variant="link"
                disabled={resendDisabled || resending}
                loading={resending}
                onClick={handleResendVerifyEmail}
              >
                {resendDisabled && countdown > 0 ? `Gửi lại sau ${countdown}s` : "Không nhận được mã? Gửi lại"}
              </Button>
            </div>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default VerifyEmailForm;
