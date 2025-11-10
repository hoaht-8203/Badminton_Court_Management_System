"use client";

import { ListFeedbackResponse } from "@/types-openapi/api";
import { useUpdateFeedback, useGetFeedbackDetail } from "@/hooks/useFeedback";
import { Drawer, Form, Input, Button, message, Spin } from "antd";
import { useEffect } from "react";

interface ReplyFeedbackDrawerProps {
  open: boolean;
  onClose: () => void;
  feedback: ListFeedbackResponse | null;
}

const { TextArea } = Input;

const ReplyFeedbackDrawer = ({ open, onClose, feedback }: ReplyFeedbackDrawerProps) => {
  const [form] = Form.useForm();
  const updateMutation = useUpdateFeedback();
  const { data: feedbackDetail, isLoading } = useGetFeedbackDetail(feedback?.id, open && !!feedback?.id);

  useEffect(() => {
    if (open && feedbackDetail?.data) {
      form.setFieldsValue({
        adminReply: feedbackDetail.data.adminReply || "",
      });
    } else if (open && !feedbackDetail?.data) {
      form.resetFields();
    }
  }, [open, feedbackDetail, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!feedback?.id) {
        message.error("Không tìm thấy feedback");
        return;
      }

      const request = {
        id: feedback.id,
        adminReply: values.adminReply || null,
      };

      await updateMutation.mutateAsync(request);
      form.resetFields();
      onClose();
    } catch (error) {
      if (error && typeof error === "object" && "errorFields" in error) {
        return; // Form validation error
      }
    }
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Drawer title={feedbackDetail?.data?.adminReply ? "Sửa phản hồi" : "Phản hồi feedback"} open={open} onClose={handleClose} width={600}>
      {isLoading ? (
        <Spin />
      ) : (
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="ID Feedback" name="id" initialValue={feedback?.id}>
            <Input disabled />
          </Form.Item>

          <Form.Item label="Đánh giá của khách hàng" name="rating" initialValue={feedback?.rating}>
            <Input disabled />
          </Form.Item>

          <Form.Item label="Bình luận của khách hàng" name="comment" initialValue={feedback?.comment}>
            <TextArea rows={4} disabled />
          </Form.Item>

          <Form.Item label="Phản hồi của admin" name="adminReply" rules={[{ required: false, message: "Vui lòng nhập phản hồi" }]}>
            <TextArea rows={6} placeholder="Nhập phản hồi của admin..." maxLength={1000} showCount />
          </Form.Item>

          {feedbackDetail?.data?.adminReplyAt && (
            <Form.Item label="Ngày phản hồi" name="adminReplyAt" initialValue={feedbackDetail.data.adminReplyAt}>
              <Input disabled />
            </Form.Item>
          )}

          <Form.Item>
            <Button type="primary" onClick={handleSubmit} loading={updateMutation.isPending} block>
              {feedbackDetail?.data?.adminReply ? "Cập nhật phản hồi" : "Gửi phản hồi"}
            </Button>
          </Form.Item>
        </Form>
      )}
    </Drawer>
  );
};

export default ReplyFeedbackDrawer;
