"use client";

import ProductCard from "@/components/homepage/ProductCard";
import SnowEffect from "@/components/homepage/SnowEffect";
import { useDetailProduct, useListProductsForWeb } from "@/hooks/useProducts";
import { DetailProductResponse } from "@/types-openapi/api";
import { Avatar, Button, Col, Divider, Empty, Image, InputNumber, Rate, Row, Spin, Tabs, Typography, message } from "antd";
import { UserOutlined, GiftOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState, useEffect } from "react";

const { Title, Text } = Typography;

const ProductDetailPage = () => {
  const params = useParams();
  const productId = Number(params.id);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [autoSlide, setAutoSlide] = useState(true);
  const [relatedProductsIndex, setRelatedProductsIndex] = useState(0);

  // Auto scroll to top when page loads
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [productId]);

  const { data: productData, isLoading } = useDetailProduct({ id: productId }, !!productId);
  const product = productData?.data as DetailProductResponse | undefined;
  const images = product?.images || [];

  // Auto slide images - Phải đặt trước các điều kiện return
  useEffect(() => {
    if (!autoSlide || images.length <= 1) return;

    const interval = setInterval(() => {
      setSelectedImageIndex((prev) => (prev + 1) % images.length);
    }, 3000); // Chuyển ảnh mỗi 3 giây

    return () => clearInterval(interval);
  }, [autoSlide, images.length]);

  // Lấy sản phẩm liên quan (cùng category)
  const { data: relatedProductsData } = useListProductsForWeb({
    category: product?.category || undefined,
  });

  const relatedProducts = useMemo(() => {
    if (!relatedProductsData?.data || !product) return [];
    // Lọc bỏ sản phẩm hiện tại và các sản phẩm sold out (stock = 0)
    return relatedProductsData.data.filter((p) => {
      const stock = p.stock ?? 0;
      return p.id !== product.id && stock > 0;
    });
  }, [relatedProductsData?.data, product]);

  // Hiển thị 4 sản phẩm mỗi lần
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


  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Empty description="Không tìm thấy sản phẩm" />
      </div>
    );
  }

  const stock = product.stock ?? 0;
  const isOutOfStock = stock === 0;
  const maxQuantity = Math.min(stock, 999);

  const handleZaloContact = () => {
    // TODO: Thay bằng số Zalo thực tế
    const zaloPhone = "0123456789"; // Số Zalo
    window.open(`https://zalo.me/${zaloPhone}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <SnowEffect />
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6 text-sm text-gray-600">
          <Link href="/homepage" className="text-gray-600 hover:text-blue-600">
            Trang chủ
          </Link>
          <span className="mx-2">/</span>
          <Link href="/homepage/products" className="text-gray-600 hover:text-blue-600">
            Sản phẩm
          </Link>
          {product.category && (
            <>
              <span className="mx-2">/</span>
              <Link 
                href={`/homepage/products?category=${encodeURIComponent(product.category)}`} 
                className="text-gray-600 hover:text-blue-600"
              >
                {product.category}
              </Link>
            </>
          )}
          <span className="mx-2">/</span>
          <span className="font-medium text-gray-900">{product.name}</span>
        </div>

        {/* Product Detail */}
        <Row gutter={[32, 32]} className="mb-12">
          {/* Product Images */}
          <Col xs={24} lg={12}>
            <div className="rounded-lg bg-white p-4 shadow-sm">
              {images.length > 0 ? (
                <>
                  <div className="mb-4">
                    <div className="relative aspect-square w-full overflow-hidden rounded-lg">
                      <Image
                        src={images[selectedImageIndex]}
                        alt={product.name ?? "Product image"}
                        width={600}
                        height={600}
                        className={`object-contain transition-opacity duration-500 ${isOutOfStock ? "opacity-50" : ""}`}
                        preview={false}
                      />
                      {isOutOfStock && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center">
                          <img
                            src="https://png.pngtree.com/png-vector/20250506/ourmid/pngtree-sold-out-label-stamp-in-red-with-rectangular-border-for-limited-vector-png-image_16099397.png"
                            alt="Sold Out"
                            width={200}
                            height={100}
                            className="object-contain drop-shadow-lg"
                            style={{ maxWidth: "70%", maxHeight: "70%" }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  {images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto">
                      {images.map((img, index) => (
                        <div
                          key={index}
                          className={`relative h-20 w-20 flex-shrink-0 cursor-pointer overflow-hidden rounded border-2 transition-all ${
                            selectedImageIndex === index ? "border-blue-500" : "border-gray-200"
                          }`}
                          onClick={() => setSelectedImageIndex(index)}
                        >
                          <Image
                            src={img}
                            alt={`${product.name} ${index + 1}`}
                            width={80}
                            height={80}
                            className="object-contain"
                            preview={false}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex aspect-square w-full items-center justify-center bg-gray-100 rounded-lg">
                  <Text type="secondary">Không có hình ảnh</Text>
                </div>
              )}
            </div>
          </Col>

          {/* Product Info */}
          <Col xs={24} lg={12}>
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <Title 
                level={1} 
                className="mb-4"
                style={{ 
                  fontSize: "32px",
                  fontFamily: '-apple-system, "system-ui", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"'
                }}
              >
                {product.name}
              </Title>

              {product.code && (
                <div className="mb-4">
                  <Text type="secondary">Mã sản phẩm: </Text>
                  <Text strong>{product.code}</Text>
                </div>
              )}

              <div className="mb-6">
                <Text
                  strong
                  className="block font-bold text-red-600"
                  style={{
                    fontSize: "32px",
                    fontFamily: "'Inter', 'Roboto', sans-serif",
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    lineHeight: "1.2",
                  }}
                >
                  {formatPrice(product.salePrice)}
                </Text>
              </div>

              <div className="mb-4 flex items-center gap-2">
                <Rate disabled defaultValue={5} />
                <Text type="secondary">(70 đánh giá của khách hàng)</Text>
              </div>

              {product.category && (
                <div className="mb-4">
                  <Text type="secondary">Danh mục: </Text>
                  <Text strong>{product.category}</Text>
                </div>
              )}

              <div className="mb-4">
                {isOutOfStock ? (
                  <div className="flex items-center gap-3">
                    <img
                      src="https://png.pngtree.com/png-vector/20250506/ourmid/pngtree-sold-out-label-stamp-in-red-with-rectangular-border-for-limited-vector-png-image_16099397.png"
                      alt="Sold Out"
                      width={100}
                      height={50}
                      className="object-contain"
                    />
                    <Text type="danger" strong>
                      Tình trạng: Hết hàng
                    </Text>
                  </div>
                ) : (
                  <>
                    <Text type="success" strong>
                      Tình trạng: Còn hàng
                    </Text>
                    <div className="mt-2">
                      <Text type="secondary">Số lượng còn lại: </Text>
                      <Text strong>{stock}</Text>
                    </div>
                  </>
                )}
              </div>

              {!isOutOfStock && (
                <>
                  <div className="mb-6">
                    <Text className="mb-2 block font-medium">Số lượng:</Text>
                    <InputNumber
                      min={1}
                      max={maxQuantity}
                      value={quantity}
                      onChange={(value) => setQuantity(value || 1)}
                      controls
                      style={{ width: 120 }}
                    />
                  </div>

                  {/* Additional Offers */}
                  <div className="mb-6 rounded-lg border border-orange-200 bg-orange-50 p-4">
                <style dangerouslySetInnerHTML={{__html: `
                  @keyframes gentleShake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-2px) rotate(-1deg); }
                    75% { transform: translateX(2px) rotate(1deg); }
                  }
                  .shake-offer-header {
                    animation: gentleShake 2s ease-in-out infinite;
                  }
                `}} />
                <div className="mb-3 flex items-center gap-2 shake-offer-header">
                  <GiftOutlined style={{ fontSize: "20px", color: "#ff4d4f" }} />
                  <Text strong style={{ fontSize: "16px" }}>
                    <span className="text-gray-800">Ưu đãi thêm khi mua sản phẩm tại </span>
                    <img
                      src="http://localhost:3000/web-logo/caulong365_ver3.png"
                      alt="CauLong365.Store"
                      className="ml-2 inline-block h-6"
                      style={{ verticalAlign: "middle" }}
                    />
                  </Text>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <img
                      src="https://res.cloudinary.com/dafzz2c9j/image/upload/v1762582034/png-clipart-checked-logo-check-mark-green-check-angle-leaf-thumbnail-removebg-preview_xdfzob.png"
                      alt="check"
                      className="mt-0.5 h-5 w-5 flex-shrink-0"
                    />
                    <Text className="text-sm">
                      <span style={{ color: "#ff6b35" }}>Sơn logo mặt vợt</span>
                      <span className="text-gray-700"> miễn phí</span>
                    </Text>
                  </div>
                  <div className="flex items-start gap-2">
                    <img
                      src="https://e7.pngegg.com/pngimages/405/55/png-clipart-checked-logo-check-mark-green-check-angle-leaf-thumbnail.png"
                      alt="check"
                      className="mt-0.5 h-5 w-5 flex-shrink-0"
                    />
                    <Text className="text-sm">
                      <span style={{ color: "#ff6b35" }}>Bảo hành lưới đan</span>
                      <span className="text-gray-700"> trong 72 giờ</span>
                    </Text>
                  </div>
                  <div className="flex items-start gap-2">
                    <img
                      src="https://e7.pngegg.com/pngimages/405/55/png-clipart-checked-logo-check-mark-green-check-angle-leaf-thumbnail.png"
                      alt="check"
                      className="mt-0.5 h-5 w-5 flex-shrink-0"
                    />
                    <Text className="text-sm">
                      <span style={{ color: "#ff6b35" }}>Thay gen vợt</span>
                      <span className="text-gray-700"> miễn phí trọn đời</span>
                    </Text>
                  </div>
                  <div className="flex items-start gap-2">
                    <img
                      src="https://e7.pngegg.com/pngimages/405/55/png-clipart-checked-logo-check-mark-green-check-angle-leaf-thumbnail.png"
                      alt="check"
                      className="mt-0.5 h-5 w-5 flex-shrink-0"
                    />
                    <Text className="text-sm">
                      <span style={{ color: "#ff6b35" }}>Tích luỹ điểm thành viên</span>
                      <span className="text-gray-700"> Premium</span>
                    </Text>
                  </div>
                  <div className="flex items-start gap-2">
                    <img
                      src="https://e7.pngegg.com/pngimages/405/55/png-clipart-checked-logo-check-mark-green-check-angle-leaf-thumbnail.png"
                      alt="check"
                      className="mt-0.5 h-5 w-5 flex-shrink-0"
                    />
                    <Text className="text-sm">
                      <span style={{ color: "#ff6b35" }}>Voucher giảm giá</span>
                      <span className="text-gray-700"> cho lần mua hàng tiếp theo</span>
                    </Text>
                  </div>
                </div>
              </div>

                  <div className="mb-4">
                    <style dangerouslySetInnerHTML={{__html: `
                      @keyframes gentlePulse {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.03); }
                      }
                      .zalo-button-pulse {
                        animation: gentlePulse 2s ease-in-out infinite;
                      }
                    `}} />
                    <Button
                      type="default"
                      size="large"
                      onClick={handleZaloContact}
                      className="zalo-button-pulse w-full transition-all duration-300 hover:opacity-90 hover:shadow-lg"
                      style={{ backgroundColor: "#0068FF", color: "white", borderColor: "#0068FF" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#0052CC";
                        e.currentTarget.style.animation = "none";
                        e.currentTarget.style.transform = "translateY(-2px) scale(1.05)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#0068FF";
                        e.currentTarget.style.animation = "";
                        e.currentTarget.style.transform = "";
                      }}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <img
                          src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Icon_of_Zalo.svg/2048px-Icon_of_Zalo.svg.png"
                          alt="Zalo"
                          className="h-5 w-5 transition-transform duration-300 group-hover:scale-110"
                        />
                        <span>Liên hệ Zalo</span>
                      </div>
                    </Button>
                  </div>
                </>
              )}
            </div>
          </Col>
        </Row>

        {/* Product Description Tabs */}
        <div className="mb-12 rounded-lg bg-white p-6 shadow-sm">
          <Tabs
            defaultActiveKey="description"
            items={[
              {
                key: "description",
                label: "Mô tả sản phẩm",
                children: (
                  <div className="py-4">
                    {product.description ? (
                      <div dangerouslySetInnerHTML={{ __html: product.description }} />
                    ) : (
                      <Text type="secondary">Chưa có mô tả sản phẩm</Text>
                    )}
                  </div>
                ),
              },
              {
                key: "reviews",
                label: "Đánh giá",
                children: <ProductReviews productId={productId} />,
              },
            ]}
          />
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <Title level={2} className="mb-0">
                Sản phẩm liên quan
              </Title>
              {totalPages > 1 && (
                <div className="flex gap-2">
                  <Button
                    icon={<LeftOutlined />}
                    onClick={handlePrevRelated}
                    disabled={relatedProductsIndex === 0}
                  >
                    Trước
                  </Button>
                  <Button
                    icon={<RightOutlined />}
                    onClick={handleNextRelated}
                    disabled={relatedProductsIndex >= totalPages - 1}
                  >
                    Sau
                  </Button>
                </div>
              )}
            </div>
            <Row gutter={[24, 24]}>
              {displayedProducts.map((relatedProduct) => (
                <Col key={relatedProduct.id} xs={24} sm={12} lg={6}>
                  <ProductCard product={relatedProduct} />
                </Col>
              ))}
            </Row>
          </div>
        )}
      </div>
    </div>
  );
};

// Component hiển thị đánh giá sản phẩm
const ProductReviews = ({ productId }: { productId: number }) => {
  // TODO: Lấy đánh giá từ API
  // Tạm thời sử dụng dữ liệu mẫu
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

  return (
    <div className="py-4">
      {/* Rating Summary */}
      <div className="mb-8 rounded-lg bg-gray-50 p-6">
        <Row gutter={24}>
          <Col xs={24} md={8} className="text-center">
            <div className="mb-2">
              <Text strong className="text-4xl">
                {averageRating.toFixed(1)}
              </Text>
              <Text className="text-xl text-gray-500">/5</Text>
            </div>
            <Rate disabled value={averageRating} allowHalf className="mb-2" />
            <div>
              <Text type="secondary">({reviews.length} đánh giá)</Text>
            </div>
          </Col>
          <Col xs={24} md={16}>
            <div className="space-y-2">
              {ratingCounts.map(({ star, count, percentage }) => (
                <div key={star} className="flex items-center gap-2">
                  <Text className="w-12 text-sm">{star} sao</Text>
                  <div className="flex-1">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                      <div className="h-full bg-yellow-400" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                  <Text className="w-12 text-right text-sm text-gray-500">({count})</Text>
                </div>
              ))}
            </div>
          </Col>
        </Row>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <div className="py-8 text-center">
            <Text type="secondary">Chưa có đánh giá nào</Text>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
              <div className="mb-3 flex items-start gap-3">
                <Avatar icon={<UserOutlined />} />
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <Text strong>{review.customerName}</Text>
                    <Rate disabled value={review.rating} className="text-sm" />
                    <Text type="secondary" className="text-xs">
                      {new Date(review.date).toLocaleDateString("vi-VN")}
                    </Text>
                  </div>
                  <Text>{review.comment}</Text>
                  {review.images && review.images.length > 0 && (
                    <div className="mt-3 flex gap-2">
                      {review.images.map((img, idx) => (
                        <Image key={idx} src={img} alt={`Review image ${idx + 1}`} width={80} height={80} className="rounded" />
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

