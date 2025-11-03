"use client";
import { DebounceSelect } from "@/components/quanlysancaulong/court-schedule/DebounceSelect";
import { columns } from "@/components/quanlysancaulong/memberships/columns";
import SearchMembership from "@/components/quanlysancaulong/memberships/search-memberships";
import { useListMemberships, useUpdateMembershipStatus } from "@/hooks/useMembership";
import { useCreateUserMembership, useListUserMemberships } from "@/hooks/useUserMembershipService";
import { ApiError } from "@/lib/axios";
import { ListMembershipRequest, ListMembershipResponse, UserMembershipResponse } from "@/types-openapi/api";
import { CheckOutlined, EditOutlined, PlusOutlined, ReloadOutlined, StopOutlined } from "@ant-design/icons";
import {
  Breadcrumb,
  Button,
  Col,
  Descriptions,
  Divider,
  Drawer,
  Form,
  FormProps,
  Input,
  Row,
  Select,
  Space,
  Table,
  TableProps,
  Tabs,
  Tag,
  message,
} from "antd";
import dayjs from "dayjs";
import dynamic from "next/dynamic";
import React, { useCallback, useMemo, useState } from "react";
const CreateNewMembershipDrawer = dynamic(() => import("@/components/quanlysancaulong/memberships/create-new-membership-drawer"), { ssr: false });
const MembershipQrPaymentDrawer = dynamic(() => import("@/components/quanlysancaulong/memberships/membership-qr-payment-drawer"), { ssr: false });
const UpdateMembershipDrawer = dynamic(() => import("@/components/quanlysancaulong/memberships/update-membership-drawer"), { ssr: false });

const tableProps: TableProps<ListMembershipResponse> = {
  rowKey: "id",
  size: "small",
  scroll: { x: "max-content" },
  bordered: true,
};

