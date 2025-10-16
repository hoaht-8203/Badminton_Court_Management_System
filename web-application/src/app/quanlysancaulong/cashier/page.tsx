"use client";

import { useDetailBookingCourt, useListBookingCourts } from "@/hooks/useBookingCourt";
import { useListCourts } from "@/hooks/useCourt";
import { useListProducts } from "@/hooks/useProducts";
import { cashierService } from "@/services/cashierService";
import { DetailBookingCourtResponse, ListCourtResponse, ListProductResponse } from "@/types-openapi/api";
import { CourtStatus } from "@/types/commons";
import { LoadingOutlined, ReloadOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { Image as AntdImage, Button, Card, Col, Divider, Empty, Input, List, message, Row, Select, Spin, Tabs } from "antd";
import { Meta } from "antd/es/list/Item";
import dayjs from "dayjs";
import { Grid2X2, MenuIcon, Monitor, Wrench } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

const CashierPageContent = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("1");
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [selectedCourtId, setSelectedCourtId] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<Record<string, { product: ListProductResponse; quantity: number }>>({});
  const [lateFeePercentage, setLateFeePercentage] = useState<number>(150);

  const { data: courtsData, isFetching: loadingCourts, refetch: refetchCourts } = useListCourts({});
  const { data: productsData, isFetching: loadingProducts, refetch: refetchProducts } = useListProducts({});
  const { data: bookingsToday } = useListBookingCourts({});
  const { data: bookingDetailRes } = useDetailBookingCourt(selectedBookingId ?? undefined);
  const bookingDetail = (bookingDetailRes?.data as DetailBookingCourtResponse) || undefined;

  // Preselect booking from URL search params (client-safe)
  const sp = useSearchParams();
  useEffect(() => {
    const id = sp.get("bookingId");
    if (id) setSelectedBookingId(id);
  }, [sp]);

  // Derive selected court from selected booking (ensures highlight after deep-link or refresh)
  useEffect(() => {
    if (!selectedBookingId) return;
    const list = bookingsToday?.data || [];
    const found = list.find((b: any) => String(b.id) === String(selectedBookingId));
    if (found?.courtId) setSelectedCourtId(String(found.courtId));
  }, [selectedBookingId, bookingsToday]);

  const handleRefreshData = () => {
    switch (activeTab) {
      case "1":
        refetchCourts();
        break;
      case "2":
        refetchProducts();
        break;
      default:
        break;
    }
  };

  const handleAddProductToOrder = async (product: ListProductResponse) => {
    if (!product?.id) return;
    if (!selectedBookingId) {
      message.warning("Vui lòng chọn sân/booking đang chơi trước khi thêm món");
      return;
    }
    try {
      await cashierService.addOrderItem({ bookingId: selectedBookingId, productId: product.id!, quantity: 1 });
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
  };

  const handleSelectCourt = (courtId: string) => {
    const todays = (bookingsToday?.data || []).filter((b) => String(b.courtId) === String(courtId) && (b.status as any) === "CheckedIn");
    if (todays.length === 0) {
      message.info("Sân này hiện chưa có lịch đang chơi (CheckedIn)");
      return;
    }
    // Prefer ongoing booking by time window, else first
    const now = dayjs();
    const pick =
      todays.find((b) => {
        const st = dayjs(`${now.format("YYYY-MM-DD")} ${String(b.startTime).substring(0, 5)}`);
        const et = dayjs(`${now.format("YYYY-MM-DD")} ${String(b.endTime).substring(0, 5)}`);
        return now.isAfter(st) && now.isBefore(et);
      }) || todays[0];
    setSelectedBookingId(String(pick.id));
    setSelectedCourtId(courtId);
  };

  // Load existing saved order items when booking is selected
  useEffect(() => {
    const load = async () => {
      if (!selectedBookingId) {
        setOrderItems({});
        return;
      }
      try {
        const items = await cashierService.listOrderItems(selectedBookingId);
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
  }, [selectedBookingId]);

  const handleChangeQty = async (productId: string, delta: number) => {
    const current = orderItems[productId];
    if (!current || !selectedBookingId) return;
    const nextQty = Math.max(0, current.quantity + delta);
    try {
      await cashierService.updateOrderItem({ bookingId: selectedBookingId, productId: Number(productId), quantity: nextQty });
      setOrderItems((prev) => {
        const next = { ...prev } as typeof prev;
        if (nextQty === 0) delete next[productId];
        else next[productId] = { ...current, quantity: nextQty };
        return next;
      });
    } catch (e: any) {
      message.error(e?.message || "Không thể cập nhật số lượng");
    }
  };

  const handleUpdateLateFeePercentage = () => {
    // Chỉ cần cập nhật state, không cần gọi API
    // Logic tính toán sẽ được handle trong finalPayable
    message.success("Cập nhật phần trăm phí muộn thành công");
  };

  const itemsSubtotal = useMemo(() => {
    return Object.values(orderItems).reduce((sum, it) => sum + (it.product.salePrice || 0) * it.quantity, 0);
  }, [orderItems]);

  const courtRemaining = useMemo(() => {
    if (!bookingDetail) return 0;
    return bookingDetail.remainingAmount || 0;
  }, [bookingDetail]);

  const finalPayable = useMemo(() => {
    // Tính phí muộn theo phần trăm mới nếu có muộn (theo phút)
    let surcharge = 0;
    if (bookingDetail && (bookingDetail.overdueMinutes || 0) > 15) {
      const overdueMinutes = bookingDetail.overdueMinutes || 0;
      const chargeableMinutes = overdueMinutes - 15; // Chỉ tính phí cho phần muộn > 15 phút

      // Tính giá cơ bản từ booking detail (theo phút)
      const totalMinutes = (bookingDetail.totalHours || 1) * 60;
      const baseMinuteRate = (bookingDetail.totalAmount || 0) / totalMinutes;

      // Áp dụng phần trăm phí muộn
      const lateFeeRate = baseMinuteRate * (lateFeePercentage / 100);
      surcharge = Math.ceil(chargeableMinutes * lateFeeRate);
    } else {
      surcharge = bookingDetail?.surchargeAmount || 0;
    }

    return Math.max(0, (courtRemaining || 0) + (itemsSubtotal || 0) + surcharge);
  }, [courtRemaining, itemsSubtotal, bookingDetail, lateFeePercentage]);

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
                children: <ServiceTab />,
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
                value={selectedBookingId ?? undefined}
                onChange={(val) => setSelectedBookingId(val)}
                options={(bookingsToday?.data || [])
                  .filter((b) => (b.status as any) === "CheckedIn")
                  .map((b) => ({
                    value: b.id as string,
                    label: `${b.courtName} • ${b.customerName} • ${b.startTime?.toString()?.substring(0, 5)}-${b.endTime
                      ?.toString()
                      ?.substring(0, 5)}`,
                  }))}
                allowClear
              />
            </div>

            <div className="mb-2 rounded border p-2">
              <div className="mb-2 text-sm font-semibold">Thông tin thanh toán sân</div>
              {bookingDetail ? (
                <div className="text-sm">
                  <div>Tổng tiền sân: {(bookingDetail.totalAmount || 0).toLocaleString("vi-VN")} đ</div>
                  <div>Đã thanh toán: {(bookingDetail.paidAmount || 0).toLocaleString("vi-VN")} đ</div>
                  <div>
                    Còn lại: <b className="text-red-500">{(courtRemaining || 0).toLocaleString("vi-VN")} đ</b>
                  </div>
                </div>
              ) : (
                <Empty description="Chưa chọn lịch đang chơi" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </div>

            {bookingDetail && (bookingDetail.overdueMinutes || 0) > 0 && (
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
                  <Button size="small" onClick={handleUpdateLateFeePercentage}>
                    Cập nhật
                  </Button>
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
                <span>{(bookingDetail?.remainingAmount || 0).toLocaleString("vi-VN")} đ</span>
              </div>
              <div className="flex justify-between">
                <span>Tổng món</span>
                <span>{(itemsSubtotal || 0).toLocaleString("vi-VN")} đ</span>
              </div>
              <div className="flex justify-between">
                <span>Muộn</span>
                <span>{bookingDetail?.overdueMinutes} phút</span>
              </div>
              <div className="flex justify-between">
                <span>Phụ phí muộn</span>
                <span>
                  {(() => {
                    if (bookingDetail && (bookingDetail.overdueMinutes || 0) > 15) {
                      const overdueMinutes = bookingDetail.overdueMinutes || 0;
                      const chargeableMinutes = overdueMinutes - 15;
                      const totalMinutes = (bookingDetail.totalHours || 1) * 60;
                      const baseMinuteRate = (bookingDetail.totalAmount || 0) / totalMinutes;
                      const lateFeeRate = baseMinuteRate * (lateFeePercentage / 100);
                      const surcharge = Math.ceil(chargeableMinutes * lateFeeRate);
                      return surcharge.toLocaleString("vi-VN");
                    }
                    return (bookingDetail?.surchargeAmount || 0).toLocaleString("vi-VN");
                  })()}{" "}
                  đ
                </span>
              </div>
              <Divider style={{ margin: "8px 0" }} />
              <div className="flex justify-between text-lg font-semibold text-green-600">
                <span>Cần thanh toán</span>
                <span>{(finalPayable || 0).toLocaleString("vi-VN")} đ</span>
              </div>
              <Divider style={{ margin: "8px 0" }} />
              <div className="mt-2 flex gap-2">
                <Button icon={<ShoppingCartOutlined />} type="primary" disabled={!selectedBookingId || finalPayable <= 0}>
                  Thanh toán & Checkout
                </Button>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

interface CourtTabProps {
  data: ListCourtResponse[];
  loading: boolean;
  onSelectCourt: (courtId: string) => void;
  selectedCourtId: string | null;
}

const CourtTab = ({ data, loading, onSelectCourt, selectedCourtId }: CourtTabProps) => {
  const getStatusColor = (status?: string) => {
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
  };
  return (
    <div className="h-full p-3" style={{ borderLeft: "1px solid #f0f0f0" }}>
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
              <Col span={24} md={12} lg={8} xl={4} key={index}>
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
};

interface MenuTabProps {
  data: ListProductResponse[];
  loading: boolean;
  onAdd: (product: ListProductResponse) => void;
}

const MenuTab = ({ data, loading, onAdd }: MenuTabProps) => {
  return (
    <div className="h-full p-3" style={{ borderLeft: "1px solid #f0f0f0" }}>
      <Row gutter={[8, 8]}>
        {loading ? (
          <div className="justify-cente flex h-full w-full flex-col items-center">
            <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
            <div className="text-lg font-bold">Đang tải dữ liệu...</div>
          </div>
        ) : (
          data?.map((product, index) => (
            <Col span={24} md={12} lg={8} xl={4} key={index}>
              <Card
                hoverable
                styles={{ cover: { border: "1px solid #f0f0f0", borderTopLeftRadius: 8, borderTopRightRadius: 8 } }}
                onClick={() => onAdd(product)}
                cover={
                  <div className="relative">
                    <Image
                      style={{ width: "100%", height: "150px", objectFit: "contain" }}
                      draggable={false}
                      alt={`Thực đơn ${index + 1}`}
                      src={product.images?.[0] || "/placeholder/product-images-placeholder.jpg"}
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
};

const ServiceTab = () => {
  return <div>Dịch vụ</div>;
};

const CashierPage = () => {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Đang tải...</div>}>
      <CashierPageContent />
    </Suspense>
  );
};

export default CashierPage;
