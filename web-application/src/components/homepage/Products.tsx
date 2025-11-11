"use client";

import { ListProductResponse } from "@/types-openapi/api";
import Link from "next/link";
import { useMemo } from "react";
import ProductCard from "./ProductCard";

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
      <div className="flex justify-center py-12">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">Chưa có sản phẩm nào</p>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {randomProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {randomProducts.length > 0 && products.filter((p) => (p.stock ?? 0) > 0).length > limit && (
        <div className="mt-8 text-center">
          <Link
            href="/homepage/products"
            className="inline-block rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white shadow-md transition-all duration-200 hover:bg-blue-700 hover:shadow-lg"
          >
            Xem tất cả sản phẩm
          </Link>
        </div>
      )}
    </div>
  );
};

export default Products;
