import React, { useState } from "react";
import type { ColumnsType } from "antd/es/table";
import { Breadcrumb, Button, Card, Col, Form, Input, Row, Select, Radio, Space, message, Avatar, Table, Pagination } from "antd";
import { SearchOutlined, ReloadOutlined, PlusOutlined, FileExcelOutlined } from "@ant-design/icons";
import StaffDetailBox from "./staff-detail-box";

const columns: ColumnsType<any> = [
  {
    title: "Mã nhân viên",
    dataIndex: "id",
    key: "id",
    render: (text: string, record: any) => (
      <div style={{ display: "flex", alignItems: "center" }}>
        <Avatar src={record.avatar ? record.avatar : null} />
        <span style={{ marginLeft: 8 }}>NV{text}</span>
      </div>
    ),
  },
  {
    title: "Tên nhân viên",
    dataIndex: "fullName",
    key: "fullName",
  },
  {
    title: "Số điện thoại",
    dataIndex: "phoneNumber",
    key: "phoneNumber",
  },
  {
    title: "Số CMND/CCCD",
    dataIndex: "identificationNumber",
    key: "identificationNumber",
  },
];

interface StaffListProps {
  staffList: any[];
}

const StaffList: React.FC<StaffListProps> = ({ staffList }) => {
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Dummy search handler

  // Phân trang dữ liệu
  const pagedData = staffList.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div>
      {/* Staff Table */}
      <Table
        columns={columns}
        dataSource={pagedData}
        rowKey="id"
        pagination={false}
        expandable={{
          expandedRowRender: (record) => <StaffDetailBox staff={record} />,
          expandedRowKeys,
          onExpand: (expanded, record) => {
            setExpandedRowKeys(expanded ? [record.id] : []);
          },
        }}
        onRow={(record) => ({
          onClick: () => {
            setExpandedRowKeys([record.id]);
          },
        })}
      />
      <Pagination
        current={currentPage}
        pageSize={pageSize}
        total={staffList.length}
        onChange={setCurrentPage}
        style={{ marginTop: 16, textAlign: "right" }}
      />
    </div>
  );
};

export default StaffList;
