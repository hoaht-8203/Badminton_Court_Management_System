import { Form, Input, Button, Select, DatePicker } from "antd";
import { SearchOutlined, ReloadOutlined } from "@ant-design/icons";

const payPeriods = [
  { value: "monthly", label: "Hàng tháng" },
  { value: "weekly", label: "Hàng tuần" },
];

export default function SalaryFilter({ onSearch, onReset }: { onSearch: (values: any) => void; onReset: () => void }) {
  const [form] = Form.useForm();
  return (
    <Form form={form} layout="inline" onFinish={onSearch} style={{ marginBottom: 0 }}>
      <Form.Item label="Tìm kiếm theo mã, tên bảng lương" name="keyword" style={{ marginRight: 8 }}>
        <Input placeholder="Nhập thông tin" allowClear style={{ width: 340 }} />
      </Form.Item>
      <Form.Item label="Kỳ hạn trả" name="payPeriod" style={{ marginRight: 8 }}>
        <Select options={payPeriods} allowClear placeholder="Chọn kỳ hạn" style={{ width: 160 }} />
      </Form.Item>
      <Form.Item label="Kỳ làm việc" name="workDate" style={{ marginRight: 8 }}>
        <DatePicker.RangePicker format="DD/MM/YYYY" style={{ width: 240 }} />
      </Form.Item>
      <Button type="primary" icon={<SearchOutlined />} htmlType="submit" style={{ marginRight: 8 }}>
        Tìm kiếm
      </Button>
      <Button icon={<ReloadOutlined />} onClick={onReset}>
        Reset
      </Button>
    </Form>
  );
}
