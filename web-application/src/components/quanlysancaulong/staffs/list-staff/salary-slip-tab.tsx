import React from "react";
import { Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useGetPayrollItemsByStaff } from "@/hooks/usePayroll";

const SalarySlipTab = ({ staff }: { staff: any }) => {
	const { data: items, isFetching } = useGetPayrollItemsByStaff(staff?.id);


	const formatDate = (value: any) => {
		if (!value) return "-";
		try {
			return new Date(value).toLocaleDateString();
		} catch (ex) {
			return String(value);
		}
	};

	const columns: ColumnsType<any> = [
		{ title: "ID", dataIndex: "id", key: "id" },
		{
			title: "Kỳ lương",
			key: "period",
			render: (_: any, record: any) => {
				const s = record.payrollStartDate ? formatDate(record.payrollStartDate) : "-";
				const e = record.payrollEndDate ? formatDate(record.payrollEndDate) : "-";
				return `${s} - ${e}`;
			},
		},
		{ title: "Lương thực nhận", dataIndex: "netSalary", key: "netSalary", render: (v) => v?.toLocaleString() },
		{ title: "Đã trả", dataIndex: "paidAmount", key: "paidAmount", render: (v) => v?.toLocaleString() },
		{ title: "Trạng thái", dataIndex: "status", key: "status", render: (s: string) => <Tag color={s === "Completed" ? "green" : "orange"}>{s}</Tag> },
		{ title: "Ghi chú", dataIndex: "note", key: "note" },
	];

	return (
		<div>
			<Table
				columns={columns}
				dataSource={items ?? []}
				loading={isFetching}
				rowKey={(record) => record.id}
				pagination={{ pageSize: 3 }}
				size="small"
			/>
		</div>
	);
};

export default SalarySlipTab;
