"use client";

import ProductCard from "@/components/homepage/ProductCard";
import { useDetailProduct, useListProductsForWeb } from "@/hooks/useProducts";
import { DetailProductResponse } from "@/types-openapi/api";
import { Button, Col, Empty, Image, InputNumber, Row, Spin, Typography } from "antd";
import { GiftOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState, useEffect } from "react";

const { Title, Text } = Typography;

const ProductDetailPage = () => {
  const params = useParams();
  const productId = Number(params.id);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const autoSlide = true; // Auto slide enabled
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

  return (
    <div className="min-h-screen bg-gray-100">
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
                          <Image
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

              {product.category && (
                <div className="mb-4">
                  <Text type="secondary">Danh mục: </Text>
                  <Text strong>{product.category}</Text>
                </div>
              )}

              <div className="mb-4">
                {isOutOfStock ? (
                  <div className="flex items-center gap-3">
                    <Image
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
                    <Image
                      src="https://caulong365.store/web-logo/caulong365_ver3.png"
                      alt="CauLong365.Store"
                      className="ml-2 inline-block h-6"
                      style={{ verticalAlign: "middle" }}
                    />
                  </Text>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Image
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
                    <Image
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
                    <Image
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
                    <Image
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
                    <Image
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
                </>
              )}
            </div>
          </Col>
        </Row>

        {/* Product Description */}
        <div className="mb-12 rounded-lg bg-white p-6 shadow-sm">
          <Title level={3} className="mb-4">
            Mô tả sản phẩm
          </Title>
                  <div className="py-4">
                    {product.description ? (
                      <div dangerouslySetInnerHTML={{ __html: product.description }} />
                    ) : (
                      <Text type="secondary">Chưa có mô tả sản phẩm</Text>
                    )}
                  </div>
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

export default ProductDetailPage;

