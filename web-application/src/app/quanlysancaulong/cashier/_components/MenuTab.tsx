"use client";

import { memo } from "react";
import { Card, Col, Row, Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import Image from "next/image";
import { ListProductResponse } from "@/types-openapi/api";
import { Meta } from "antd/es/list/Item";

interface MenuTabProps {
  data: ListProductResponse[];
  loading: boolean;
  onAdd: (product: ListProductResponse) => void;
}

const MenuTab = memo(function MenuTab({ data, loading, onAdd }: MenuTabProps) {
  return (
    <div className="h-full p-3">
      <Row gutter={[8, 8]}>
        {loading ? (
          <div className="justify-cente flex h-full w-full flex-col items-center">
            <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
            <div className="text-lg font-bold">Đang tải dữ liệu...</div>
          </div>
        ) : (
          data?.map((product, index) => (
            <Col span={24} md={12} lg={8} xl={6} key={index}>
              <Card
                hoverable
                styles={{ cover: { border: "1px solid #f0f0f0", borderTopLeftRadius: 8, borderTopRightRadius: 8 }, body: { padding: 8 } }}
                onClick={() => onAdd(product)}
                cover={
                  <div className="relative">
                    <Image
                      style={{ width: "100%", height: "150px", objectFit: "contain" }}
                      draggable={false}
                      alt={`Thực đơn ${index + 1}`}
                      src={product.images?.[0] || "/placeholder/product-image-placeholder.jpg"}
                      width={100}
                      height={100}
                    />

                    <div className="absolute bottom-0 left-0 flex w-full justify-center">
                      <span className="rounded-t-lg bg-green-500 px-2 py-1 text-xs text-white">
                        {product.salePrice?.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                      </span>
                    </div>
                  </div>
                }
              >
                <Meta title={<span className="font-medium">{product.name}</span>} />
              </Card>
            </Col>
          ))
        )}
      </Row>
    </div>
  );
});

export default MenuTab;
