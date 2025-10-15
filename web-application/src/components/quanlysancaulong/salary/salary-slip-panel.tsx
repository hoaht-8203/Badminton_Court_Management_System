import { List } from "antd";

export default function SalarySlipPanel({ slips }: { slips: any[] }) {
  return (
    <List
      size="small"
      bordered
      dataSource={slips || [{ name: "Phiếu lương demo", amount: 0 }]}
      renderItem={(item) => {
        const slip = item as any;
        return (
          <List.Item>
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
              <span>{slip.name}</span>
              <span>{slip.amount}</span>
            </div>
          </List.Item>
        );
      }}
    />
  );
}
