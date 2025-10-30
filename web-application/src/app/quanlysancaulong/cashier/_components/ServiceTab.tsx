"use client";

import { memo } from "react";
import { Card, Col, Row, Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import Image from "next/image";
import { ListServiceResponse } from "@/types-openapi/api";
import { Meta } from "antd/es/list/Item";

interface ServiceTabProps {
  data: ListServiceResponse[];
  loading: boolean;
  onAdd: (service: ListServiceResponse) => void;
}

const ServiceTab = memo(function ServiceTab({ data, loading, onAdd }: ServiceTabProps) {
  return (
    <div className="h-full p-3">
      <Row gutter={[8, 8]}>
        {loading ? (
          <div className="justify-cente flex h-full w-full flex-col items-center">
            <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
            <div className="text-lg font-bold">Đang tải dữ liệu...</div>
          </div>
        ) : (
          data?.map((service, index) => {
            const isOutOfStock = service.stockQuantity !== null && service.stockQuantity !== undefined && service.stockQuantity <= 0;
            return (
              <Col span={24} md={12} lg={8} xl={6} key={index}>
                <Card
                  hoverable={!isOutOfStock}
                  styles={{
                    cover: {
                      border: "1px solid #f0f0f0",
                      borderTopLeftRadius: 8,
                      borderTopRightRadius: 8,
                    },
                    body: isOutOfStock ? { opacity: 0.5 } : { padding: 8 },
                  }}
                  onClick={() => !isOutOfStock && onAdd(service)}
                  cover={
                    <div className="relative">
                      <Image
                        style={{ width: "100%", height: "150px", objectFit: "contain" }}
                        draggable={false}
                        alt={`Dịch vụ ${index + 1}`}
                        src={service.imageUrl || "/placeholder/product-image-placeholder-v2.jpg"}
                        width={100}
                        height={100}
                      />

                      <div className="absolute bottom-0 left-0 flex w-full justify-center">
                        {isOutOfStock ? (
                          <span className="rounded-t-lg bg-red-500 px-2 py-1 text-xs text-white">Hết hàng</span>
                        ) : (
                          <span className="rounded-t-lg bg-blue-500 px-2 py-1 text-xs text-white">
                            {service.pricePerHour?.toLocaleString("vi-VN", { style: "currency", currency: "VND" })} / {service.unit} / giờ
                          </span>
                        )}
                      </div>
                    </div>
                  }
                >
                  <Meta
                    title={<span className="font-medium">{service.name}</span>}
                    description={
                      <div className="text-xs text-gray-500">
                        <div>
                          Giá: {service.pricePerHour?.toLocaleString("vi-VN")} đ / {service.unit} / giờ
                        </div>
                        {service.stockQuantity !== null && <div className="text-blue-600">Còn lại: {service.stockQuantity} sản phẩm</div>}
                      </div>
                    }
                  />
                </Card>
              </Col>
            );
          })
        )}
      </Row>
    </div>
  );
});

export default ServiceTab;