const MembershipsPage = () => {
  const [searchParams, setSearchParams] = useState<ListMembershipRequest>({});
  const [openCreateDrawer, setOpenCreateDrawer] = useState(false);
  const [openUpdateDrawer, setOpenUpdateDrawer] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: membershipsData, isFetching: loading, refetch } = useListMemberships(searchParams);

  const updateStatusMutation = useUpdateMembershipStatus();
  const [openCreateUserMembership, setOpenCreateUserMembership] = useState(false);
  const createUserMembershipMutation = useCreateUserMembership();
  const [paymentMethod, setPaymentMethod] = useState<"Bank" | "Cash">("Bank");
  const [createdMembershipRes, setCreatedMembershipRes] = useState<any>(null);
  const [openQrDrawer, setOpenQrDrawer] = useState(false);
  const [form] = Form.useForm();

  type CustomerOption = { label: string; value: number; avatar: string };

  const fetchCustomers = async (search: string): Promise<CustomerOption[]> => {
    // Lazy import to avoid circular deps; use customer service directly if available
    const { customerService } = await import("@/services/customerService");
    const res = await customerService.listCustomerPaged({ page: 1, pageSize: 20, keyword: search || null });
    return (
      res.data?.items.map((c: any) => ({
        label: c.fullName ?? c.phoneNumber ?? c.email ?? String(c.id),
        value: c.id,
        avatar: c.avatarUrl ?? "",
      })) ?? []
    );
  };

  const {
    data: userMembershipData,
    isFetching: loadingUserMembership,
    refetch: refetchUserMembership,
  } = useListUserMemberships({
    membershipId: selectedId ?? 0,
  });

  const handleClickUpdateStatus = useCallback(
    (status: string) => {
      updateStatusMutation.mutate(
        { id: selectedId ?? 0, status },
        {
          onSuccess: () => {
            message.success("Cập nhật trạng thái thành công");
            refetch();
          },
          onError: (error: ApiError) => {
            for (const key in error.errors) {
              message.error(error.errors[key]);
            }
          },
        },
      );
    },
    [selectedId, updateStatusMutation, refetch],
  );

  const handleClickMembership = useCallback(
    (id: number) => {
      setSelectedId(id);
      refetchUserMembership();
    },
    [refetchUserMembership],
  );

  const userMembershipColumns: TableProps<UserMembershipResponse>["columns"] = useMemo(
    () => [
      { title: "ID", dataIndex: "id", key: "id", width: 80 },
      {
        title: "Khách hàng",
        key: "customer",
        width: 200,
        render: (_, r) => <>{r.customer?.fullName || r.customerId}</>,
      },
      {
        title: "Tên gói",
        dataIndex: "membershipName",
        key: "membershipName",
        width: 180,
        render: (_, r) => <>{(r as any).membershipName || r.membershipId}</>,
      },
      {
        title: "Bắt đầu",
        dataIndex: "startDate",
        key: "startDate",
        width: 140,
        render: (_, r) => (
          <>{r.startDate ? dayjs(r.startDate).format("YYYY-MM-DD HH:mm:ss") : r.startDate ? dayjs(r.startDate).format("YYYY-MM-DD HH:mm:ss") : "-"}</>
        ),
      },
      {
        title: "Kết thúc",
        dataIndex: "endDate",
        key: "endDate",
        width: 140,
        render: (_, r) => (
          <>{r.endDate ? dayjs(r.endDate).format("YYYY-MM-DD HH:mm:ss") : r.endDate ? dayjs(r.endDate).format("YYYY-MM-DD HH:mm:ss") : "-"}</>
        ),
      },
      {
        title: "Kích hoạt",
        dataIndex: "isActive",
        key: "isActive",
        width: 120,
        render: (_, r) => <span className={r.isActive ? "text-green-600" : "text-red-500"}>{r.isActive ? "Đã kích hoạt" : "Chưa kích hoạt"}</span>,
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        width: 140,
        render: (_, r) => {
          const s = (r as any).status as string | undefined;
          const vi = s === "PendingPayment" ? "Chờ thanh toán" : s === "Paid" ? "Đã thanh toán" : s === "Cancelled" ? "Đã hủy" : s || "-";
          return <>{vi}</>;
        },
      },
    ],
    [],
  );

  const handleOpenQr = useCallback((detail: any) => {
    setCreatedMembershipRes(detail);
    setOpenQrDrawer(true);
  }, []);

  return (
    <section>
      <div className="mb-4">
        <Breadcrumb
          items={[
            {
              title: "Quản trị ứng dụng",
            },
            {
              title: "Quản lý gói hội viên",
            },
          ]}
        />
      </div>

      <div className="mb-2">
        <SearchMembership onSearch={setSearchParams} onReset={() => setSearchParams({})} />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <div>
            <span className="font-bold text-green-500">Tổng số gói: {membershipsData?.data?.length ?? 0}</span>
          </div>
          <div className="flex gap-2">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpenCreateDrawer(true)}>
              Thêm gói hội viên
            </Button>
            <Button type="primary" icon={<ReloadOutlined />} onClick={() => refetch()}>
              Tải lại
            </Button>
          </div>
        </div>

        <Table<ListMembershipResponse>
          {...tableProps}
          rowHoverable={false}
          columns={columns}
          dataSource={membershipsData?.data ?? []}
          loading={loading}
          rowClassName={(record) => (record.id === selectedId ? "!bg-blue-50" : "")}
          onRow={(record) => ({
            onClick: () => {
              setSelectedId(record.id ?? null);
              handleClickMembership(record.id ?? 0);
            },
          })}
          expandable={{
            expandedRowRender: (record) => (
              <MembershipInformation
                record={record}
                handleClickUpdate={() => {
                  setSelectedId(record.id ?? null);
                  setOpenUpdateDrawer(true);
                }}
                handleClickUpdateStatus={(status) => {
                  handleClickUpdateStatus(status);
                }}
              />
            ),
            onExpand: (expanded, record) => {
              if (expanded && record.id) {
                setSelectedId(record.id);
              }
            },
          }}
        />
      </div>

      {/* User Memberships table */}
      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <span className="font-bold">Danh sách hội viên của gói đã chọn</span>
          </div>
          <div className="flex gap-2">
            <Button type="primary" disabled={!selectedId} onClick={() => setOpenCreateUserMembership(true)}>
              Thêm hội viên
            </Button>
            <Button
              icon={<ReloadOutlined />}
              disabled={!selectedId}
              onClick={() => {
                refetchUserMembership();
              }}
            >
              Tải lại
            </Button>
          </div>
        </div>

        <Table<UserMembershipResponse>
          rowKey="id"
          size="small"
          bordered
          loading={loadingUserMembership}
          dataSource={userMembershipData?.data ?? []}
          columns={userMembershipColumns}
          expandable={{
            expandRowByClick: true,
            expandedRowRender: (record) => <MemoUserMembershipExpanded record={record} onOpenQr={handleOpenQr} />,
          }}
          pagination={{ pageSize: 10 }}
        />
      </div>

      <CreateNewMembershipDrawer open={openCreateDrawer} onClose={() => setOpenCreateDrawer(false)} />
      <UpdateMembershipDrawer open={openUpdateDrawer} onClose={() => setOpenUpdateDrawer(false)} id={selectedId} />

      {/* Drawer: Tạo mới hội viên cho gói đã chọn */}
      <Drawer
        forceRender
        title="Thêm hội viên cho gói"
        open={openCreateUserMembership}
        width={560}
        onClose={() => {
          form.resetFields();
          setOpenCreateUserMembership(false);
        }}
        extra={
          <Space>
            <Button
              onClick={() => {
                form.resetFields();
                setOpenCreateUserMembership(false);
              }}
            >
              Hủy
            </Button>
            <Button type="primary" onClick={() => form.submit()} loading={createUserMembershipMutation.isPending}>
              Xác nhận
            </Button>
          </Space>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={
            ((values: any) => {
              if (!selectedId) {
                message.warning("Vui lòng chọn gói hội viên");
                return;
              }
              const payload: any = {
                customerId: values.customerId.value,
                membershipId: selectedId,
                isActive: undefined,
                paymentMethod: paymentMethod,
                paymentNote: values.note,
              };
              createUserMembershipMutation.mutate(payload, {
                onSuccess: (res) => {
                  const data = res.data as any;
                  message.success("Tạo hội viên thành công");
                  setCreatedMembershipRes(data);
                  form.resetFields();
                  setOpenCreateUserMembership(false);
                  handleClickMembership(selectedId);
                  // If transfer method, open QR drawer
                  if (paymentMethod === "Bank" && data?.qrUrl) {
                    setOpenQrDrawer(true);
                  }
                },
                onError: (err: any) => {
                  message.error(err?.message || "Không thể tạo hội viên");
                },
              });
            }) as FormProps["onFinish"]
          }
        >
          <Form.Item label="Khách hàng" name="customerId" rules={[{ required: true, message: "Bắt buộc" }]}>
            <DebounceSelect<CustomerOption> showSearch placeholder="Chọn khách hàng" fetchOptions={fetchCustomers} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Ghi chú" name="note">
            <Input.TextArea rows={3} placeholder="Nhập ghi chú" />
          </Form.Item>
          <Form.Item label="Phương thức thanh toán" required>
            <Select
              value={paymentMethod}
              onChange={(v: "Bank" | "Cash") => setPaymentMethod(v)}
              options={[
                { value: "Bank", label: "Chuyển khoản" },
                { value: "Cash", label: "Tiền mặt" },
              ]}
            />
          </Form.Item>
        </Form>
      </Drawer>

      <MembershipQrPaymentDrawer
        detail={createdMembershipRes}
        open={openQrDrawer}
        onClose={() => {
          setOpenQrDrawer(false);
          setCreatedMembershipRes(null);
        }}
        title="Thanh toán chuyển khoản"
        width={480}
      />
    </section>
  );
};

