"use client";

import { ListProductResponse } from "@/types-openapi/api";
import { Col, Row, Spin, Typography } from "antd";
import Link from "next/link";
import { useMemo } from "react";
import ProductCard from "./ProductCard";

const { Text } = Typography;

interface ProductsProps {
  products: ListProductResponse[];
  isLoading?: boolean;
  limit?: number;
}

const Products = ({ products, isLoading = false, limit = 8 }: ProductsProps) => {
  // Random 8 sản phẩm từ danh sách (chỉ lấy sản phẩm còn hàng)
  const randomProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    
    // Lọc bỏ sản phẩm sold out (stock = 0)
    const availableProducts = products.filter((p) => (p.stock ?? 0) > 0);
    
    // Tạo bản sao của mảng để không ảnh hưởng đến mảng gốc
    const shuffled = [...availableProducts].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, limit);
  }, [products, limit]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spin size="large" />
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="py-8 text-center">
        <Text type="secondary">Chưa có sản phẩm nào</Text>
      </div>
    );
  }

  return (
    <div className="py-8">
      <Row gutter={[24, 24]}>
        {randomProducts.map((product) => (
          <Col key={product.id} xs={24} sm={12} lg={6}>
            <ProductCard product={product} />
          </Col>
        ))}
      </Row>

      {randomProducts.length > 0 && products.filter((p) => (p.stock ?? 0) > 0).length > limit && (
        <div className="mt-6 text-center">
          <Link href="/homepage/products" className="inline-block rounded bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700">
            Xem tất cả sản phẩm
          </Link>
        </div>
      )}
    </div>
  );
};

export default Products;

