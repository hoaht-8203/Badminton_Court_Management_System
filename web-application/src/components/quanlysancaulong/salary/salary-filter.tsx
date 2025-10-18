import { Card, Form, Input, Button, Radio } from "antd";

export default function SalaryFilter({ onSearch, onReset }: { onSearch: (values: any) => void; onReset: () => void }) {
  const [form] = Form.useForm();
  const handleFinish = (values: any) => {
    onSearch(values);
  };
  return (
    <Card title={<span style={{ fontWeight: 600 }}>Lọc dữ liệu</span>} className="mb-2">
      <Form form={form} layout="inline" onFinish={handleFinish}>
        <Form.Item name="keyword" label="Tìm kiếm theo tên, mã bảng lương">
          <Input placeholder="Nhập thông tin" allowClear />
        </Form.Item>
        <Form.Item name="status" label="Trạng thái">
          <Radio.Group>
            <Radio value={undefined}>Tất cả</Radio>
            <Radio value="draft">Tạm tính</Radio>
            <Radio value="final">Đã chốt</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Tìm kiếm
          </Button>
        </Form.Item>
        <Form.Item>
          <Button
            onClick={() => {
              form.resetFields();
              onReset();
            }}
          >
            Reset
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
