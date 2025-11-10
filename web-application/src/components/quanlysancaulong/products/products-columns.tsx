"use client";

import { ListProductResponse } from "@/types-openapi/api";
import { TableProps, Tag } from "antd";
import { useDetailProduct } from "@/hooks/useProducts";
import { useMemo, useState, useEffect } from "react";
import { productService } from "@/services/productService";

// Custom component to fetch and display stock data for each row
export const StockCell = ({ productId }: { productId: number }) => {
  const { data: detail } = useDetailProduct({ id: productId }, true);
  const stockValue = useMemo(() => detail?.data?.stock ?? 0, [detail?.data?.stock]);

  return <span>{stockValue}</span>;
};

// Custom component to fetch and display cost price data for each row
const CostPriceCell = ({ productId }: { productId: number }) => {
  const { data: detail } = useDetailProduct({ id: productId }, true);
  const costPrice = useMemo(() => detail?.data?.costPrice ?? 0, [detail?.data?.costPrice]);

  return <span>{costPrice.toLocaleString("vi-VN")}</span>;
};

export const productColumns: TableProps<ListProductResponse>["columns"] = [
  {
    title: "Mã hàng",
    dataIndex: "code",
    key: "code",
    width: 150,
    fixed: "left",
    render: (text, record) => {
      if ((record as any).isSummaryRow) return "";
      return text;
    },
  },
  {
    title: "Tên hàng",
    dataIndex: "name",
    key: "name",
    width: 220,
    render: (text, record) => {
      if ((record as any).isSummaryRow) return "";
      return text;
    },
  },
  {
    title: "Nhóm hàng",
    dataIndex: "category",
    key: "category",
    width: 150,
    render: (text, record) => {
      if ((record as any).isSummaryRow) return "";
      return text;
    },
  },

  {
    title: "Giá bán",
    dataIndex: "salePrice",
    key: "salePrice",
    width: 120,
    render: (price, record) => {
      if ((record as any).isSummaryRow) return "";
      return price ? `${Number(price).toLocaleString("vi-VN")}` : "-";
    },
  },
  {
    title: "Giá nhập",
    key: "costPrice",
    width: 120,
    render: (_, record) => {
      if ((record as any).isSummaryRow) return <span className="font-bold text-black">0</span>;
      return <CostPriceCell productId={record.id!} />;
    },
  },
  {
    title: "Tồn kho",
    key: "stock",
    width: 120,
    render: (_, record) => {
      if ((record as any).isSummaryRow) {
        return <StockSummaryCellWithContext productIds={[]} />;
      }
      return <StockCell productId={record.id!} />;
    },
  },
  {
    title: "Trạng thái",
    dataIndex: "isActive",
    key: "isActive",
    width: 150,
    render: (v: boolean | undefined, record: any) => {
      if ((record as any).isSummaryRow) return "";
      return <Tag color={v ? "green" : "red"}>{v ? "Kinh doanh" : "Ngừng kinh doanh"}</Tag>;
    },
  },
  {
    title: "Hiện trên web",
    dataIndex: "isDisplayOnWeb",
    key: "isDisplayOnWeb",
    width: 130,
    render: (v: boolean | undefined, record: any) => {
      if ((record as any).isSummaryRow) return "";
      return <Tag color={v ? "blue" : "default"}>{v ? "Hiện" : "Ẩn"}</Tag>;
    },
  },
];

// Component để tính tổng tồn kho - sử dụng service
export const StockSummaryCell = ({ productIds }: { productIds: number[] }) => {
  const [totalStock, setTotalStock] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calculateTotalStock = async () => {
      setLoading(true);
      try {
        let total = 0;
        for (const productId of productIds) {
          try {
            const res = await productService.detail({ id: productId });
            total += res.data?.stock ?? 0;
          } catch (error) {
            console.error(`Error fetching stock for product ${productId}:`, error);
          }
        }
        setTotalStock(total);
      } catch (error) {
        console.error("Error calculating total stock:", error);
      } finally {
        setLoading(false);
      }
    };

    if (productIds.length > 0) {
      calculateTotalStock();
    } else {
      setTotalStock(0);
      setLoading(false);
    }
  }, [productIds]);

  if (loading) return <span>...</span>;
  return <span className="font-bold text-black">{totalStock.toLocaleString("vi-VN")}</span>;
};

// Component để tính tổng tồn kho từ dữ liệu có sẵn - sử dụng service
export const StockSummaryCellWithContext = ({ productIds }: { productIds: number[] }) => {
  const [totalStock, setTotalStock] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calculateTotalStock = async () => {
      setLoading(true);
      try {
        let total = 0;
        // Sử dụng service để lấy stock cho từng sản phẩm
        for (const productId of productIds) {
          try {
            const res = await productService.detail({ id: productId });
            total += res.data?.stock ?? 0;
          } catch (error) {
            console.error(`Error fetching stock for product ${productId}:`, error);
          }
        }
        setTotalStock(total);
      } catch (error) {
        console.error("Error calculating total stock:", error);
      } finally {
        setLoading(false);
      }
    };

    if (productIds.length > 0) {
      calculateTotalStock();
    } else {
      setTotalStock(0);
      setLoading(false);
    }
  }, [productIds]);

  if (loading) return <span>...</span>;
  return <span className="font-bold text-black">{totalStock.toLocaleString("vi-VN")}</span>;
};
