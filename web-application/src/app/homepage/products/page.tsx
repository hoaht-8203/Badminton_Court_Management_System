"use client";

import ProductCard from "@/components/homepage/ProductCard";
import { useListProductsForWeb } from "@/hooks/useProducts";
import { useMemo, useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

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

  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      const decodedCategory = decodeURIComponent(categoryParam);
      setSelectedCategories([decodedCategory]);
      setCurrentPage(1);
    }
  }, [searchParams]);

  const { data: productsData, isLoading } = useListProductsForWeb({
    name: searchTerm || undefined,
  });

  const allProducts = useMemo(() => productsData?.data ?? [], [productsData?.data]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    allProducts.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats).sort();
  }, [allProducts]);

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...allProducts];

    if (selectedCategories.length > 0) {
      filtered = filtered.filter((product) => product.category && selectedCategories.includes(product.category));
    }

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

    if (stockStatus === "out-of-stock") {
      filtered = filtered.filter((product) => {
        const stock = product.stock;
        return stock === undefined || stock === null || Number(stock) === 0;
      });
    } else {
      filtered = filtered.filter((product) => {
        const stock = product.stock;
        if (stock === undefined || stock === null) {
          return false;
        }
        return Number(stock) > 0;
      });
    }

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

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredAndSortedProducts.slice(startIndex, endIndex);
  }, [filteredAndSortedProducts, currentPage, pageSize]);

  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedCategories([]);
    setPriceRange(null);
    setStockStatus("in-stock");
    setSortBy("default");
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredAndSortedProducts.length / pageSize);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8 lg:px-6">
        {/* Header Section */}
        <div className="mb-8">
          <nav className="mb-4 flex items-center gap-2 text-sm text-gray-600">
            <Link href="/homepage" className="transition-colors hover:text-blue-600">
              Trang chủ
            </Link>
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="font-medium text-gray-900">Sản phẩm</span>
          </nav>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Danh sách sản phẩm</h1>
              <p className="mt-2 text-gray-600">Khám phá bộ sưu tập sản phẩm chất lượng cao của chúng tôi</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Sắp xếp:</label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as SortOption);
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
              >
                <option value="default">Mặc định</option>
                <option value="price-asc">Giá: Thấp đến cao</option>
                <option value="price-desc">Giá: Cao đến thấp</option>
                <option value="name-asc">Tên: A-Z</option>
                <option value="name-desc">Tên: Z-A</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Enhanced Sidebar Filter */}
          <aside className="lg:col-span-1">
            <div className="sticky top-8 rounded-2xl bg-white p-6 shadow-lg">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Bộ lọc</h2>
                <button onClick={handleClearFilters} className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700">
                  Xóa tất cả
                </button>
              </div>

              {/* Search */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-semibold text-gray-700">Tìm kiếm</label>
                <div className="relative">
                  <svg
                    className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Tên sản phẩm..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      handleFilterChange();
                    }}
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2.5 pr-4 pl-10 text-sm transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 focus:outline-none"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        handleFilterChange();
                      }}
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <label className="mb-3 block text-sm font-semibold text-gray-700">Danh mục</label>
                <div className="space-y-2">
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={selectedCategories.length === 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCategories([]);
                        } else {
                          setSelectedCategories(categories);
                        }
                        handleFilterChange();
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Tất cả</span>
                  </label>
                  {categories.map((cat) => (
                    <label key={cat} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCategories([...selectedCategories, cat]);
                          } else {
                            setSelectedCategories(selectedCategories.filter((c) => c !== cat));
                          }
                          handleFilterChange();
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Stock Status Filter */}
              <div className="mb-6">
                <label className="mb-3 block text-sm font-semibold text-gray-700">Trạng thái</label>
                <div className="space-y-2">
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50">
                    <input
                      type="radio"
                      name="stockStatus"
                      value="in-stock"
                      checked={stockStatus === "in-stock"}
                      onChange={(e) => {
                        setStockStatus(e.target.value);
                        handleFilterChange();
                      }}
                      className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Còn hàng</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50">
                    <input
                      type="radio"
                      name="stockStatus"
                      value="out-of-stock"
                      checked={stockStatus === "out-of-stock"}
                      onChange={(e) => {
                        setStockStatus(e.target.value);
                        handleFilterChange();
                      }}
                      className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Hết hàng</span>
                  </label>
                </div>
              </div>

              {/* Price Filter */}
              <div className="mb-6">
                <label className="mb-3 block text-sm font-semibold text-gray-700">Khoảng giá</label>
                <div className="space-y-2">
                  {[
                    { value: "under-100k", label: "< 100.000₫" },
                    { value: "100k-300k", label: "100.000₫ - 300.000₫" },
                    { value: "300k-500k", label: "300.000₫ - 500.000₫" },
                    { value: "500k-1m", label: "500.000₫ - 1.000.000₫" },
                    { value: "over-1m", label: "> 1.000.000₫" },
                  ].map((option) => (
                    <label key={option.value} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50">
                      <input
                        type="radio"
                        name="priceRange"
                        value={option.value}
                        checked={priceRange === option.value}
                        onChange={(e) => {
                          setPriceRange(e.target.value);
                          handleFilterChange();
                        }}
                        className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            {isLoading ? (
              <div className="flex min-h-[400px] items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
                  <p className="mt-4 text-gray-600">Đang tải sản phẩm...</p>
                </div>
              </div>
            ) : filteredAndSortedProducts.length === 0 ? (
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
                <p className="mt-2 text-gray-500">Thử điều chỉnh bộ lọc của bạn để xem thêm kết quả</p>
              </div>
            ) : (
              <>
                {/* Results Count */}
                <div className="mb-6 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Hiển thị <span className="font-semibold text-gray-900">{paginatedProducts.length}</span> trong tổng số{" "}
                    <span className="font-semibold text-gray-900">{filteredAndSortedProducts.length}</span> sản phẩm
                  </p>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {paginatedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Enhanced Pagination */}
                {totalPages > 1 && (
                  <div className="mt-10 flex flex-col items-center gap-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white disabled:hover:shadow-sm"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Trước
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                          if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                            return (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                                  currentPage === page
                                    ? "bg-blue-600 text-white shadow-md"
                                    : "border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 hover:shadow-md"
                                }`}
                              >
                                {page}
                              </button>
                            );
                          } else if (page === currentPage - 2 || page === currentPage + 2) {
                            return (
                              <span key={page} className="px-2 text-gray-400">
                                ...
                              </span>
                            );
                          }
                          return null;
                        })}
                      </div>
                      <button
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white disabled:hover:shadow-sm"
                      >
                        Sau
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Trang {currentPage} / {totalPages}
                    </p>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

const AllProductsPageWrapper = () => {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
        </div>
      }
    >
      <AllProductsPage />
    </Suspense>
  );
};

export default AllProductsPageWrapper;
