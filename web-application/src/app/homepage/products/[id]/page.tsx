"use client";

import ProductCard from "@/components/homepage/ProductCard";
import { useDetailProduct, useListProductsForWeb } from "@/hooks/useProducts";
import { DetailProductResponse } from "@/types-openapi/api";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState, useEffect } from "react";

const ProductDetailPage = () => {
  const params = useParams();
  const productId = Number(params.id);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const autoSlide = true;
  const [relatedProductsIndex, setRelatedProductsIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"description" | "reviews">("description");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [productId]);

  const { data: productData, isLoading } = useDetailProduct({ id: productId }, !!productId);
  const product = productData?.data as DetailProductResponse | undefined;
  const images = product?.images || [];

  useEffect(() => {
    if (!autoSlide || images.length <= 1) return;
    const interval = setInterval(() => {
      setSelectedImageIndex((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [autoSlide, images.length]);

  const { data: relatedProductsData } = useListProductsForWeb({
    category: product?.category || undefined,
  });

  const relatedProducts = useMemo(() => {
    if (!relatedProductsData?.data || !product) return [];
    return relatedProductsData.data.filter((p) => {
      const stock = p.stock ?? 0;
      return p.id !== product.id && stock > 0;
    });
  }, [relatedProductsData?.data, product]);

  const productsPerPage = 4;
  const totalPages = Math.ceil(relatedProducts.length / productsPerPage);
  const displayedProducts = useMemo(() => {
    const startIndex = relatedProductsIndex * productsPerPage;
    return relatedProducts.slice(startIndex, startIndex + productsPerPage);
  }, [relatedProducts, relatedProductsIndex, productsPerPage]);

  const handlePrevRelated = () => {
    setRelatedProductsIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNextRelated = () => {
    setRelatedProductsIndex((prev) => Math.min(totalPages - 1, prev + 1));
  };

  const formatPrice = (price?: number) => {
    if (!price) return "Liên hệ";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleZaloContact = () => {
    const zaloPhone = "0123456789";
    window.open(`https://zalo.me/${zaloPhone}`, "_blank");
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => {
      const newValue = prev + delta;
      if (newValue < 1) return 1;
      if (newValue > maxQuantity) return maxQuantity;
      return newValue;
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin sản phẩm...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="rounded-2xl bg-white p-12 text-center shadow-lg">
          <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">Không tìm thấy sản phẩm</h3>
          <p className="mt-2 text-gray-500">Sản phẩm bạn đang tìm có thể không còn tồn tại</p>
          <Link
            href="/homepage/products"
            className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  const stock = product.stock ?? 0;
  const isOutOfStock = stock === 0;
  const maxQuantity = Math.min(stock, 999);

  const StarRating = ({ rating = 5, size = "md" }: { rating?: number; size?: "sm" | "md" | "lg" }) => {
    const sizeClasses = {
      sm: "h-3.5 w-3.5",
      md: "h-4 w-4",
      lg: "h-5 w-5",
    };
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`${sizeClasses[size]} ${star <= rating ? "text-amber-400" : "text-gray-300"}`}
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8 lg:px-6">
        {/* Enhanced Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-sm">
          <Link href="/homepage" className="text-gray-600 transition-colors hover:text-blue-600">
            Trang chủ
          </Link>
          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link href="/homepage/products" className="text-gray-600 transition-colors hover:text-blue-600">
            Sản phẩm
          </Link>
          {product.category && (
            <>
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <Link
                href={`/homepage/products?category=${encodeURIComponent(product.category)}`}
                className="text-gray-600 transition-colors hover:text-blue-600"
              >
                {product.category}
              </Link>
            </>
          )}
          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="line-clamp-1 font-medium text-gray-900">{product.name}</span>
        </nav>

        {/* Main Product Section */}
        <div className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Enhanced Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 shadow-xl">
              {images.length > 0 ? (
                <>
                  <Image
                    src={images[selectedImageIndex]}
                    alt={product.name ?? "Product image"}
                    fill
                    className={`object-contain transition-opacity duration-500 ${isOutOfStock ? "opacity-40 grayscale" : ""}`}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                  />
                  {isOutOfStock && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20">
                      <div className="rounded-xl bg-red-500 px-6 py-3 text-lg font-bold text-white shadow-2xl">Hết hàng</div>
                    </div>
                  )}
                  {!isOutOfStock && (
                    <div className="absolute top-4 right-4 z-10 rounded-full bg-emerald-500 px-4 py-2 text-sm font-bold text-white shadow-lg">
                      Còn hàng
                    </div>
                  )}
                </>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <svg className="h-24 w-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                      selectedImageIndex === index ? "border-blue-500 shadow-lg ring-4 ring-blue-200" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Image src={img} alt={`${product.name} ${index + 1}`} fill className="object-contain" sizes="96px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Enhanced Product Info */}
          <div className="flex flex-col">
            <div className="rounded-2xl bg-white p-8 shadow-xl">
              {/* Category Badge */}
              {product.category && (
                <div className="mb-4">
                  <Link
                    href={`/homepage/products?category=${encodeURIComponent(product.category)}`}
                    className="inline-block rounded-full bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100"
                  >
                    {product.category}
                  </Link>
                </div>
              )}

              {/* Product Name */}
              <h1 className="mb-4 text-4xl leading-tight font-bold text-gray-900">{product.name}</h1>

              {/* Product Code */}
              {product.code && (
                <div className="mb-4 text-sm text-gray-600">
                  <span className="font-medium">Mã sản phẩm:</span> <span className="text-gray-900">{product.code}</span>
                </div>
              )}

              {/* Price */}
              <div className="mb-6 border-b border-gray-200 pb-6">
                <p className="text-4xl font-bold text-red-600">{formatPrice(product.salePrice)}</p>
              </div>

              {/* Rating */}
              <div className="mb-6 flex items-center gap-3">
                <StarRating rating={5} size="lg" />
                <span className="text-sm text-gray-600">(70 đánh giá của khách hàng)</span>
              </div>

              {/* Stock Status */}
              <div className="mb-6 rounded-xl bg-gray-50 p-4">
                {isOutOfStock ? (
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                      <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-red-600">Hết hàng</p>
                      <p className="text-sm text-gray-600">Vui lòng liên hệ để đặt hàng</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                      <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-emerald-600">Còn hàng</p>
                      <p className="text-sm text-gray-600">Số lượng còn lại: {stock} sản phẩm</p>
                    </div>
                  </div>
                )}
              </div>

              {!isOutOfStock && (
                <>
                  {/* Quantity Selector */}
                  <div className="mb-6">
                    <label className="mb-3 block text-sm font-semibold text-gray-700">Số lượng:</label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleQuantityChange(-1)}
                        className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-gray-300 bg-white text-gray-700 transition-all hover:border-blue-500 hover:bg-blue-50 active:scale-95"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={maxQuantity}
                        value={quantity}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 1;
                          if (value >= 1 && value <= maxQuantity) {
                            setQuantity(value);
                          }
                        }}
                        className="h-12 w-24 rounded-lg border-2 border-gray-300 text-center text-lg font-semibold text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-200 focus:outline-none"
                      />
                      <button
                        onClick={() => handleQuantityChange(1)}
                        className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-gray-300 bg-white text-gray-700 transition-all hover:border-blue-500 hover:bg-blue-50 active:scale-95"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Special Offers */}
                  <div className="mb-6 rounded-xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <svg className="h-6 w-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="font-bold text-gray-900">Ưu đãi đặc biệt</span>
                    </div>
                    <div className="space-y-2.5">
                      {[
                        { text: "Sơn logo mặt vợt", highlight: "miễn phí" },
                        { text: "Bảo hành lưới đan", highlight: "trong 72 giờ" },
                        { text: "Thay gen vợt", highlight: "miễn phí trọn đời" },
                        { text: "Tích luỹ điểm thành viên", highlight: "Premium" },
                        { text: "Voucher giảm giá", highlight: "cho lần mua tiếp theo" },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2.5">
                          <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-sm text-gray-700">
                            <span className="font-semibold text-orange-700">{item.text}</span> {item.highlight}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={handleZaloContact}
                      className="w-full rounded-xl bg-[#0068FF] px-6 py-4 text-lg font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0052CC] hover:shadow-xl active:translate-y-0"
                    >
                      <div className="flex items-center justify-center gap-3">
                        <img
                          src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Icon_of_Zalo.svg/2048px-Icon_of_Zalo.svg.png"
                          alt="Zalo"
                          className="h-6 w-6"
                        />
                        <span>Liên hệ Zalo để đặt hàng</span>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Product Description Tabs */}
        <div className="mb-12 rounded-2xl bg-white shadow-xl">
          <div className="border-b border-gray-200">
            <div className="flex gap-1 p-2">
              <button
                onClick={() => setActiveTab("description")}
                className={`flex-1 rounded-lg px-6 py-4 text-center font-semibold transition-all ${
                  activeTab === "description" ? "bg-blue-600 text-white shadow-md" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                Mô tả sản phẩm
              </button>
              <button
                onClick={() => setActiveTab("reviews")}
                className={`flex-1 rounded-lg px-6 py-4 text-center font-semibold transition-all ${
                  activeTab === "reviews" ? "bg-blue-600 text-white shadow-md" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                Đánh giá
              </button>
            </div>
          </div>
          <div className="p-8">
            {activeTab === "description" ? (
              <div className="prose max-w-none">
                {product.description ? (
                  <div dangerouslySetInnerHTML={{ __html: product.description }} className="text-gray-700" />
                ) : (
                  <p className="text-gray-500">Chưa có mô tả sản phẩm</p>
                )}
              </div>
            ) : (
              <ProductReviews />
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Sản phẩm liên quan</h2>
                <p className="mt-1 text-gray-600">Các sản phẩm cùng danh mục bạn có thể quan tâm</p>
              </div>
              {totalPages > 1 && (
                <div className="flex gap-2">
                  <button
                    onClick={handlePrevRelated}
                    disabled={relatedProductsIndex === 0}
                    className="flex items-center gap-2 rounded-lg border-2 border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-blue-500 hover:bg-blue-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Trước
                  </button>
                  <button
                    onClick={handleNextRelated}
                    disabled={relatedProductsIndex >= totalPages - 1}
                    className="flex items-center gap-2 rounded-lg border-2 border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-blue-500 hover:bg-blue-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Sau
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {displayedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced Product Reviews Component
const ProductReviews = () => {
  const reviews = [
    {
      id: 1,
      customerName: "Nguyễn Văn A",
      rating: 5,
      comment: "Sản phẩm rất đẹp, chất lượng tốt. Đóng gói cẩn thận, giao hàng nhanh. Rất hài lòng!",
      date: "2024-11-01",
      images: [] as string[],
    },
    {
      id: 2,
      customerName: "Trần Thị B",
      rating: 5,
      comment: "Hộp quà rất tinh tế, sản phẩm bên trong chất lượng cao. Sẽ mua lại!",
      date: "2024-10-28",
      images: [] as string[],
    },
    {
      id: 3,
      customerName: "Lê Văn C",
      rating: 4,
      comment: "Sản phẩm đẹp nhưng giá hơi cao. Chất lượng tốt.",
      date: "2024-10-25",
      images: [] as string[],
    },
  ];

  const averageRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    percentage: reviews.length > 0 ? (reviews.filter((r) => r.rating === star).length / reviews.length) * 100 : 0,
  }));

  const StarRating = ({ rating = 5, size = "md" }: { rating?: number; size?: "sm" | "md" | "lg" }) => {
    const sizeClasses = {
      sm: "h-3.5 w-3.5",
      md: "h-4 w-4",
      lg: "h-5 w-5",
    };
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`${sizeClasses[size]} ${star <= rating ? "text-amber-400" : "text-gray-300"}`}
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
    <div className="py-4">
      {/* Rating Summary */}
      <div className="mb-8 rounded-xl bg-gradient-to-br from-gray-50 to-blue-50 p-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="text-center">
            <div className="mb-3">
              <span className="text-5xl font-bold text-gray-900">{averageRating.toFixed(1)}</span>
              <span className="text-2xl text-gray-500">/5</span>
            </div>
            <div className="mb-3 flex justify-center">
              <StarRating rating={Math.round(averageRating * 2) / 2} size="lg" />
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">({reviews.length} đánh giá)</span>
            </div>
          </div>
          <div className="md:col-span-2">
            <div className="space-y-3">
              {ratingCounts.map(({ star, count, percentage }) => (
                <div key={star} className="flex items-center gap-3">
                  <span className="w-16 text-sm font-medium text-gray-700">{star} sao</span>
                  <div className="flex-1">
                    <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                      <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                  <span className="w-12 text-right text-sm font-medium text-gray-600">({count})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-500">Chưa có đánh giá nào</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700">
                  <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-3">
                    <span className="font-bold text-gray-900">{review.customerName}</span>
                    <StarRating rating={review.rating} size="sm" />
                    <span className="text-xs text-gray-500">{new Date(review.date).toLocaleDateString("vi-VN")}</span>
                  </div>
                  <p className="leading-relaxed text-gray-700">{review.comment}</p>
                  {review.images && review.images.length > 0 && (
                    <div className="mt-3 flex gap-2">
                      {review.images.map((img, idx) => (
                        <Image key={idx} src={img} alt={`Review image ${idx + 1}`} width={80} height={80} className="rounded-lg" />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;
