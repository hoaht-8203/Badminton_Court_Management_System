"use client";

import { useMyProfile, useUpdateMyProfile, useUpdatePassword } from "@/hooks/useProfile";
import { ApiError } from "@/lib/axios";
import { MyProfileResponse, UpdateMyProfileRequest, UpdatePasswordRequest } from "@/types-openapi/api";
import { KeyOutlined, SaveOutlined } from "@ant-design/icons";
import { Button, Card, Col, DatePicker, Form, FormProps, Input, Row, Space, message } from "antd";
import FormItem from "antd/es/form/FormItem";
import dayjs from "dayjs";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

const ProfilePage = () => {
  const { data: profileData, refetch } = useMyProfile();
  const { refresh: refreshCurrentUser } = useAuth();
  const updateProfileMutation = useUpdateMyProfile();
  const updatePasswordMutation = useUpdatePassword();

  const [profileForm] = Form.useForm<MyProfileResponse>();
  const [passwordForm] = Form.useForm<UpdatePasswordRequest>();

  useEffect(() => {
    if (!profileData?.data) return;

    profileForm.setFieldsValue({
      fullName: profileData.data.fullName ?? null,
      userName: profileData.data.userName ?? null,
      email: profileData.data.email ?? null,
      phoneNumber: profileData.data.phoneNumber ?? null,
      address: profileData.data.address ?? null,
      city: profileData.data.city ?? null,
      district: profileData.data.district ?? null,
      ward: profileData.data.ward ?? null,
      dateOfBirth: profileData.data.dateOfBirth ? dayjs(profileData.data.dateOfBirth) : null,
    });
  }, [profileData, profileForm]);

  const handleSubmitProfile: FormProps<UpdateMyProfileRequest>["onFinish"] = async (values) => {
    const payload: UpdateMyProfileRequest = {
      ...values,
      dateOfBirth: values.dateOfBirth ? dayjs(values.dateOfBirth).toDate() : null,
    };

    updateProfileMutation.mutate(payload, {
      onSuccess: () => {
        message.success("Cập nhật hồ sơ thành công!");
        refetch();
        profileForm.resetFields();
        // Sync AuthContext current user after profile changes
        refreshCurrentUser();
      },
      onError: (error: ApiError) => {
        message.error(error.message);
      },
    });
  };

  const handleSubmitPassword = async () => {
    const values = await passwordForm.validateFields();
    updatePasswordMutation.mutate(values, {
      onSuccess: () => {
        message.success("Đổi mật khẩu thành công!");
        passwordForm.resetFields();
      },
      onError: (error: ApiError) => {
        message.error(error.message);
      },
    });
  };

  return (
    <section className="mx-auto mt-10 w-[700px]">
      <Row gutter={[12, 12]}>
        <Col span={24}>
          <Card
            title="Cập nhật thông tin cá nhân"
            extra={
              <Space>
                <Button icon={<SaveOutlined />} type="primary" onClick={() => profileForm.submit()} loading={updateProfileMutation.isPending}>
                  Lưu thay đổi
                </Button>
              </Space>
            }
          >
            <Form
              form={profileForm}
              layout="vertical"
              initialValues={{
                fullName: profileData?.data?.fullName ?? null,
                userName: profileData?.data?.userName ?? null,
                email: profileData?.data?.email ?? null,
                phoneNumber: profileData?.data?.phoneNumber ?? null,
                address: profileData?.data?.address ?? null,
                city: profileData?.data?.city ?? null,
                district: profileData?.data?.district ?? null,
                ward: profileData?.data?.ward ?? null,
                dateOfBirth: profileData?.data?.dateOfBirth ? dayjs(profileData?.data?.dateOfBirth) : null,
              }}
              onFinish={handleSubmitProfile}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <FormItem<MyProfileResponse> label="Tên đăng nhập" name="userName">
                    <Input placeholder="Nhập tên đăng nhập" disabled={true} value={profileData?.data?.userName ?? ""} />
                  </FormItem>
                </Col>
                <Col span={12}>
                  <FormItem<MyProfileResponse> label="Email" name="email">
                    <Input placeholder="Nhập email" value={profileData?.data?.email ?? ""} disabled={true} />
                  </FormItem>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <FormItem<UpdateMyProfileRequest> label="Họ và tên" name="fullName" rules={[{ required: true, message: "Họ và tên là bắt buộc" }]}>
                    <Input placeholder="Nhập họ và tên" />
                  </FormItem>
                </Col>
                <Col span={12}>
                  <FormItem<UpdateMyProfileRequest>
                    label="Số điện thoại"
                    name="phoneNumber"
                    rules={[
                      { required: true, message: "Số điện thoại là bắt buộc" },
                      { pattern: /^[0-9]{10,11}$/, message: "Số điện thoại không hợp lệ" },
                    ]}
                  >
                    <Input placeholder="Nhập số điện thoại" />
                  </FormItem>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <FormItem<UpdateMyProfileRequest> label="Ngày sinh" name="dateOfBirth">
                    <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
                  </FormItem>
                </Col>
                <Col span={12}>
                  <FormItem<UpdateMyProfileRequest> label="Địa chỉ" name="address">
                    <Input placeholder="Nhập địa chỉ" />
                  </FormItem>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <FormItem<UpdateMyProfileRequest> label="Thành phố/Tỉnh" name="city">
                    <Input placeholder="Nhập thành phố/tỉnh" />
                  </FormItem>
                </Col>
                <Col span={8}>
                  <FormItem<UpdateMyProfileRequest> label="Quận/Huyện" name="district">
                    <Input placeholder="Nhập quận/huyện" />
                  </FormItem>
                </Col>
                <Col span={8}>
                  <FormItem<UpdateMyProfileRequest> label="Phường/Xã" name="ward">
                    <Input placeholder="Nhập phường/xã" />
                  </FormItem>
                </Col>
              </Row>
            </Form>
          </Card>
        </Col>

        <Col span={24}>
          <Card
            title="Đổi mật khẩu"
            extra={
              <Space>
                <Button icon={<KeyOutlined />} type="primary" onClick={() => passwordForm.submit()} loading={updatePasswordMutation.isPending}>
                  Đổi mật khẩu
                </Button>
              </Space>
            }
          >
            <Form form={passwordForm} layout="vertical" onFinish={handleSubmitPassword}>
              <FormItem<UpdatePasswordRequest>
                label="Mật khẩu hiện tại"
                name="oldPassword"
                rules={[{ required: true, message: "Mật khẩu hiện tại là bắt buộc" }]}
              >
                <Input.Password placeholder="Nhập mật khẩu hiện tại" />
              </FormItem>

              <Row gutter={16}>
                <Col span={12}>
                  <FormItem<UpdatePasswordRequest>
                    label="Mật khẩu mới"
                    name="newPassword"
                    rules={[{ required: true, message: "Mật khẩu mới là bắt buộc" }]}
                  >
                    <Input.Password placeholder="Nhập mật khẩu mới" />
                  </FormItem>
                </Col>
                <Col span={12}>
                  <FormItem
                    label="Xác nhận mật khẩu"
                    name="confirmPassword"
                    dependencies={["newPassword"]}
                    rules={[
                      { required: true, message: "Xác nhận mật khẩu là bắt buộc" },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue("newPassword") === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error("Mật khẩu xác nhận không khớp"));
                        },
                      }),
                    ]}
                  >
                    <Input.Password placeholder="Nhập lại mật khẩu mới" />
                  </FormItem>
                </Col>
              </Row>
            </Form>
          </Card>
        </Col>
      </Row>
    </section>
  );
};

export default ProfilePage;
