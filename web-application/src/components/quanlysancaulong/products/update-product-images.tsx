"use client";

import { productService } from "@/services/productService";
import { ApiError } from "@/lib/axios";
import { Button, Upload, UploadFile, UploadProps, message } from "antd";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

const UpdateProductImages = ({ productId, onUpdated }: { productId: number; onUpdated?: () => void }) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    // Prefill existing images
    const load = async () => {
      try {
        const res = await productService.detail({ id: productId });
        const imgs = res.data?.images || [];
        const prefilled: UploadFile[] = imgs.map((url: string, idx: number) => ({
          uid: `existing-${idx}`,
          name: url.split("/").pop() || `image-${idx + 1}`,
          status: "done",
          url,
        }));
        setFiles(prefilled);
      } catch {
        // ignore
      }
    };
    if (productId) load();
  }, [productId]);

  const props: UploadProps = {
    beforeUpload: (file) => {
      const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/webp" || file.type.startsWith("image/");
      if (!isJpgOrPng) {
        message.error("Bạn chỉ có thể tải lên file hình ảnh!");
      }
      return false; // Prevent auto upload
    },
    listType: "picture-card",
    accept: "image/*",
    fileList: files,
    onChange: ({ fileList }) => {
      // Filter out non-image files if they somehow got in
      const filteredList = fileList.filter((file) => file.type?.startsWith("image/") || file.originFileObj?.type?.startsWith("image/") || file.url);
      setFiles(filteredList);
    },
    multiple: true,
  };

  const handleUpload = async () => {
    try {
      setLoading(true);
      // Only upload newly added files; existing ones with url have no originFileObj
      const newFiles = files.map((f) => f.originFileObj as File).filter(Boolean);
      
      // If no new files, don't call updateImages (keep existing images)
      if (newFiles.length === 0) {
        message.error("Vui lòng chọn ít nhất một ảnh mới để tải lên");
        return;
      }
      
      await productService.updateImages(productId, newFiles);
      message.success("Cập nhật ảnh thành công");
      // Refresh product detail and list so new images show up
      qc.invalidateQueries({ queryKey: ["product", { id: productId }] });
      qc.invalidateQueries({ queryKey: ["product", productId] });
      qc.invalidateQueries({ queryKey: ["products"] });
      onUpdated?.();
    } catch (e) {
      const err = e as ApiError;
      message.error(err.message || "Tải ảnh thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Upload {...props}>
        <div>Chọn ảnh</div>
      </Upload>
      <Button type="primary" onClick={handleUpload} loading={loading} disabled={!productId || files.length === 0}>
        Lưu ảnh
      </Button>
    </div>
  );
};

export default UpdateProductImages;
