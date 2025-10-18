import { List } from "antd";

export default function SalaryHistoryPanel({ history }: { history: any[] }) {
  return (
    <List
      size="small"
      bordered
      dataSource={history}
      renderItem={(item) => (
        <List.Item>
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
            <span>{item.date}</span>
            <span>{item.action}</span>
            <span>{item.user}</span>
            <span>{item.amount}</span>
          </div>
        </List.Item>
      )}
      style={{ background: "#fff" }}
    />
  );
}
