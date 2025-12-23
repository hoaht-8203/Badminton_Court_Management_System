"use client";

// Dynamic imports for better code splitting and initial load performance
import dynamic from "next/dynamic";
import { Suspense, useEffect, useMemo, useState, useCallback, memo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { DayPilot } from "daypilot-pro-react";
import dayjs from "dayjs";

// Lazy load heavy components to reduce initial bundle size
const CheckoutQrDrawer = dynamic(() => import("@/components/quanlysancaulong/court-schedule/checkout-qr-drawer"), {
  ssr: false,
  loading: () => <div>Loading checkout...</div>,
});
const ServiceUsageItem = dynamic(() => import("./_components/ServiceUsageItem"), {
  ssr: false,
  loading: () => <div className="text-xs text-gray-500">Đang tải dịch vụ...</div>,
});
const ServicesTotalCost = dynamic(() => import("./_components/ServicesTotalCost"), {
  ssr: false,
  loading: () => <span>0 đ</span>,
});
const FinalPayableAmount = dynamic(() => import("./_components/FinalPayableAmount"), {
  ssr: false,
  loading: () => <span>0 đ</span>,
});
const CourtTab = dynamic(() => import("./_components/CourtTab"), {
  ssr: false,
  loading: () => <div className="p-3">Đang tải sân...</div>,
});
const MenuTab = dynamic(() => import("./_components/MenuTab"), {
  ssr: false,
  loading: () => <div className="p-3">Đang tải thực đơn...</div>,
});
const ServiceTab = dynamic(() => import("./_components/ServiceTab"), {
  ssr: false,
  loading: () => <div className="p-3">Đang tải dịch vụ...</div>,
});
const PendingPaymentsTab = dynamic(() => import("./_components/PendingPaymentsTab"), {
  ssr: false,
  loading: () => <div className="p-3">Đang tải danh sách đơn...</div>,
});

// Import hooks and services
import { bookingCourtOccurrenceKeys, useDetailBookingCourtOccurrence, useListBookingCourtOccurrences } from "@/hooks/useBookingCourtOccurrence";
import { useListCourts } from "@/hooks/useCourt";
import { useGetCurrentAppliedPrice } from "@/hooks/useProducts";
import { useListServices } from "@/hooks/useServices";
import { usePendingPaymentOrders } from "@/hooks/useOrders";
import { cashierService } from "@/services/cashierService";
import { serviceService } from "@/services/serviceService";
import { ordersService } from "@/services/ordersService";
import {
  CheckoutBookingRequest as CheckoutRequest,
  CheckoutResponse,
  DetailBookingCourtOccurrenceResponse,
  ListProductResponse,
  ListServiceResponse,
} from "@/types-openapi/api";

// Import Antd components (these are relatively lightweight)
import { ReloadOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { Image as AntdImage, Button, Col, Divider, Empty, Input, List, message, Row, Select, Tabs } from "antd";
import { Grid2X2, MenuIcon, Monitor, Wrench, Clock } from "lucide-react";

const CashierPageContent = memo(function CashierPageContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("1");
  const [selectedOccurrenceId, setSelectedOccurrenceId] = useState<string | null>(null);
  const [selectedCourtId, setSelectedCourtId] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<Record<string, { product: ListProductResponse; quantity: number }>>({});
  const [lateFeePercentage, setLateFeePercentage] = useState<number>(150);
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Bank">("Cash");
  const [openCheckoutQr, setOpenCheckoutQr] = useState(false);
  const [checkoutDetail, setCheckoutDetail] = useState<CheckoutResponse | null>(null);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [pendingOrdersFilter, setPendingOrdersFilter] = useState<{ status?: string; paymentMethod?: string }>({});

  const { data: courtsData, isFetching: loadingCourts, refetch: refetchCourts } = useListCourts({});
  const { data: productsData, isFetching: loadingProducts, refetch: refetchProducts } = useGetCurrentAppliedPrice();
  const { data: servicesData, isFetching: loadingServices, refetch: refetchServices } = useListServices({});
  const { data: pendingOrdersData, isFetching: loadingPendingOrders, refetch: refetchPendingOrders } = usePendingPaymentOrders(pendingOrdersFilter);
  // Memoize today's date to prevent infinite re-renders - use same logic as court-schedule.tsx
  const today = useMemo(() => {
    return DayPilot.Date.today().toDate();
  }, []);

  const { data: occurrencesToday } = useListBookingCourtOccurrences({
    fromDate: today,
    toDate: today,
  });
  const { data: occurrenceDetailRes } = useDetailBookingCourtOccurrence({ id: selectedOccurrenceId ?? "" });

  const occurrenceDetail = (occurrenceDetailRes?.data as DetailBookingCourtOccurrenceResponse) || undefined;

  // Preselect occurrence from URL search params (client-safe)
  const sp = useSearchParams();
  useEffect(() => {
    const occurrenceId = sp.get("occurrenceId");

    if (occurrenceId) {
      setSelectedOccurrenceId(occurrenceId);
    }
  }, [sp]);

  // Derive selected court from occurrence (ensures highlight after deep-link or refresh)
  useEffect(() => {
    if (occurrenceDetail?.court?.id) {
      setSelectedCourtId(String(occurrenceDetail.court.id));
    }
  }, [occurrenceDetail]);

  // Memoize callback functions to prevent unnecessary re-renders
  const handleRefreshData = useCallback(() => {
    switch (activeTab) {
      case "1":
        refetchCourts();
        break;
      case "2":
        refetchProducts();
        break;
      case "3":
        refetchServices();
        break;
      case "4":
        refetchPendingOrders();
        break;
      default:
        break;
    }
  }, [activeTab, refetchCourts, refetchProducts, refetchServices, refetchPendingOrders]);

  const refreshAllData = useCallback(() => {
    // Invalidate all relevant queries
    queryClient.invalidateQueries({ queryKey: bookingCourtOccurrenceKeys.lists() });
    queryClient.invalidateQueries({ queryKey: ["courts"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["services"] });
    queryClient.invalidateQueries({ queryKey: ["orders", "pending-payments"] });

    // Refetch current data
    refetchCourts();
    refetchProducts();
    refetchServices();
    refetchPendingOrders();
  }, [queryClient, refetchCourts, refetchProducts, refetchServices, refetchPendingOrders]);

  // Memoize async handlers to prevent unnecessary re-renders
  const handleAddProductToOrder = useCallback(
    async (product: ListProductResponse) => {
      if (!product?.id) return;
      if (!selectedOccurrenceId) {
        message.warning("Vui lòng chọn lịch sân đang chơi trước khi thêm món");
        return;
      }
      try {
        await cashierService.addOrderItem({ bookingCourtOccurrenceId: selectedOccurrenceId, productId: product.id!, quantity: 1 });
        setOrderItems((prev) => {
          const key = String(product.id);
          const current = prev[key];
          const nextQty = (current?.quantity || 0) + 1;
          return { ...prev, [key]: { product, quantity: nextQty } };
        });
        message.success("Đã lưu tạm món vào đơn");
      } catch (e: any) {
        message.error(e?.message || "Không thể lưu tạm món");
      }
    },
    [selectedOccurrenceId],
  );

  const handleAddServiceToOrder = useCallback(
    async (service: ListServiceResponse) => {
      if (!service?.id) return;
      if (!selectedOccurrenceId) {
        message.warning("Vui lòng chọn lịch sân đang chơi trước khi thêm dịch vụ");
        return;
      }
      try {
        // Call service API to add service (not order item)
        const result = await serviceService.addBookingService({
          bookingCourtOccurrenceId: selectedOccurrenceId,
          serviceId: service.id!,
          quantity: 1,
          notes: `Thêm dịch vụ ${service.name}`,
        });
        if (result.data) {
          message.success("Đã thêm dịch vụ thành công");
          // Refresh occurrence detail to show updated service usage
          queryClient.invalidateQueries({ queryKey: bookingCourtOccurrenceKeys.detail(selectedOccurrenceId) });
        } else {
          message.error(result.message || "Không thể thêm dịch vụ");
        }
      } catch (e: any) {
        message.error(e?.message || "Không thể thêm dịch vụ");
      }
    },
    [selectedOccurrenceId, queryClient],
  );

  // Memoize court selection handler to prevent unnecessary re-renders
  const handleSelectCourt = useCallback(
    (courtId: string) => {
      // Tìm tất cả occurrences của sân này hôm nay
      const todays = (occurrencesToday?.data || []).filter((o) => String(o.courtId) === String(courtId) && o.status === "CheckedIn");

      if (todays.length === 0) {
        message.info("Sân này hiện chưa có lịch hôm nay");
        return;
      }

      // Ưu tiên tìm occurrence đang diễn ra (theo thời gian)
      const now = dayjs();
      const ongoingOccurrence = todays.find((o) => {
        const st = dayjs(`${now.format("YYYY-MM-DD")} ${String(o.startTime).substring(0, 5)}`);
        const et = dayjs(`${now.format("YYYY-MM-DD")} ${String(o.endTime).substring(0, 5)}`);
        return now.isAfter(st) && now.isBefore(et);
      });

      if (ongoingOccurrence) {
        setSelectedOccurrenceId(String(ongoingOccurrence.id));
        setSelectedCourtId(courtId);
        return;
      }

      // Nếu không có occurrence đang diễn ra, tìm occurrence có thể checkout (CheckedIn)
      const checkInOccurrences = todays.filter((o) => o.status === "CheckedIn");
      if (checkInOccurrences.length > 0) {
        setSelectedOccurrenceId(String(checkInOccurrences[0].id));
        setSelectedCourtId(courtId);
        return;
      }

      // Nếu không có CheckedIn, hiển thị tất cả occurrences để user chọn
      message.info("Sân này chưa có lịch đang chơi (CheckedIn). Vui lòng chọn từ danh sách bên phải.");
    },
    [occurrencesToday],
  );

  // Load existing saved order items when occurrence is selected
  useEffect(() => {
    const load = async () => {
      if (!selectedOccurrenceId) {
        setOrderItems({});
        return;
      }
      try {
        const items = await cashierService.listOrderItems(selectedOccurrenceId);
        setOrderItems(
          (items || []).reduce(
            (acc, it) => {
              acc[String(it.productId)] = {
                product: { id: it.productId, name: it.productName, images: it.image ? [it.image] : [], salePrice: it.unitPrice } as any,
                quantity: it.quantity,
              };
              return acc;
            },
            {} as Record<string, { product: ListProductResponse; quantity: number }>,
          ),
        );
      } catch (e: any) {
        message.error(e?.message || "Không thể tải món đã lưu");
      }
    };
    load();
  }, [selectedOccurrenceId]);

  // Memoize quantity change handler to prevent unnecessary re-renders
  const handleChangeQty = useCallback(
    async (productId: string, delta: number) => {
      const current = orderItems[productId];
      if (!current || !selectedOccurrenceId) return;
      const nextQty = Math.max(0, current.quantity + delta);
      try {
        await cashierService.updateOrderItem({ BookingCourtOccurrenceId: selectedOccurrenceId, productId: Number(productId), quantity: nextQty });
        setOrderItems((prev) => {
          const next = { ...prev } as typeof prev;
          if (nextQty === 0) delete next[productId];
          else next[productId] = { ...current, quantity: nextQty };
          return next;
        });
        message.success("Đã cập nhật số lượng");
      } catch (e: any) {
        message.error(e?.message || "Không thể cập nhật số lượng");
      }
    },
    [orderItems, selectedOccurrenceId],
  );

  const itemsSubtotal = useMemo(() => {
    return Object.values(orderItems).reduce((sum, it) => sum + (it.product.salePrice || 0) * it.quantity, 0);
  }, [orderItems]);

  // Removed servicesSubtotal as it's now handled by real-time components

  const courtRemaining = useMemo(() => {
    return occurrenceDetail?.remainingAmount || 0;
  }, [occurrenceDetail]);

  const finalPayable = useMemo(() => {
    // Tính phí muộn theo phần trăm mới nếu có muộn (theo phút)
    let surcharge = 0;

    if (occurrenceDetail && (occurrenceDetail.overdueMinutes || 0) > 15) {
      const overdueMinutes = occurrenceDetail.overdueMinutes || 0;
      const chargeableMinutes = overdueMinutes - 15; // chỉ tính phần >15 phút

      // Tính giá cơ bản theo phút
      const totalMinutes = (occurrenceDetail.totalHours || 1) * 60;
      const baseMinuteRate = (occurrenceDetail.totalAmount || 0) / totalMinutes;

      // Áp dụng phần trăm phí muộn
      const lateFeeRate = baseMinuteRate * (lateFeePercentage / 100);
      surcharge = Math.ceil(chargeableMinutes * lateFeeRate);
    } else {
      surcharge = occurrenceDetail?.surchargeAmount || 0;
    }

    // Tính tổng tiền gốc
    const rawTotal = (courtRemaining || 0) + (itemsSubtotal || 0) + surcharge;

    const roundedTotal = Math.ceil(rawTotal / 1000) * 1000;

    return Math.max(0, roundedTotal);
  }, [courtRemaining, itemsSubtotal, occurrenceDetail, lateFeePercentage]);

  // Memoize checkout handler to prevent unnecessary re-renders
  const handleCheckout = useCallback(async () => {
    if (!selectedOccurrenceId || !occurrenceDetail) {
      message.warning("Vui lòng chọn lịch sân trước khi thanh toán");
      return;
    }

    setIsCheckoutLoading(true);
    try {
      const checkoutRequest: CheckoutRequest = {
        bookingCourtOccurrenceId: selectedOccurrenceId,
        paymentMethod: paymentMethod,
        lateFeePercentage: lateFeePercentage,
        note: `Thanh toán ${paymentMethod === "Cash" ? "tiền mặt" : "chuyển khoản"} - ${new Date().toLocaleString("vi-VN")}`,
      };

      const result = await ordersService.checkout(checkoutRequest);
      setCheckoutDetail(result.data || null);

      if (paymentMethod === "Bank") {
        // Show QR drawer for bank transfer
        setOpenCheckoutQr(true);
        message.success("Đã tạo đơn hàng chờ thanh toán. Vui lòng quét QR để thanh toán.");
      } else {
        // Cash payment - direct success
        message.success("Thanh toán tiền mặt thành công!");
        // Refresh all data
        refreshAllData();
        // Reset form
        setSelectedOccurrenceId(null);
        setOrderItems({});
        setSelectedCourtId(null);
      }
    } catch (error: any) {
      message.error(error?.message || "Không thể thực hiện thanh toán");
    } finally {
      setIsCheckoutLoading(false);
    }
  }, [selectedOccurrenceId, occurrenceDetail, paymentMethod, lateFeePercentage, refreshAllData]);

  // Handle ending service
  const handleEndService = useCallback(
    async (serviceId: string) => {
      try {
        await serviceService.endService({ bookingServiceId: serviceId });
        message.success("Đã dừng dịch vụ thành công");
        // Refresh occurrence detail to get updated service data
        queryClient.invalidateQueries({ queryKey: bookingCourtOccurrenceKeys.detail(selectedOccurrenceId || "") });
      } catch (error: any) {
        message.error(error?.message || "Không thể dừng dịch vụ");
      }
    },
    [queryClient, selectedOccurrenceId],
  );

  const occurrenceOptions = useMemo(() => {
    return (occurrencesToday?.data || [])
      .filter((o) => o.status === "CheckedIn")
      .map((o) => ({
        value: o.id as string,
        label: `${o.courtName} • ${o.customerName} • ${o.startTime?.toString()?.substring(0, 5)}-${o.endTime?.toString()?.substring(0, 5)}`,
      }));
  }, [occurrencesToday]);

  const tabsItems = useMemo(() => {
    return [
      {
        label: (
          <div className="flex items-center gap-2">
            <Grid2X2 className="h-4 w-4" /> Sân cầu lông
          </div>
        ),
        key: "1",
        children: (
          <CourtTab data={courtsData?.data || []} loading={loadingCourts} onSelectCourt={handleSelectCourt} selectedCourtId={selectedCourtId} />
        ),
      },
      {
        label: (
          <div className="flex items-center gap-2">
            <MenuIcon className="h-4 w-4" /> Thực đơn
          </div>
        ),
        key: "2",
        children: <MenuTab data={productsData?.data || []} loading={loadingProducts} onAdd={handleAddProductToOrder} />,
      },
      {
        label: (
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4" /> Dịch vụ
          </div>
        ),
        key: "3",
        children: <ServiceTab data={servicesData?.data || []} loading={loadingServices} onAdd={handleAddServiceToOrder} />,
      },
      {
        label: (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" /> Danh sách chờ thanh toán
          </div>
        ),
        key: "4",
        children: (
          <PendingPaymentsTab
            data={pendingOrdersData || []}
            loading={loadingPendingOrders}
            filter={pendingOrdersFilter}
            onFilterChange={setPendingOrdersFilter}
            extendPaymentTime={ordersService.extendPaymentTime}
          />
        ),
      },
    ];
  }, [
    courtsData,
    loadingCourts,
    handleSelectCourt,
    selectedCourtId,
    productsData,
    loadingProducts,
    handleAddProductToOrder,
    servicesData,
    loadingServices,
    handleAddServiceToOrder,
    pendingOrdersData,
    loadingPendingOrders,
    pendingOrdersFilter,
  ]);

  return (
    <div className="cashier-page-section h-screen p-4">
      <Row className="h-full">
        <Col span={15} className="cashier-page-section-left h-full">
          <Tabs
            className="h-full"
            defaultActiveKey={activeTab}
            onChange={(key) => setActiveTab(key)}
            type="card"
            size={"middle"}
            tabBarStyle={{
              marginBottom: 0,
            }}
            tabBarExtraContent={{
              right: (
                <div className="flex gap-2 px-[3px]">
                  <Button icon={<ReloadOutlined />} onClick={handleRefreshData}>
                    Cập nhật dữ liệu
                  </Button>
                  <Button icon={<Monitor className="h-4 w-4" />} onClick={() => router.push("/quanlysancaulong/court-schedule")}>
                    Quản lý đặt sân
                  </Button>
                </div>
              ),
            }}
            items={tabsItems}
          />
        </Col>

        <Col span={9} className="cashier-page-section-right h-full">
          <div className="card-section h-full overflow-auto p-3">
            <div className="mb-3">
              <div className="mb-1 text-sm font-semibold">Chọn lịch đang chơi (CheckedIn hôm nay)</div>
              <Select
                style={{ width: "100%" }}
                placeholder="Chọn lịch đặt sân"
                value={selectedOccurrenceId ?? undefined}
                onChange={(val) => setSelectedOccurrenceId(val)}
                options={occurrenceOptions}
                allowClear
              />

              {selectedOccurrenceId && (
                <div className="mt-2 rounded border bg-blue-50 p-2">
                  <div className="text-sm font-medium">
                    {occurrenceDetail?.court?.name} • {occurrenceDetail?.customer?.fullName}
                  </div>
                  <div className="text-xs text-gray-600">
                    {String(occurrenceDetail?.date)} • {String(occurrenceDetail?.startTime)}-{String(occurrenceDetail?.endTime)}
                  </div>
                </div>
              )}
            </div>

            <div className="mb-2 rounded border p-2">
              <div className="mb-2 text-sm font-semibold">Thông tin thanh toán sân</div>
              {occurrenceDetail ? (
                <div className="text-sm">
                  <div>Tổng tiền sân: {(occurrenceDetail.totalAmount || 0).toLocaleString("vi-VN")} đ</div>
                  <div>Đã thanh toán: {(occurrenceDetail.paidAmount || 0).toLocaleString("vi-VN")} đ</div>
                  <div>
                    Còn lại: <b className="text-red-500">{(courtRemaining || 0).toLocaleString("vi-VN")} đ</b>
                  </div>
                </div>
              ) : (
                <Empty description="Chưa chọn lịch đang chơi" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </div>

            {/* Service Usage Information */}
            {occurrenceDetail && occurrenceDetail.status === "CheckedIn" && (
              <div className="mb-2 rounded border p-2">
                <div className="mb-2 text-sm font-semibold">Dịch vụ sử dụng</div>
                <div className="text-xs text-gray-600">Dịch vụ được tính theo thời gian thực tế từ lúc thêm đến checkout</div>
                {occurrenceDetail.bookingServices && occurrenceDetail.bookingServices.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {occurrenceDetail.bookingServices.map((service, index) => (
                      <ServiceUsageItem key={index} service={service} onEndService={handleEndService} />
                    ))}
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-gray-500">Chưa có dịch vụ nào được thêm</div>
                )}
              </div>
            )}

            <div className="mb-2 rounded border p-2">
              <div className="mb-2 text-sm font-semibold">Phương thức thanh toán</div>
              <Select
                style={{ width: "100%" }}
                value={paymentMethod}
                onChange={(value: "Cash" | "Bank") => setPaymentMethod(value)}
                options={[
                  { value: "Cash", label: "Tiền mặt" },
                  { value: "Bank", label: "Chuyển khoản" },
                ]}
              />
            </div>

            {occurrenceDetail && (occurrenceDetail.overdueMinutes || 0) > 0 && (
              <div className="rounded border p-2">
                <div className="mb-2 text-sm font-semibold">Cấu hình phí muộn</div>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={lateFeePercentage}
                    onChange={(e) => setLateFeePercentage(Number(e.target.value) || 150)}
                    addonAfter="%"
                    placeholder="150"
                    style={{ width: "120px" }}
                  />
                </div>
                <div className="mt-1 text-xs text-gray-500">Phí muộn: {lateFeePercentage}% trên giá gốc/giờ</div>
              </div>
            )}

            <Divider style={{ margin: "12px 0" }}>
              <span className="text-sm">Đặt đồ/Dịch vụ</span>
            </Divider>

            <div className="rounded border px-2">
              {Object.keys(orderItems).length === 0 ? (
                <Empty description="Chưa có món" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <List
                  dataSource={Object.values(orderItems)}
                  renderItem={(it) => (
                    <List.Item
                      actions={[
                        <Button key={it.product.id} size="small" onClick={() => handleChangeQty(String(it.product.id), -1)}>
                          -
                        </Button>,
                        <span key={it.product.id} className="mx-2">
                          {it.quantity}
                        </span>,
                        <Button key={it.product.id} size="small" onClick={() => handleChangeQty(String(it.product.id), 1)}>
                          +
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<AntdImage draggable={false} width={100} height={100} src={it.product.images?.[0] || undefined} preview={false} />}
                        title={<span className="font-medium">{it.product.name}</span>}
                        description={`${(it.product.salePrice || 0).toLocaleString("vi-VN")} đ`}
                      />
                      <div className="font-medium">{((it.product.salePrice || 0) * it.quantity || 0).toLocaleString("vi-VN")} đ</div>
                    </List.Item>
                  )}
                />
              )}
            </div>

            <Divider style={{ margin: "12px 0" }}>
              <span className="text-sm">Tổng kết thanh toán</span>
            </Divider>

            <div className="rounded border p-2 text-sm">
              <div className="flex justify-between">
                <span>Tiền sân còn lại</span>
                <span>{(occurrenceDetail?.remainingAmount || 0).toLocaleString("vi-VN")} đ</span>
              </div>
              <div className="flex justify-between">
                <span>Tổng món</span>
                <span>{(itemsSubtotal || 0).toLocaleString("vi-VN")} đ</span>
              </div>
              <div className="flex justify-between">
                <span>Tổng dịch vụ</span>
                <span>
                  {occurrenceDetail?.bookingServices && occurrenceDetail.bookingServices.length > 0 ? (
                    <ServicesTotalCost services={occurrenceDetail.bookingServices} />
                  ) : (
                    "0 đ"
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Muộn</span>
                <span>
                  {(() => {
                    const overdueMinutes = occurrenceDetail?.overdueMinutes || 0;
                    if (overdueMinutes > 60) {
                      return `${Math.floor(overdueMinutes / 60)} giờ ${overdueMinutes % 60} phút`;
                    } else if (overdueMinutes > 0) {
                      return `${overdueMinutes} phút`;
                    }
                    return "0 phút";
                  })()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Phụ phí muộn (tạm tính)</span>
                <span>{occurrenceDetail?.surchargeAmount?.toLocaleString("vi-VN")}đ</span>
              </div>
              <Divider style={{ margin: "8px 0" }} />
              <div className="flex justify-between text-lg font-semibold text-green-600">
                <span>Cần thanh toán</span>
                <span>
                  {occurrenceDetail?.bookingServices && occurrenceDetail.bookingServices.length > 0 ? (
                    <FinalPayableAmount
                      courtRemaining={courtRemaining}
                      itemsSubtotal={itemsSubtotal}
                      services={occurrenceDetail.bookingServices}
                      surchargeAmount={occurrenceDetail?.surchargeAmount || 0}
                    />
                  ) : (
                    (finalPayable || 0).toLocaleString("vi-VN") + " đ"
                  )}
                </span>
              </div>
              <Divider style={{ margin: "8px 0" }} />
              <div className="mt-2 flex gap-2">
                <Button
                  icon={<ShoppingCartOutlined />}
                  type="primary"
                  loading={isCheckoutLoading}
                  disabled={!selectedOccurrenceId}
                  onClick={handleCheckout}
                >
                  {paymentMethod === "Cash" ? "Thanh toán tiền mặt & Checkout" : "Thanh toán chuyển khoản & Checkout"}
                </Button>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      <CheckoutQrDrawer
        checkoutDetail={checkoutDetail}
        open={openCheckoutQr}
        onClose={() => {
          setOpenCheckoutQr(false);
          setCheckoutDetail(null);
          // Refresh data after successful bank transfer
          refreshAllData();
          // Reset form after successful bank transfer
          setSelectedOccurrenceId(null);
          setOrderItems({});
          setSelectedCourtId(null);
        }}
        title="Thanh toán chuyển khoản"
        width={560}
      />
    </div>
  );
});

// (moved heavy subcomponents to dynamic imports above)

const CashierPage = () => {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Đang tải...</div>}>
      <CashierPageContent />
    </Suspense>
  );
};

export default CashierPage;
