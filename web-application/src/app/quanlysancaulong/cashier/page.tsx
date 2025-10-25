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
  ssr: false, // Client-side only component
  loading: () => <div>Loading checkout...</div>,
});

// Import hooks and services
import { bookingCourtOccurrenceKeys, useDetailBookingCourtOccurrence, useListBookingCourtOccurrences } from "@/hooks/useBookingCourtOccurrence";
import { useListCourts } from "@/hooks/useCourt";
import { useListProducts } from "@/hooks/useProducts";
import { useListServices } from "@/hooks/useServices";
import { usePendingPaymentOrders } from "@/hooks/useOrders";
import { cashierService } from "@/services/cashierService";
import { serviceService } from "@/services/serviceService";
import { ordersService } from "@/services/ordersService";
import {
  CheckoutRequest,
  CheckoutResponse,
  DetailBookingCourtOccurrenceResponse,
  ListCourtResponse,
  ListProductResponse,
  ListServiceResponse,
  OrderResponse,
} from "@/types-openapi/api";
import { CourtStatus } from "@/types/commons";

// Import Antd components (these are relatively lightweight)
import { LoadingOutlined, ReloadOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { Image as AntdImage, Button, Card, Col, Divider, Empty, Input, List, message, Row, Select, Spin, Tabs } from "antd";
import { Meta } from "antd/es/list/Item";
import { Grid2X2, MenuIcon, Monitor, Wrench, Clock } from "lucide-react";
import Image from "next/image";

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
  const { data: productsData, isFetching: loadingProducts, refetch: refetchProducts } = useListProducts({});
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
            items={[
              {
                label: (
                  <div className="flex items-center gap-2">
                    <Grid2X2 className="h-4 w-4" /> Sân cầu lông
                  </div>
                ),
                key: "1",
                children: (
                  <CourtTab
                    data={courtsData?.data || []}
                    loading={loadingCourts}
                    onSelectCourt={handleSelectCourt}
                    selectedCourtId={selectedCourtId}
                  />
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
                  />
                ),
              },
            ]}
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
                options={(occurrencesToday?.data || [])
                  .filter((o) => o.status === "CheckedIn")
                  .map((o) => ({
                    value: o.id as string,
                    label: `${o.courtName} • ${o.customerName} • ${o.startTime?.toString()?.substring(0, 5)}-${o.endTime
                      ?.toString()
                      ?.substring(0, 5)}`,
                  }))}
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

// Memoize ServiceUsageItem to prevent unnecessary re-renders when parent updates
const ServiceUsageItem = memo(function ServiceUsageItem({ service, onEndService }: { service: any; onEndService?: (serviceId: string) => void }) {
  const [nowTs, setNowTs] = useState<number>(() => Date.now());
  const [isEnding, setIsEnding] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Memoize expensive calculations to prevent recalculation on every render
  const { displayHours, displayMinutes, displaySeconds, currentCost } = useMemo(() => {
    // Nếu dịch vụ đã hoàn thành, sử dụng dữ liệu tĩnh
    if (service.status === "Completed" && service.serviceEndTime) {
      const startTime = new Date(service.serviceStartTime || new Date());
      const endTime = new Date(service.serviceEndTime);
      const usageMs = Math.max(0, endTime.getTime() - startTime.getTime());
      const totalSeconds = Math.floor(usageMs / 1000);
      const displayHours = Math.floor(totalSeconds / 3600);
      const displayMinutes = Math.floor((totalSeconds % 3600) / 60);
      const displaySeconds = totalSeconds % 60;

      return {
        displayHours,
        displayMinutes,
        displaySeconds,
        currentCost: service.totalPrice || 0,
      };
    }

    // Nếu dịch vụ đang sử dụng, tính toán real-time
    const startTime = new Date(service.serviceStartTime || new Date());
    const usageMs = Math.max(0, nowTs - startTime.getTime());
    const totalSeconds = Math.floor(usageMs / 1000);
    const displayHours = Math.floor(totalSeconds / 3600);
    const displayMinutes = Math.floor((totalSeconds % 3600) / 60);
    const displaySeconds = totalSeconds % 60;

    // For display, use actual usage time but round up the cost to nearest 1000
    const actualUsageHours = usageMs / (1000 * 60 * 60);
    const rawCost = (service.quantity || 0) * (service.unitPrice || 0) * actualUsageHours;
    const currentCost = service.totalPrice || Math.ceil(rawCost / 1000) * 1000;

    return { displayHours, displayMinutes, displaySeconds, currentCost };
  }, [nowTs, service.serviceStartTime, service.serviceEndTime, service.quantity, service.unitPrice, service.totalPrice, service.status]);

  const handleEndService = async () => {
    if (!onEndService || isEnding) return;

    setIsEnding(true);
    try {
      await onEndService(service.id);
    } catch (error) {
      console.error("Error ending service:", error);
    } finally {
      setIsEnding(false);
    }
  };

  return (
    <div className="rounded bg-blue-50 p-2 text-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-medium">{service.serviceName || "Unknown Service"}</div>
          <div className="text-xs text-gray-600">
            Số lượng: {service.quantity} • Giá: {service.unitPrice?.toLocaleString("vi-VN")} đ/giờ
          </div>
          <div className="text-xs text-gray-600">
            Đã sử dụng: {displayHours} giờ {displayMinutes} phút {String(displaySeconds).padStart(2, "0")} giây
          </div>
          {service.status === "Completed" && service.serviceEndTime && (
            <div className="text-xs text-gray-600">Kết thúc: {new Date(service.serviceEndTime).toLocaleString("vi-VN")}</div>
          )}
        </div>
        <div className="text-right">
          <div className="font-semibold text-blue-600">{currentCost.toLocaleString("vi-VN")} đ</div>
          <div className="mb-2 text-xs text-gray-500">{service.status === "Completed" ? "Đã hoàn thành" : "Đang sử dụng"}</div>
          {service.status !== "Completed" && onEndService && (
            <Button size="small" type="primary" danger loading={isEnding} onClick={handleEndService} className="text-xs">
              Dừng dịch vụ
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});

// Memoize ServicesTotalCost to prevent unnecessary re-renders
const ServicesTotalCost = memo(function ServicesTotalCost({ services }: { services: any[] }) {
  const [nowTs, setNowTs] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Memoize expensive calculation to prevent recalculation on every render
  const totalCost = useMemo(() => {
    return services.reduce((sum, service) => {
      // Nếu dịch vụ đã hoàn thành, sử dụng totalPrice tĩnh
      if (service.status === "Completed" && service.totalPrice) {
        return sum + service.totalPrice;
      }

      // Nếu dịch vụ đang sử dụng, tính toán real-time
      const startTime = new Date(service.serviceStartTime || new Date());
      const usageMs = Math.max(0, nowTs - startTime.getTime());
      const actualUsageHours = usageMs / (1000 * 60 * 60);
      const rawCost = (service.quantity || 0) * (service.unitPrice || 0) * actualUsageHours;
      const serviceCost = service.totalPrice || Math.ceil(rawCost / 1000) * 1000;
      return sum + serviceCost;
    }, 0);
  }, [services, nowTs]);

  return <span>{totalCost.toLocaleString("vi-VN")} đ</span>;
});

// Memoize FinalPayableAmount to prevent unnecessary re-renders
const FinalPayableAmount = memo(function FinalPayableAmount({
  courtRemaining,
  itemsSubtotal,
  services,
  surchargeAmount,
}: {
  courtRemaining: number;
  itemsSubtotal: number;
  services: any[];
  surchargeAmount: number;
}) {
  const [nowTs, setNowTs] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Memoize expensive calculations to prevent recalculation on every render
  const totalPayable = useMemo(() => {
    // Calculate services cost - use static data for completed services
    const servicesCost = services.reduce((sum, service) => {
      // Nếu dịch vụ đã hoàn thành, sử dụng totalPrice tĩnh
      if (service.status === "Completed" && service.totalPrice) {
        return sum + service.totalPrice;
      }

      // Nếu dịch vụ đang sử dụng, tính toán real-time
      const startTime = new Date(service.serviceStartTime || new Date());
      const usageMs = Math.max(0, nowTs - startTime.getTime());
      const actualUsageHours = usageMs / (1000 * 60 * 60);
      const rawCost = (service.quantity || 0) * (service.unitPrice || 0) * actualUsageHours;
      const serviceCost = service.totalPrice || Math.ceil(rawCost / 1000) * 1000;
      return sum + serviceCost;
    }, 0);

    return Math.max(0, courtRemaining + itemsSubtotal + servicesCost + surchargeAmount);
  }, [services, nowTs, surchargeAmount, courtRemaining, itemsSubtotal]);

  return <span>{totalPayable.toLocaleString("vi-VN")} đ</span>;
});

interface CourtTabProps {
  data: ListCourtResponse[];
  loading: boolean;
  onSelectCourt: (courtId: string) => void;
  selectedCourtId: string | null;
}

// Memoize CourtTab to prevent unnecessary re-renders
const CourtTab = memo(function CourtTab({ data, loading, onSelectCourt, selectedCourtId }: CourtTabProps) {
  // Memoize status color function to prevent recreation on every render
  const getStatusColor = useCallback((status?: string) => {
    switch (status) {
      case CourtStatus.InUse:
        return { dot: "bg-blue-500", text: "text-blue-600", badge: "bg-blue-50 border-blue-200" };
      case CourtStatus.Active:
        return { dot: "bg-green-500", text: "text-green-600", badge: "bg-green-50 border-green-200" };
      case CourtStatus.Maintenance:
        return { dot: "bg-yellow-500", text: "text-yellow-700", badge: "bg-yellow-50 border-yellow-200" };
      case CourtStatus.Inactive:
        return { dot: "bg-gray-400", text: "text-gray-600", badge: "bg-gray-50 border-gray-200" };
      case CourtStatus.Deleted:
        return { dot: "bg-red-500", text: "text-red-600", badge: "bg-red-50 border-red-200" };
      default:
        return { dot: "bg-gray-300", text: "text-gray-600", badge: "bg-gray-50 border-gray-200" };
    }
  }, []);
  return (
    <div className="h-full p-3">
      <Row gutter={[8, 8]} className="h-full">
        {loading ? (
          <div className="justify-cente flex h-full w-full flex-col items-center">
            <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
            <div className="text-lg font-bold">Đang tải dữ liệu...</div>
          </div>
        ) : (
          data?.map((court, index) => {
            const colors = getStatusColor((court as any)?.status as string);
            const statusText =
              court.status === CourtStatus.Active
                ? "Đang hoạt động"
                : court.status === CourtStatus.Maintenance
                  ? "Bảo trì"
                  : court.status === CourtStatus.Inactive
                    ? "Không hoạt động"
                    : court.status === CourtStatus.InUse
                      ? "Đang sử dụng"
                      : court.status === CourtStatus.Deleted
                        ? "Đã xóa"
                        : "Không xác định";
            const isSelected = selectedCourtId && String(court.id) === String(selectedCourtId);
            return (
              <Col span={24} md={12} lg={8} xl={6} key={index}>
                <Card
                  styles={{ body: { padding: 8 } }}
                  hoverable
                  onClick={() => onSelectCourt(String(court.id))}
                  className={isSelected ? "shadow-lg ring-2 ring-green-500" : ""}
                >
                  <div className={`relative flex flex-col items-center gap-2 ${isSelected ? "scale-[1.02]" : ""}`}>
                    {/* status dot */}
                    <div className="absolute top-2 right-2">
                      <span className={`inline-block h-3 w-3 rounded-full ${colors.dot}`} />
                    </div>

                    <Image
                      draggable={false}
                      src={"/placeholder/badminton-court-placeholder.jpg"}
                      alt={court.name || "Sân"}
                      className="h-30 w-30"
                      width={120}
                      height={120}
                    />
                    <span className="font-medium">{court.name}</span>
                    <span className={`rounded border px-2 py-0.5 text-xs ${colors.badge} ${colors.text}`}>{statusText}</span>
                  </div>
                </Card>
              </Col>
            );
          })
        )}
      </Row>
    </div>
  );
});

interface MenuTabProps {
  data: ListProductResponse[];
  loading: boolean;
  onAdd: (product: ListProductResponse) => void;
}

// Memoize MenuTab to prevent unnecessary re-renders
const MenuTab = memo(function MenuTab({ data, loading, onAdd }: MenuTabProps) {
  return (
    <div className="h-full p-3">
      <Row gutter={[8, 8]}>
        {loading ? (
          <div className="justify-cente flex h-full w-full flex-col items-center">
            <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
            <div className="text-lg font-bold">Đang tải dữ liệu...</div>
          </div>
        ) : (
          data?.map((product, index) => (
            <Col span={24} md={12} lg={8} xl={6} key={index}>
              <Card
                hoverable
                styles={{ cover: { border: "1px solid #f0f0f0", borderTopLeftRadius: 8, borderTopRightRadius: 8 }, body: { padding: 8 } }}
                onClick={() => onAdd(product)}
                cover={
                  <div className="relative">
                    <Image
                      style={{ width: "100%", height: "150px", objectFit: "contain" }}
                      draggable={false}
                      alt={`Thực đơn ${index + 1}`}
                      src={product.images?.[0] || "/placeholder/product-image-placeholder.jpg"}
                      width={100}
                      height={100}
                    />

                    <div className="absolute bottom-0 left-0 flex w-full justify-center">
                      <span className="rounded-t-lg bg-green-500 px-2 py-1 text-xs text-white">
                        {product.salePrice?.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                      </span>
                    </div>
                  </div>
                }
              >
                <Meta title={<span className="font-medium">{product.name}</span>} />
              </Card>
            </Col>
          ))
        )}
      </Row>
    </div>
  );
});

interface ServiceTabProps {
  data: ListServiceResponse[];
  loading: boolean;
  onAdd: (service: ListServiceResponse) => void;
}

interface PendingPaymentsTabProps {
  data: OrderResponse[];
  loading: boolean;
  filter: { status?: string; paymentMethod?: string };
  onFilterChange: (filter: { status?: string; paymentMethod?: string }) => void;
}

// Memoize PendingPaymentsTab to prevent unnecessary re-renders
const PendingPaymentsTab = memo(function PendingPaymentsTab({ data, loading, filter, onFilterChange }: PendingPaymentsTabProps) {
  const [extendingPayment, setExtendingPayment] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Paid":
        return "bg-green-100 text-green-800 border-green-200";
      case "Cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case "Cash":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Bank":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleExtendPayment = useCallback(async (orderId: string) => {
    setExtendingPayment(orderId);
    try {
      await ordersService.extendPaymentTime(orderId);
      message.success("Gia hạn thanh toán thành công! Thêm 5 phút để thanh toán.");
      // Refresh data after extending payment
      window.location.reload();
    } catch (error: any) {
      message.error(error?.message || "Không thể gia hạn thanh toán");
    } finally {
      setExtendingPayment(null);
    }
  }, []);

  return (
    <div className="h-full p-3">
      {/* Filter Section */}
      <div className="mb-4 rounded border bg-gray-50 p-3">
        <div className="mb-2 text-sm font-semibold">Bộ lọc</div>
        <Row gutter={[8, 8]}>
          <Col span={12}>
            <div className="mb-1 text-xs text-gray-600">Trạng thái</div>
            <Select
              style={{ width: "100%" }}
              placeholder="Tất cả trạng thái"
              value={filter.status || undefined}
              onChange={(value) => onFilterChange({ ...filter, status: value || undefined })}
              allowClear
              options={[
                { value: "Pending", label: "Chờ thanh toán" },
                { value: "Paid", label: "Đã thanh toán" },
                { value: "Cancelled", label: "Đã hủy" },
              ]}
            />
          </Col>
          <Col span={12}>
            <div className="mb-1 text-xs text-gray-600">Phương thức thanh toán</div>
            <Select
              style={{ width: "100%" }}
              placeholder="Tất cả phương thức"
              value={filter.paymentMethod || undefined}
              onChange={(value) => onFilterChange({ ...filter, paymentMethod: value || undefined })}
              allowClear
              options={[
                { value: "Cash", label: "Tiền mặt" },
                { value: "Bank", label: "Chuyển khoản" },
              ]}
            />
          </Col>
        </Row>
      </div>

      {/* Orders List */}
      <div className="h-full overflow-auto">
        {loading ? (
          <div className="flex h-full w-full flex-col items-center justify-center">
            <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
            <div className="text-lg font-bold">Đang tải dữ liệu...</div>
          </div>
        ) : data.length === 0 ? (
          <Empty description="Không có đơn hàng nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <div className="flex flex-col gap-2">
            {data.map((order, index) => (
              <Card key={order.id || index} size="small" className="transition-shadow hover:shadow-md">
                <div className="space-y-2">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Đơn hàng #{order.id?.substring(0, 8) || "N/A"}</div>
                    <div className="flex gap-2">
                      <span className={`rounded border px-2 py-1 text-xs ${getStatusColor(order.status || "")}`}>
                        Trạng thái:{" "}
                        {order.status === "Pending"
                          ? "Chờ thanh toán"
                          : order.status === "Paid"
                            ? "Đã thanh toán"
                            : order.status === "Cancelled"
                              ? "Đã hủy"
                              : order.status || "N/A"}
                      </span>
                      <span className={`rounded border px-2 py-1 text-xs ${getPaymentMethodColor(order.paymentMethod || "")}`}>
                        Phương thức thanh toán:{" "}
                        {order.paymentMethod === "Cash" ? "Tiền mặt" : order.paymentMethod === "Bank" ? "Chuyển khoản" : order.paymentMethod || "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="text-sm text-gray-600">
                    <div>Khách hàng: {order.customerName || "N/A"}</div>
                    <div>Sân: {order.courtName || "N/A"}</div>
                    <div>Ngày tạo: {order.createdAt ? new Date(order.createdAt).toLocaleString("vi-VN") : "N/A"}</div>
                  </div>

                  {/* Amount Info */}
                  <div className="flex items-center justify-between border-t pt-2">
                    <div className="text-sm text-gray-600">
                      Tổng tiền: <span className="text-lg font-semibold text-red-600">{(order.totalAmount || 0).toLocaleString("vi-VN")} đ</span>
                    </div>
                    <div className="flex gap-2">
                      {order.status === "Pending" && order.paymentMethod === "Bank" && (
                        <Button
                          type="primary"
                          size="small"
                          onClick={() => {
                            const checkoutUrl = `/checkout/${order.id}`;
                            window.open(checkoutUrl, "_blank");
                          }}
                        >
                          Xem QR
                        </Button>
                      )}
                      {order.status === "Cancelled" && order.paymentMethod === "Bank" && (
                        <Button type="default" size="small" loading={extendingPayment === order.id} onClick={() => handleExtendPayment(order.id!)}>
                          Gia hạn 5 phút
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

// Memoize ServiceTab to prevent unnecessary re-renders
const ServiceTab = memo(function ServiceTab({ data, loading, onAdd }: ServiceTabProps) {
  return (
    <div className="h-full p-3">
      <Row gutter={[8, 8]}>
        {loading ? (
          <div className="justify-cente flex h-full w-full flex-col items-center">
            <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
            <div className="text-lg font-bold">Đang tải dữ liệu...</div>
          </div>
        ) : (
          data?.map((service, index) => {
            const isOutOfStock = service.stockQuantity !== null && service.stockQuantity !== undefined && service.stockQuantity <= 0;
            return (
              <Col span={24} md={12} lg={8} xl={6} key={index}>
                <Card
                  hoverable={!isOutOfStock}
                  styles={{
                    cover: {
                      border: "1px solid #f0f0f0",
                      borderTopLeftRadius: 8,
                      borderTopRightRadius: 8,
                    },
                    body: isOutOfStock ? { opacity: 0.5 } : { padding: 8 },
                  }}
                  onClick={() => !isOutOfStock && onAdd(service)}
                  cover={
                    <div className="relative">
                      <Image
                        style={{ width: "100%", height: "150px", objectFit: "cover" }}
                        draggable={false}
                        alt={`Dịch vụ ${index + 1}`}
                        src={service.imageUrl || "/placeholder/product-image-placeholder.jpg"}
                        width={100}
                        height={100}
                      />

                      <div className="absolute bottom-0 left-0 flex w-full justify-center">
                        {isOutOfStock ? (
                          <span className="rounded-t-lg bg-red-500 px-2 py-1 text-xs text-white">Hết hàng</span>
                        ) : (
                          <span className="rounded-t-lg bg-blue-500 px-2 py-1 text-xs text-white">
                            {service.pricePerHour?.toLocaleString("vi-VN", { style: "currency", currency: "VND" })} / {service.unit} / giờ
                          </span>
                        )}
                      </div>
                    </div>
                  }
                >
                  <Meta
                    title={<span className="font-medium">{service.name}</span>}
                    description={
                      <div className="text-xs text-gray-500">
                        <div>
                          Giá: {service.pricePerHour?.toLocaleString("vi-VN")} đ / {service.unit} / giờ
                        </div>
                        {service.stockQuantity !== null && <div className="text-blue-600">Còn lại: {service.stockQuantity} sản phẩm</div>}
                      </div>
                    }
                  />
                </Card>
              </Col>
            );
          })
        )}
      </Row>
    </div>
  );
});

const CashierPage = () => {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Đang tải...</div>}>
      <CashierPageContent />
    </Suspense>
  );
};

export default CashierPage;
