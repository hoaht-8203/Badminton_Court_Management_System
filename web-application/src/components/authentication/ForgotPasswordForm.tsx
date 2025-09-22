import { useForgotPassword, useValidateForgotPassword } from "@/hooks/useProfile";
import { ApiError } from "@/lib/axios";
import { ForgotPasswordRequest, ValidateForgotPasswordRequest } from "@/types-openapi/api";
import { Button, Card, Form, FormProps, Input, message } from "antd";
import FormItem from "antd/es/form/FormItem";
import React, { useState } from "react";

interface ForgotPasswordFormProps {
  onResetPasswordSuccess: () => void;
}

const ForgotPasswordForm = ({ onResetPasswordSuccess }: ForgotPasswordFormProps) => {
  const forgotPasswordMutation = useForgotPassword();
  const [form] = Form.useForm<ForgotPasswordRequest>();
  const [showValidateForgotPasswordForm, setShowValidateForgotPasswordForm] = React.useState(false);
  const [email, setEmail] = React.useState("");

  const handleSubmit: FormProps<ForgotPasswordRequest>["onFinish"] = async (values) => {
    await forgotPasswordMutation.mutateAsync(values, {
      onSuccess: () => {
        message.success("OTP đã được gửi đến email của bạn. Vui lòng kiểm tra email để nhập OTP để đặt lại mật khẩu!");
        setShowValidateForgotPasswordForm(true);
        setEmail(values.email || "");
        form.resetFields();
      },
      onError: (error: ApiError) => {
        message.error(error.message);
      },
    });
  };

  return (
    <Card title="Quên mật khẩu">
      {!showValidateForgotPasswordForm && (
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <FormItem<ForgotPasswordRequest>
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Email là bắt buộc" },
              { type: "email", message: "Email không hợp lệ" },
            ]}
          >
            <Input placeholder="Email" size="large" />
          </FormItem>
          <FormItem>
            <Button type="primary" htmlType="submit" loading={forgotPasswordMutation.isPending}>
              Gửi
            </Button>
          </FormItem>
        </Form>
      )}
      {showValidateForgotPasswordForm && (
        <ValidateForgotPasswordForm
          email={email}
          setShowValidateForgotPasswordForm={setShowValidateForgotPasswordForm}
          onResetPasswordSuccess={onResetPasswordSuccess}
        />
      )}
    </Card>
  );
};

interface ValidateForgotPasswordFormProps {
  email: string;
  setShowValidateForgotPasswordForm: (show: boolean) => void;
  onResetPasswordSuccess: () => void;
}

const ValidateForgotPasswordForm = ({ email, setShowValidateForgotPasswordForm, onResetPasswordSuccess }: ValidateForgotPasswordFormProps) => {
  const [otp, setOtp] = useState("");
  const validateForgotPasswordMutation = useValidateForgotPassword();
  const [form] = Form.useForm<ValidateForgotPasswordRequest>();

  const handleSubmit: FormProps<ValidateForgotPasswordRequest>["onFinish"] = async (values) => {
    const payload = {
      email,
      token: values.token,
    };
    await validateForgotPasswordMutation.mutateAsync(payload, {
      onSuccess: () => {
        message.success("Mật khẩu mới đã được gửi đến email của bạn. Vui lòng kiểm tra email để nhập mật khẩu mới!");
        setShowValidateForgotPasswordForm(false);
        onResetPasswordSuccess();
        form.resetFields();
      },
      onError: (error: ApiError) => {
        message.error(error.message);
      },
    });
  };

  return (
    <>
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <FormItem<ValidateForgotPasswordRequest> name="token" label="Mã OTP" rules={[{ required: true, message: "Mã OTP là bắt buộc" }]}>
          <Input.OTP value={otp} onChange={(value) => setOtp(value)} size="large" />
        </FormItem>
        <Button type="primary" htmlType="submit" loading={validateForgotPasswordMutation.isPending}>
          Xác nhận
        </Button>
      </Form>
    </>
  );
};

export default ForgotPasswordForm;