export default MembershipsPage;

const MembershipInformation = React.memo(function MembershipInformation({
  record,
  handleClickUpdate,
  handleClickUpdateStatus,
}: {
  record: ListMembershipResponse;
  handleClickUpdate: () => void;
  handleClickUpdateStatus: (status: string) => void;
}) {
  return (
    <div>
      <Row gutter={16} className="mb-4">
        <Col span={6}>
          <Row gutter={16}>
            <Col span={10}>Tên gói:</Col>
            <Col span={14}>{record.name}</Col>
            <Col span={24}>
              <Divider size="small" />
            </Col>
            <Col span={10}>Giá:</Col>
            <Col span={14}>{record.price?.toLocaleString("vi-VN")}</Col>
            <Col span={24}>
              <Divider size="small" />
            </Col>
            <Col span={10}>% giảm giá:</Col>
            <Col span={14}>{record.discountPercent}</Col>
          </Row>
        </Col>

        <Divider type="vertical" size="small" style={{ height: "auto" }} />

        <Col span={6}>
          <Row gutter={16}>
            <Col span={10}>Thời hạn:</Col>
            <Col span={14}>{record.durationDays} ngày</Col>
            <Col span={24}>
              <Divider size="small" />
            </Col>
            <Col span={10}>Trạng thái:</Col>
            <Col span={14}>{record.status}</Col>
          </Row>
        </Col>

        <Divider type="vertical" size="small" style={{ height: "auto" }} />

        <Col span={6}>
          <Row gutter={16}>
            <Col span={6}>Mô tả:</Col>
            <Col span={18}>{record.description || "-"}</Col>
          </Row>
        </Col>
      </Row>

      <div className="flex justify-end gap-2">
        <Button type="primary" icon={<EditOutlined />} onClick={handleClickUpdate}>
          Cập nhật thông tin
        </Button>
        {record.status === "Active" ? (
          <Button color="danger" variant="outlined" icon={<StopOutlined />} onClick={() => handleClickUpdateStatus("Inactive")}>
            Ngừng hoạt động
          </Button>
        ) : (
          <Button color="green" variant="outlined" icon={<CheckOutlined />} onClick={() => handleClickUpdateStatus("Active")}>
            Kích hoạt
          </Button>
        )}
      </div>
    </div>
  );
});

