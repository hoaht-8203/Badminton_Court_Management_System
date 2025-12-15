"use client";

import ProductCard from "@/components/homepage/ProductCard";
import { useListProductsForWeb } from "@/hooks/useProducts";
import { Button, Checkbox, Col, Empty, Input, Pagination, Radio, Row, Select, Spin, Typography } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useMemo, useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const { Title } = Typography;

type SortOption = "default" | "price-asc" | "price-desc" | "name-asc" | "name-desc";

const AllProductsPage = () => {
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<string | null>(null);
  const [stockStatus, setStockStatus] = useState<string | null>("in-stock");
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 12;

  // Đọc category từ URL query parameter
  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      const decodedCategory = decodeURIComponent(categoryParam);
      setSelectedCategories([decodedCategory]);
      setCurrentPage(1); // Reset về trang 1 khi filter
    }
  }, [searchParams]);

  const { data: productsData, isLoading } = useListProductsForWeb({
    name: searchTerm || undefined,
  });

  const allProducts = productsData?.data ?? [];

  // Lấy danh sách categories duy nhất từ products
  const categories = useMemo(() => {
    const cats = new Set<string>();
    allProducts.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats).sort();
  }, [allProducts]);

  // Filter và sort products
  const filteredAndSortedProducts = useMemo(() => {
    // Bắt đầu với tất cả sản phẩm
    let filtered = [...allProducts];

    // Filter theo category
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((product) => product.category && selectedCategories.includes(product.category));
    }

    // Filter theo giá
    if (priceRange) {
      filtered = filtered.filter((product) => {
        const price = product.salePrice ?? 0;
        switch (priceRange) {
          case "under-100k":
            return price < 100000;
          case "100k-300k":
            return price >= 100000 && price < 300000;
          case "300k-500k":
            return price >= 300000 && price < 500000;
          case "500k-1m":
            return price >= 500000 && price < 1000000;
          case "over-1m":
            return price >= 1000000;
          default:
            return true;
        }
      });
    }

    // Filter theo trạng thái tồn kho
    // Mặc định chỉ hiển thị sản phẩm còn hàng, trừ khi người dùng chọn "Hết hàng"
    if (stockStatus === "out-of-stock") {
      // Chỉ hiển thị sản phẩm hết hàng (stock = 0, null, hoặc undefined)
      filtered = filtered.filter((product) => {
        const stock = product.stock;
        return stock === undefined || stock === null || Number(stock) === 0;
      });
    } else {
      // Mặc định (all hoặc in-stock): chỉ hiển thị sản phẩm còn hàng
      filtered = filtered.filter((product) => {
        const stock = product.stock;
        // Chỉ hiển thị nếu stock > 0
        if (stock === undefined || stock === null) {
          return false;
        }
        return Number(stock) > 0;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
          return (a.salePrice ?? 0) - (b.salePrice ?? 0);
        case "price-desc":
          return (b.salePrice ?? 0) - (a.salePrice ?? 0);
        case "name-asc":
          return (a.name ?? "").localeCompare(b.name ?? "");
        case "name-desc":
          return (b.name ?? "").localeCompare(a.name ?? "");
        default:
          return 0;
      }
    });

    return filtered;
  }, [allProducts, selectedCategories, priceRange, stockStatus, sortBy]);

  // Tính toán sản phẩm cho trang hiện tại
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredAndSortedProducts.slice(startIndex, endIndex);
  }, [filteredAndSortedProducts, currentPage, pageSize]);

  // Reset về trang 1 khi filter thay đổi
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const handleFilter = () => {
    // Filter logic is handled in useMemo, this is just for the button
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedCategories([]);
    setPriceRange(null);
    setStockStatus("in-stock");
    setSortBy("default");
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6 text-sm text-gray-600">
          <Link href="/homepage" className="text-gray-600 hover:text-blue-600">
            Trang chủ
          </Link>
          <span className="mx-2">/</span>
          <span className="font-medium text-gray-900">Sản phẩm</span>
        </div>

        <Row gutter={24}>
          {/* Sidebar Filter */}
          <Col xs={24} lg={6}>
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <Title level={4} className="mb-4">
                Bộ lọc
              </Title>

              {/* Search */}
              <div className="mb-6">
                <Input
                  placeholder="Tìm kiếm theo tên sản phẩm..."
                  prefix={<SearchOutlined />}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    handleFilterChange();
                  }}
                  allowClear
                />
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <Title level={5} className="mb-3 text-base">
                  Danh mục
                </Title>
                <Checkbox.Group
                  value={selectedCategories.length === 0 ? ["all"] : selectedCategories}
                  onChange={(values) => {
                    // Lọc ra các giá trị không phải "all"
                    const categoryValues = values.filter((v) => v !== "all") as string[];
                    
                    // Nếu chỉ chọn "Tất cả sản phẩm" (có "all" và không có category nào)
                    if (values.includes("all") && categoryValues.length === 0) {
                      setSelectedCategories([]);
                    }
                    // Nếu chọn category khác (có category trong values)
                    else {
                      setSelectedCategories(categoryValues);
                    }
                    handleFilterChange();
                  }}
                  className="flex flex-col gap-2"
                >
                  <Checkbox value="all">Tất cả sản phẩm</Checkbox>
                  {categories.map((cat) => (
                    <Checkbox key={cat} value={cat}>
                      {cat}
                    </Checkbox>
                  ))}
                </Checkbox.Group>
              </div>

              {/* Stock Status Filter */}
              <div className="mb-6">
                <Title level={5} className="mb-3 text-base">
                  Trạng thái
                </Title>
                <Radio.Group
                  value={stockStatus}
                  onChange={(e) => {
                    setStockStatus(e.target.value);
                    handleFilterChange();
                  }}
                  className="flex flex-col gap-2"
                >
                  <Radio value="in-stock">Còn hàng</Radio>
                  <Radio value="out-of-stock">Hết hàng</Radio>
                </Radio.Group>
              </div>

              {/* Price Filter */}
              <div className="mb-6">
                <Title level={5} className="mb-3 text-base">
                  Lọc theo giá
                </Title>
                <Radio.Group
                  value={priceRange}
                  onChange={(e) => {
                    setPriceRange(e.target.value);
                    handleFilterChange();
                  }}
                  className="flex flex-col gap-2"
                >
                  <Radio value="under-100k">&lt; 100.000₫</Radio>
                  <Radio value="100k-300k">100.000₫ - 300.000₫</Radio>
                  <Radio value="300k-500k">300.000₫ - 500.000₫</Radio>
                  <Radio value="500k-1m">500.000₫ - 1.000.000₫</Radio>
                  <Radio value="over-1m">&gt; 1.000.000₫</Radio>
                </Radio.Group>
              </div>

              {/* Filter Buttons */}
              <div className="flex flex-col gap-2">
                <Button type="primary" block onClick={handleFilter}>
                  Lọc sản phẩm
                </Button>
                <Button block onClick={handleClearFilters}>
                  Xóa bộ lọc
                </Button>
              </div>
            </div>
          </Col>

          {/* Main Content */}
          <Col xs={24} lg={18}>
            <div className="mb-6 flex items-center justify-between">
              <Title level={2} className="mb-0">
                Sản phẩm
              </Title>
              <Select
                value={sortBy}
                onChange={(value) => {
                  setSortBy(value);
                  setCurrentPage(1);
                }}
                style={{ width: 200 }}
                options={[
                  { label: "Mặc định", value: "default" },
                  { label: "Giá: Thấp đến cao", value: "price-asc" },
                  { label: "Giá: Cao đến thấp", value: "price-desc" },
                  { label: "Tên: A-Z", value: "name-asc" },
                  { label: "Tên: Z-A", value: "name-desc" },
                ]}
              />
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Spin size="large" />
              </div>
            ) : filteredAndSortedProducts.length === 0 ? (
              <Empty description="Không tìm thấy sản phẩm nào" />
            ) : (
              <>
                <Row gutter={[24, 24]}>
                  {paginatedProducts.map((product) => (
                    <Col key={product.id} xs={24} sm={12} lg={8}>
                      <ProductCard product={product} />
                    </Col>
                  ))}
                </Row>
                <div className="mt-6 flex justify-center">
                  <Pagination
                    current={currentPage}
                    total={filteredAndSortedProducts.length}
                    pageSize={pageSize}
                    onChange={(page) => setCurrentPage(page)}
                    showSizeChanger={false}
                    showTotal={(total, range) => `${range[0]}-${range[1]} của ${total} sản phẩm`}
                  />
                </div>
              </>
            )}
          </Col>
        </Row>
      </div>
    </div>
  );
};

const AllProductsPageWrapper = () => {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    }>
      <AllProductsPage />
    </Suspense>
  );
};

export default AllProductsPageWrapper;
