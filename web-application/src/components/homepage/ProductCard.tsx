"use client";

import { ListProductResponse } from "@/types-openapi/api";
import { Card, Rate, Typography } from "antd";
import Image from "next/image";
import Link from "next/link";

const { Title, Text } = Typography;

interface ProductCardProps {
  product: ListProductResponse;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const formatPrice = (price?: number) => {
    if (!price) return "Liên hệ";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const stock = product.stock ?? 0;
  const isOutOfStock = stock === 0;

  return (
    <Link href={`/homepage/products/${product.id}`} className="block h-full">
      <Card
        hoverable={!isOutOfStock}
        cover={
          <div className="relative">
            {product.images && product.images.length > 0 ? (
              <div className="relative aspect-square w-full overflow-hidden">
                <Image
                  src={product.images[0]}
                  alt={product.name ?? "Product thumbnail"}
                  fill
                  className={`object-cover transition-transform duration-300 ${isOutOfStock ? "opacity-50" : "hover:scale-105"}`}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                {isOutOfStock && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center">
                    <Image
                      src="https://png.pngtree.com/png-vector/20250506/ourmid/pngtree-sold-out-label-stamp-in-red-with-rectangular-border-for-limited-vector-png-image_16099397.png"
                      alt="Sold Out"
                      width={140}
                      height={70}
                      className="object-contain drop-shadow-lg"
                      style={{ maxWidth: "80%", maxHeight: "80%" }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex aspect-square w-full items-center justify-center bg-gray-100">
                <Text type="secondary">Không có hình ảnh</Text>
              </div>
            )}
          </div>
        }
        className="h-full border border-gray-300 shadow-sm transition-shadow duration-300 hover:shadow-lg"
        styles={{ body: { padding: "16px" } }}
      >
        <div className="flex h-full flex-col">
          <Title level={4} className="mb-2 line-clamp-2" style={{ fontSize: "16px", marginBottom: "8px" }}>
            {product.name}
          </Title>

          <div className="flex flex-col">
            {product.category && (
              <Text type="secondary" className="mb-2 text-xs">
                {product.category}
              </Text>
            )}

            <div className="mb-2">
              <Rate disabled defaultValue={5} style={{ fontSize: "14px" }} />
            </div>

            {!isOutOfStock && (
              <div className="mb-2">
                <Text type="secondary" className="text-xs">
                  Số lượng: {stock}
                </Text>
              </div>
            )}

            <div className="mt-auto">
              <Text strong className="text-lg text-red-600">
                {formatPrice(product.salePrice)}
              </Text>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default ProductCard;

