"use client";

import FeedbacksList from "@/components/quanlysancaulong/feedbacks/feedbacks-list";
import SearchFeedback from "@/components/quanlysancaulong/feedbacks/search-feedback";
import ReplyFeedbackDrawer from "@/components/quanlysancaulong/feedbacks/reply-feedback-drawer";
import { useListFeedbacks, useDeleteFeedback } from "@/hooks/useFeedback";
import { ApiError } from "@/lib/axios";
import { ListFeedbackRequest, ListFeedbackResponse } from "@/types-openapi/api";
import { ReloadOutlined } from "@ant-design/icons";
import { Breadcrumb, Button, Modal, message } from "antd";
import { useState } from "react";

const FeedbacksPage = () => {
  const [filters, setFilters] = useState<ListFeedbackRequest>({});
  const [selectedFeedback, setSelectedFeedback] = useState<ListFeedbackResponse | null>(null);
  const [openReply, setOpenReply] = useState(false);

  const { data: feedbacksResp, isFetching, refetch } = useListFeedbacks(filters);
  const deleteMutation = useDeleteFeedback();
  const [modal, contextHolder] = Modal.useModal();

  const handleReply = (feedback: ListFeedbackResponse) => {
    setSelectedFeedback(feedback);
    setOpenReply(true);
  };

  const handleDelete = (id: number) => {
    modal.confirm({
      title: "Xóa feedback",
      content: "Bạn có chắc chắn muốn xóa feedback này? (Feedback sẽ được đánh dấu là đã xóa)",
      onOk: () => {
        deleteMutation.mutate(
          { id },
          {
            onSuccess: () => {
              message.success("Xóa feedback thành công!");
              refetch();
            },
            onError: (err: ApiError) => {
              message.error(err.message || "Xóa feedback thất bại!");
            },
          },
        );
      },
      okText: "Xóa",
      cancelText: "Hủy",
    });
  };

  const handleViewDetail = (feedback: ListFeedbackResponse) => {
    // Có thể mở modal/drawer chi tiết hoặc điều hướng đến trang chi tiết
    message.info(`Xem chi tiết feedback ID: ${feedback.id} - Đã hiển thị trong expanded row`);
  };

  const feedbacks = feedbacksResp?.data ?? [];

  return (
    <section>
      <div className="mb-4">
        <Breadcrumb items={[{ title: "Quản trị ứng dụng" }, { title: "Quản lý feedback" }]} />
      </div>

      <SearchFeedback onSearch={(s) => setFilters(s)} onReset={() => setFilters({})} />

      <div className="mb-2 flex items-center justify-between">
        <div>
          <span className="font-bold text-green-500">Tổng số feedback: {feedbacks.length}</span>
        </div>
        <div className="flex gap-2">
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            Tải lại
          </Button>
        </div>
      </div>

      <FeedbacksList feedbacks={feedbacks} loading={isFetching} onReply={handleReply} onDelete={handleDelete} onViewDetail={handleViewDetail} />

      <ReplyFeedbackDrawer open={openReply} onClose={() => setOpenReply(false)} feedback={selectedFeedback} />

      {contextHolder}
    </section>
  );
};

export default FeedbacksPage;
