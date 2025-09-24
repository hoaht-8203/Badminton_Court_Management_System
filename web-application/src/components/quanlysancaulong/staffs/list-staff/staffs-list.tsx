import React, { useState } from "react";
import type { ColumnsType } from "antd/es/table";
import { Breadcrumb, Button, Card, Col, Form, Input, Row, Select, Radio, Space, message, Avatar, Table, Pagination } from "antd";
import { SearchOutlined, ReloadOutlined, PlusOutlined, FileExcelOutlined } from "@ant-design/icons";
import StaffDetailBox from "./staff-detail-box";

import { EditOutlined } from "@ant-design/icons";

const getColumns = (onEditStaff?: (staff: any) => void): ColumnsType<any> => [
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
  {
    title: "",
    key: "actions",
    render: (_: any, record: any) => (
      <Button icon={<EditOutlined />} size="small" onClick={e => { e.stopPropagation(); onEditStaff && onEditStaff(record); }}>Cập nhật</Button>
    ),
    width: 100,
  },
];

interface StaffListProps {
  staffList: any[];
  onEditStaff?: (staff: any) => void;
}

const StaffList: React.FC<StaffListProps> = ({ staffList, onEditStaff }) => {
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const pagedData = staffList.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  return (
    <div>
      <Table
        columns={getColumns(onEditStaff)}
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
