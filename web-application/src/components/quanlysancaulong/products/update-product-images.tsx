"use client";

import { productService } from "@/services/productService";
import { ApiError } from "@/lib/axios";
import { Button, Upload, UploadFile, UploadProps, message } from "antd";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

const UpdateProductImages = ({ productId, onUpdated }: { productId: number; onUpdated?: () => void }) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();

  const props: UploadProps = {
    beforeUpload: () => false,
    listType: "picture-card",
    fileList: files,
    onChange: ({ fileList }) => setFiles(fileList),
  };

  const handleUpload = async () => {
    try {
      setLoading(true);
      await productService.updateImages(productId, files.map((f) => f.originFileObj as File).filter(Boolean));
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
