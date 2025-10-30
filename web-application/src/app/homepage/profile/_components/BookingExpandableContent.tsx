"use client";

import { ListUserBookingHistoryResponse } from "@/types-openapi/api";
import { CreditCardOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { Skeleton, Tabs } from "antd";
import dynamic from "next/dynamic";
import { memo } from "react";

const BookingDetails = dynamic(() => import("./BookingDetails"), {
  loading: () => <Skeleton active paragraph={{ rows: 4 }} />,
  ssr: false,
});

const PaymentHistory = dynamic(() => import("./PaymentHistory"), {
  loading: () => <Skeleton active paragraph={{ rows: 3 }} />,
  ssr: false,
});

type Props = {
  record: ListUserBookingHistoryResponse;
};

function Component({ record }: Props) {
  return (
    <Tabs
      items={[
        {
          key: "details",
          label: (
            <span>
              <InfoCircleOutlined className="mr-2" />
              Chi tiết đặt sân
            </span>
          ),
          children: <BookingDetails record={record} />,
        },
        {
          key: "payments",
          label: (
            <span>
              <CreditCardOutlined className="mr-2" />
              Lịch sử thanh toán
            </span>
          ),
          children: <PaymentHistory record={record} />,
        },
      ]}
    />
  );
}

export default memo(Component);
