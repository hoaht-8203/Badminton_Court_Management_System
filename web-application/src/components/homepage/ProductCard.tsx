"use client";

import { ListProductResponse } from "@/types-openapi/api";
import Image from "next/image";
import Link from "next/link";

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

  // Get short description from product description (first 80 chars)
  const getShortDescription = () => {
    if (!product.description) return "Sản phẩm chất lượng cao, đảm bảo uy tín.";
    const text = product.description.replace(/<[^>]*>/g, "").trim();
    return text.length > 80 ? text.substring(0, 80) + "..." : text;
  };

  // Star rating component
  const StarRating = ({ rating = 5 }: { rating?: number }) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`h-4 w-4 ${star <= rating ? "text-amber-400" : "text-gray-300"}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      {/* Product Image */}
      <Link href={`/homepage/products/${product.id}`} className="relative block aspect-square w-full overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        {product.images && product.images.length > 0 ? (
          <>
            <Image
              src={product.images[0]}
              alt={product.name ?? "Product thumbnail"}
              fill
              className={`object-cover transition-transform duration-500 ${isOutOfStock ? "opacity-40 grayscale" : "group-hover:scale-110"}`}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {isOutOfStock && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20">
                <div className="rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white shadow-lg">
                  Hết hàng
                </div>
              </div>
            )}
            {!isOutOfStock && (
              <div className="absolute top-3 right-3 z-10 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white shadow-md">
                Còn hàng
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <svg className="h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </Link>

      {/* Product Info */}
      <div className="flex flex-1 flex-col p-5">
        {/* Category Badge */}
        {product.category && (
          <div className="mb-2">
            <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              {product.category}
            </span>
          </div>
        )}

        {/* Product Name */}
        <Link href={`/homepage/products/${product.id}`}>
          <h3 className="mb-2 line-clamp-2 text-lg font-bold text-gray-900 transition-colors group-hover:text-blue-600">
            {product.name}
          </h3>
        </Link>

        {/* Short Description */}
        <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-gray-600">
          {getShortDescription()}
        </p>

        {/* Rating */}
        <div className="mb-3 flex items-center gap-2">
          <StarRating rating={5} />
          <span className="text-xs text-gray-500">(70 đánh giá)</span>
        </div>

        {/* Stock Info */}
        {!isOutOfStock && (
          <div className="mb-3 flex items-center gap-1.5 text-xs text-gray-500">
            <svg className="h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Còn {stock} sản phẩm</span>
          </div>
        )}

        {/* Price and CTA */}
        <div className="mt-auto flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
          <div>
            <p className="text-xl font-bold text-red-600">{formatPrice(product.salePrice)}</p>
          </div>
          <Link
            href={`/homepage/products/${product.id}`}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 hover:shadow-md active:scale-95"
            onClick={(e) => e.stopPropagation()}
          >
            Xem chi tiết
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

