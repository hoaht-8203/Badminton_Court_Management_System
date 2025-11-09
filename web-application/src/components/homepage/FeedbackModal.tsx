"use client";

import { CreateFeedbackRequest, DetailFeedbackResponse } from "@/types-openapi/api";
import { useCreateFeedback, useGetFeedbackByOccurrence, useUpdateFeedback, useGetFeedbackDetail } from "@/hooks/useFeedback";
import { fileService } from "@/services/fileService";
import { Modal, Form, Rate, Input, Button, Space, message, Upload, Typography } from "antd";
import { useState, useEffect } from "react";
import { StarOutlined, UploadOutlined, LoadingOutlined } from "@ant-design/icons";
import type { UploadFile, UploadProps } from "antd/es/upload/interface";

const { TextArea } = Input;
const { Text } = Typography;

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
  bookingCourtOccurrenceId: string;
  customerId?: number;
  onSuccess?: () => void;
}

export default function FeedbackModal({ open, onClose, bookingCourtOccurrenceId, customerId, onSuccess }: FeedbackModalProps) {
  const [form] = Form.useForm();
  const createMutation = useCreateFeedback();
  const updateMutation = useUpdateFeedback();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  // Check if feedback already exists for current customer
  const currentCustomerId = customerId;
  const { data: existingFeedbacks } = useGetFeedbackByOccurrence(bookingCourtOccurrenceId, open && !!currentCustomerId);

  // Find feedback by customerId
  const existingFeedbackListItem = existingFeedbacks?.data?.find((f) => f.customerId === currentCustomerId && f.status !== "Deleted");

  // Fetch detail if we have an existing feedback ID to get all fields
  // Only fetch if we have an existing feedback item (edit mode)
  const { data: feedbackDetail, isLoading: isLoadingDetail } = useGetFeedbackDetail(
    existingFeedbackListItem?.id,
    open && !!existingFeedbackListItem?.id,
  );

  // Use detail if available (has all fields), otherwise null (will wait for detail to load)
  const existingFeedback: DetailFeedbackResponse | null = feedbackDetail?.data || null;

  // Check if we're in edit mode (have existing feedback item, waiting for detail or already loaded)
  const isEditMode = !!existingFeedbackListItem;
  const isReadyToEdit = isEditMode && existingFeedback !== null;

  useEffect(() => {
    if (open) {
      if (isEditMode) {
        // Edit mode: wait for detail to load before setting form values
        if (isReadyToEdit && existingFeedback) {
          // Load existing feedback data from detail (has all fields)
          form.setFieldsValue({
            rating: existingFeedback.rating || 5,
            comment: existingFeedback.comment || "",
            courtQuality: existingFeedback.courtQuality ?? 5,
            staffService: existingFeedback.staffService ?? 5,
            cleanliness: existingFeedback.cleanliness ?? 5,
            lighting: existingFeedback.lighting ?? 5,
            valueForMoney: existingFeedback.valueForMoney ?? 5,
          });

          // Load existing media if available
          if (existingFeedback.mediaUrl && Array.isArray(existingFeedback.mediaUrl) && existingFeedback.mediaUrl.length > 0) {
            const files: UploadFile[] = existingFeedback.mediaUrl.map((url: string, index: number) => ({
              uid: `existing-${index}-${Date.now()}`,
              name: url.split("/").pop() || `image-${index + 1}.jpg`,
              status: "done",
              url: url,
            }));
            setFileList(files);
          } else {
            setFileList([]);
          }
        }
        // If isLoadingDetail, form will show loading state (handled in render)
      } else {
        // Create mode: reset form for new feedback
        form.resetFields();
        form.setFieldsValue({
          rating: 5,
          courtQuality: 5,
          staffService: 5,
          cleanliness: 5,
          lighting: 5,
          valueForMoney: 5,
        });
        setFileList([]);
      }
    }
  }, [open, isEditMode, isReadyToEdit, existingFeedback, form, isLoadingDetail]);

  const isFormLoading = isEditMode && isLoadingDetail;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async () => {
    try {
      // Prevent submit if form is still loading or uploading
      if (isFormLoading || uploading) {
        message.warning("Vui lòng đợi quá trình upload ảnh hoàn tất");
        return;
      }

      const values = await form.validateFields();

      // Get all uploaded file URLs (only files that are done and have URL)
      const mediaUrls = fileList
        .filter((file) => {
          const hasUrl = file.url && file.url.trim() !== "";
          const isDone = file.status === "done";
          return hasUrl && isDone;
        })
        .map((file) => file.url as string)
        .filter((url): url is string => !!url); // Type guard to ensure URL is not null/undefined

      console.log("FileList:", fileList);
      console.log("MediaUrls to send:", mediaUrls);

      if (isEditMode && existingFeedback?.id) {
        // Update existing feedback
        // Always send mediaUrl array (even if empty) so backend knows to update it
        const updateRequest = {
          id: existingFeedback.id,
          rating: values.rating,
          comment: values.comment,
          courtQuality: values.courtQuality,
          staffService: values.staffService,
          cleanliness: values.cleanliness,
          lighting: values.lighting,
          valueForMoney: values.valueForMoney,
          mediaUrl: mediaUrls, // Send array (can be empty to clear MediaUrl)
        };
        console.log("Update request:", updateRequest);
        await updateMutation.mutateAsync(updateRequest);
      } else {
        // Create new feedback
        const request: CreateFeedbackRequest = {
          bookingCourtOccurrenceId: bookingCourtOccurrenceId,
          rating: values.rating,
          comment: values.comment,
          courtQuality: values.courtQuality,
          staffService: values.staffService,
          cleanliness: values.cleanliness,
          lighting: values.lighting,
          valueForMoney: values.valueForMoney,
          mediaUrl: mediaUrls.length > 0 ? mediaUrls : undefined,
        };
        console.log("Create request:", request);
        await createMutation.mutateAsync(request);
      }

      onSuccess?.();
      handleClose();
    } catch (error) {
      // Form validation errors are handled by Ant Design
      if (error && typeof error === "object" && "errorFields" in error) {
        return; // Form validation error
      }
    }
  };

  const handleClose = async () => {
    // Clean up: delete uploaded files that haven't been saved to feedback
    // Only delete files that were uploaded in this session (have fileName but are new)
    const filesToDelete = fileList.filter((file) => {
      const fileName = (file as any).fileName;
      // Delete if it's a new upload (has fileName) and not from existing feedback
      // Existing feedback files don't have fileName in our implementation
      return fileName && file.uid.startsWith("upload-");
    });

    // Delete files from server in background (don't block UI)
    if (filesToDelete.length > 0) {
      filesToDelete.forEach(async (file) => {
        const fileName = (file as any).fileName;
        if (fileName) {
          try {
            await fileService.deleteFile({ fileName });
          } catch (error) {
            // Silently fail - file cleanup is not critical
            console.warn("Failed to delete uploaded file:", fileName);
          }
        }
      });
    }

    form.resetFields();
    setFileList([]);
    setUploading(false);
    onClose();
  };

  const handleBeforeUpload: UploadProps["beforeUpload"] = (file) => {
    // Check file type
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error("Chỉ có thể upload file ảnh!");
      return false;
    }

    // Check file size (max 5MB)
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error("Ảnh phải nhỏ hơn 5MB!");
      return false;
    }

    // Check if already has 3 files
    if (fileList.length >= 3) {
      message.warning("Chỉ có thể upload tối đa 3 ảnh");
      return false;
    }

    // Return false to prevent default upload, we'll handle it in customRequest
    return false;
  };

  const handleCustomRequest: UploadProps["customRequest"] = async (options) => {
    const { file, onSuccess, onError, onProgress } = options;

    // Check file type
    if (!(file instanceof File)) {
      onError?.(new Error("Invalid file"));
      return;
    }

    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      onError?.(new Error("Chỉ có thể upload file ảnh!"));
      return;
    }

    // Check file size (max 5MB)
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      onError?.(new Error("Ảnh phải nhỏ hơn 5MB!"));
      return;
    }

    // Check if already has 3 files
    if (fileList.length >= 3) {
      onError?.(new Error("Chỉ có thể upload tối đa 3 ảnh"));
      return;
    }

    // Create a temporary file object for UI
    const tempFile: UploadFile = {
      uid: `upload-${Date.now()}-${Math.random()}`,
      name: file.name,
      status: "uploading",
      percent: 0,
      originFileObj: file as any, // Type assertion for compatibility
    };

    // Add to fileList with uploading status
    setFileList((prev) => {
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, tempFile];
    });
    setUploading(true);

    try {
      // Simulate progress (optional, fileService doesn't support it)
      onProgress?.({ percent: 50 });

      // Upload file
      const uploadResult = await fileService.uploadFile(file);
      const publicUrl = uploadResult.data?.publicUrl;
      const fileName = uploadResult.data?.fileName;

      if (!publicUrl) {
        throw new Error("Upload failed: No URL returned");
      }

      // Update fileList with uploaded URL
      setFileList((prev) => {
        return prev.map((f) => {
          if (f.uid === tempFile.uid) {
            const updatedFile: UploadFile = {
              ...f,
              status: "done",
              url: publicUrl,
              percent: 100,
            };
            // Store fileName in a custom property for deletion later if needed
            (updatedFile as any).fileName = fileName;
            return updatedFile;
          }
          return f;
        });
      });

      onProgress?.({ percent: 100 });
      onSuccess?.(uploadResult, file as any);
      message.success("Upload ảnh thành công!");
    } catch (error: any) {
      // Remove failed file from fileList
      setFileList((prev) => prev.filter((f) => f.uid !== tempFile.uid));
      const errorMessage = error?.message || "Upload ảnh thất bại";
      message.error(errorMessage);
      onError?.(error);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange: UploadProps["onChange"] = ({ fileList: newFileList }) => {
    // Preserve URLs and other properties from current fileList
    // This ensures uploaded files don't lose their URLs when Ant Design updates
    const updatedFileList = newFileList.map((newFile) => {
      // Find existing file in current fileList
      const existingFile = fileList.find((f) => f.uid === newFile.uid);
      if (existingFile) {
        // Preserve URL, status, and fileName from existing file
        return {
          ...newFile,
          url: existingFile.url || newFile.url,
          status: existingFile.status || newFile.status,
          ...((existingFile as any).fileName ? { fileName: (existingFile as any).fileName } : {}),
        };
      }
      return newFile;
    });

    // Limit to 3 files
    if (updatedFileList.length > 3) {
      message.warning("Chỉ có thể upload tối đa 3 ảnh");
      const limitedFileList = updatedFileList.slice(0, 3);
      setFileList(limitedFileList);
    } else {
      setFileList(updatedFileList);
    }
  };

  const handleRemoveFile = async (file: UploadFile) => {
    // If file was uploaded in this session (new upload, has fileName), delete it from server
    // Files from existing feedback don't have fileName, so we just remove them from UI
    const fileName = (file as any).fileName;
    const isNewUpload = fileName && file.uid.startsWith("upload-");

    if (isNewUpload && file.status === "done") {
      try {
        await fileService.deleteFile({ fileName });
        message.success("Xóa ảnh thành công!");
      } catch (error: any) {
        message.error(`Xóa ảnh thất bại: ${error?.message || "Có lỗi xảy ra"}`);
        // Continue with removal from UI even if server deletion fails
      }
    }

    // Remove from fileList
    const newFileList = fileList.filter((f) => f.uid !== file.uid);
    setFileList(newFileList);
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      title={isEditMode ? "Cập nhật đánh giá" : "Đánh giá lịch đặt sân"}
      width={600}
      footer={[
        <Button key="cancel" onClick={handleClose} disabled={isFormLoading}>
          Hủy
        </Button>,
        <Button key="submit" type="primary" onClick={handleSubmit} loading={isSubmitting} disabled={isFormLoading || uploading}>
          {isEditMode ? "Cập nhật" : "Gửi đánh giá"}
        </Button>,
      ]}
    >
      {isFormLoading ? (
        <div style={{ padding: "40px", textAlign: "center" }}>
          <Text type="secondary">Đang tải thông tin đánh giá...</Text>
        </div>
      ) : (
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            label={
              <Space>
                <StarOutlined />
                <Text strong>Đánh giá tổng thể</Text>
              </Space>
            }
            name="rating"
            rules={[{ required: true, message: "Vui lòng chọn đánh giá" }]}
            initialValue={5}
          >
            <Rate allowClear={false} />
          </Form.Item>

          <Form.Item label="Chất lượng sân" name="courtQuality" rules={[{ required: true, message: "Vui lòng chọn đánh giá" }]} initialValue={5}>
            <Rate allowClear={false} />
          </Form.Item>

          <Form.Item label="Dịch vụ nhân viên" name="staffService" rules={[{ required: true, message: "Vui lòng chọn đánh giá" }]} initialValue={5}>
            <Rate allowClear={false} />
          </Form.Item>

          <Form.Item label="Vệ sinh" name="cleanliness" rules={[{ required: true, message: "Vui lòng chọn đánh giá" }]} initialValue={5}>
            <Rate allowClear={false} />
          </Form.Item>

          <Form.Item label="Ánh sáng" name="lighting" rules={[{ required: true, message: "Vui lòng chọn đánh giá" }]} initialValue={5}>
            <Rate allowClear={false} />
          </Form.Item>

          <Form.Item label="Giá trị đồng tiền" name="valueForMoney" rules={[{ required: true, message: "Vui lòng chọn đánh giá" }]} initialValue={5}>
            <Rate allowClear={false} />
          </Form.Item>

          <Form.Item label="Nhận xét" name="comment">
            <TextArea rows={4} placeholder="Chia sẻ trải nghiệm của bạn..." maxLength={2000} showCount />
          </Form.Item>

          <Form.Item label="Hình ảnh (tối đa 3 ảnh)">
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={handleFileChange}
              onRemove={handleRemoveFile}
              beforeUpload={handleBeforeUpload}
              customRequest={handleCustomRequest}
              maxCount={3}
              accept="image/*"
              disabled={uploading}
              showUploadList={{
                showPreviewIcon: true,
                showRemoveIcon: true,
              }}
            >
              {fileList.length < 3 && (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              )}
            </Upload>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Bạn có thể upload tối đa 3 ảnh để chia sẻ trải nghiệm (mỗi ảnh tối đa 5MB)
            </Text>
          </Form.Item>

          {isEditMode && (
            <Form.Item>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Bạn đã đánh giá lịch này trước đó. Bạn có thể cập nhật đánh giá của mình.
              </Text>
            </Form.Item>
          )}
        </Form>
      )}
    </Modal>
  );
}