const UserMembershipExpanded = ({ record, onOpenQr }: { record: UserMembershipResponse; onOpenQr: (detail: any) => void }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "PendingPayment":
        return "orange";
      case "Paid":
        return "green";
      case "Cancelled":
        return "red";
      default:
        return "default";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PendingPayment":
        return "Chờ thanh toán";
      case "Paid":
        return "Đã thanh toán";
      case "Cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const paymentColumns = [
    {
      title: "Payment ID",
      dataIndex: "id",
      key: "id",
      width: 200,
      render: (text: string) => <span className="font-mono text-sm">{text}</span>,
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      width: 120,
      render: (amount: number) => <span className="font-medium text-green-600">{Number(amount).toLocaleString("vi-VN")}₫</span>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string) => <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>,
    },
    {
      title: "Ngày tạo",
      dataIndex: "paymentCreatedAt",
      key: "paymentCreatedAt",
      width: 150,
      render: (date: string) => <span className="text-sm">{date ? new Date(date).toLocaleString("vi-VN") : "-"}</span>,
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
      key: "note",
      render: (note: string) => note || "-",
    },
  ];

  const items = [
    {
      key: "basic",
      label: "Thông tin cơ bản",
      children: (
        <Descriptions
          bordered
          column={2}
          size="small"
          className="!mb-4"
          title={
            <div className="flex items-center justify-between">
              <span>Thông tin hội viên</span>
              <div className="flex items-center gap-2">
                {/* {record.status === "Cancelled" && (
                  <Button
                    onClick={() => {
                      extendPaymentMutation.mutate(
                        { userMembershipId: record.id!, note: "" },
                        {
                          onSuccess: (res) => {
                            const data = res.data as any;
                            onOpenQr(data);
                          },
                        },
                      );
                    }}
                  >
                    Gia hạn thanh toán
                  </Button>
                )} */}
                {record.status === "PendingPayment" && (
                  <Button
                    type="primary"
                    onClick={() => {
                      const payment = (record as any).payment as any;
                      const paymentId = payment?.id;
                      const paymentAmount = payment?.amount || 0;
                      const createdAt = payment?.paymentCreatedAt ? new Date(payment.paymentCreatedAt) : new Date();
                      // Use the same hold window as backend create (avoid frontend mismatch)
                      const holdMinutes = 5;
                      const expiresAtUtc = new Date(createdAt.getTime() + holdMinutes * 60 * 1000).toISOString();
                      const acc = "VQRQAEMLF5363"; // fallback to backend default
                      const bank = "MBBank";
                      const amount = Math.ceil(paymentAmount).toString();
                      const des = encodeURIComponent(paymentId || "");
                      const qrUrl = paymentId ? `https://qr.sepay.vn/img?acc=${acc}&bank=${bank}&amount=${amount}&des=${des}` : undefined;

                      onOpenQr({
                        userMembershipId: record.id,
                        customerId: record.customerId,
                        membershipId: record.membershipId,
                        status: (record as any).status,
                        isActive: record.isActive,
                        startDate: record.startDate as any,
                        endDate: record.endDate as any,
                        paymentId,
                        paymentAmount,
                        paymentMethod: "Bank",
                        qrUrl,
                        holdMinutes,
                        expiresAtUtc,
                      });
                    }}
                  >
                    Xem QR
                  </Button>
                )}
              </div>
            </div>
          }
        >
          <Descriptions.Item label="Khách hàng" span={1}>
            {record.customer?.fullName || record.customerId}
          </Descriptions.Item>
          <Descriptions.Item label="SĐT" span={1}>
            {record.customer?.phoneNumber || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Email" span={1}>
            {record.customer?.email || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Gói" span={1}>
            {record.membershipName || record.membershipId}
          </Descriptions.Item>
          <Descriptions.Item label="Bắt đầu" span={1}>
            {record.startDate ? dayjs(record.startDate).format("DD/MM/YYYY HH:mm:ss") : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Kết thúc" span={1}>
            {record.endDate ? dayjs(record.endDate).format("DD/MM/YYYY HH:mm:ss") : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái" span={1}>
            <Tag color={getStatusColor((record as any).status || "")}>{getStatusText((record as any).status || "")}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Kích hoạt" span={1}>
            {record.isActive ? <span className="text-green-600">Đã kích hoạt</span> : <span className="text-red-500">Chưa kích hoạt</span>}
          </Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: "payments",
      label: "Lịch sử thanh toán",
      children: (
        <div>
          {record.payment ? (
            <Table columns={paymentColumns as any} dataSource={record.payments ?? []} pagination={false} size="small" rowKey="id" bordered />
          ) : (
            <div className="py-8 text-center text-gray-500">Không có lịch sử thanh toán</div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <Tabs defaultActiveKey="basic" items={items as any} />
    </div>
  );
};

const MemoUserMembershipExpanded = React.memo(UserMembershipExpanded);
