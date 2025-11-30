import { Card, Form, Input, Button, Radio, DatePicker, Row, Col, Select, Space } from "antd";
import { SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

export default function SalaryFilter({ onSearch, onReset }: { onSearch: (values: any) => void; onReset: () => void }) {
  const [form] = Form.useForm();
  const handleFinish = (values: any) => {
    const searchValues: any = {
      keyword: values.keyword || undefined,
      status: values.status || undefined,
    };

    // Start date filters - default to "=" if operator not selected
    if (values.startDate) {
      searchValues.startDateOperator = values.startDateOperator || "=";
      searchValues.startDate = dayjs(values.startDate).format("YYYY-MM-DD");
    }

    // End date filters - default to "=" if operator not selected
    if (values.endDate) {
      searchValues.endDateOperator = values.endDateOperator || "=";
      searchValues.endDate = dayjs(values.endDate).format("YYYY-MM-DD");
    }

    onSearch(searchValues);
  };
  return (
    <Card
      title={
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <div style={{ fontWeight: 600 }}>Lọc dữ liệu</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Button type="primary" icon={<SearchOutlined />} onClick={() => form.submit()}>
              Tìm kiếm
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                form.resetFields();
                onReset();
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      }
      className="mb-2"
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} initialValues={{ startDateOperator: "=", endDateOperator: "=" }}>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="keyword" label="Tìm kiếm theo tên, mã bảng lương">
              <Input placeholder="Nhập tên hoặc mã (VD: BL000001)" allowClear />
            </Form.Item>
          </Col>

          <Col span={5}>
            <Form.Item label="Ngày bắt đầu">
              <Space.Compact style={{ width: "100%" }}>
                <Form.Item name="startDateOperator" noStyle>
                  <Select style={{ width: 80 }} placeholder="Toán tử">
                    <Select.Option value=">">&gt;</Select.Option>
                    <Select.Option value="=">=</Select.Option>
                    <Select.Option value="<">&lt;</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item name="startDate" noStyle style={{ flex: 1 }}>
                  <DatePicker style={{ width: "100%" }} placeholder="Chọn ngày" />
                </Form.Item>
              </Space.Compact>
            </Form.Item>
          </Col>
          <Col span={5}>
            <Form.Item label="Ngày kết thúc">
              <Space.Compact style={{ width: "100%" }}>
                <Form.Item name="endDateOperator" noStyle>
                  <Select style={{ width: 80 }} placeholder="Toán tử">
                    <Select.Option value=">">&gt;</Select.Option>
                    <Select.Option value="=">=</Select.Option>
                    <Select.Option value="<">&lt;</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item name="endDate" noStyle style={{ flex: 1 }}>
                  <DatePicker style={{ width: "100%" }} placeholder="Chọn ngày" />
                </Form.Item>
              </Space.Compact>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="status" label="Trạng thái">
              <Radio.Group>
                <Radio value={undefined}>Tất cả</Radio>
                <Radio value="Pending">Chưa trả xong</Radio>
                <Radio value="Completed">Đã trả</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Card>
  );
}
