import { Button, Card, Descriptions, Tag, Table, Divider } from "antd";
import type { ColumnsType } from "antd/es/table";

const SalaryConfigTab = ({ staff, onEditStaff }: { staff: any; onEditStaff?: (staff: any, tab?: string) => void }) => {
  let salaryObj: any = {};
  if (staff?.salarySettings) {
    try {
      salaryObj = typeof staff.salarySettings === "string" ? JSON.parse(staff.salarySettings) : staff.salarySettings;
    } catch {}
  }

  const hasSalary =
    salaryObj.salaryType ||
    salaryObj.salaryAmount ||
    (salaryObj.showAdvanced && Array.isArray(salaryObj.advancedRows) && salaryObj.advancedRows.length > 0);

  const handleUpdate = () => {
    if (onEditStaff) {
      // Gọi onEditStaff với staff và tab "salary" để mở modal với tab thiết lập lương
      onEditStaff(staff, "salary");
    }
  };

  // Get salary unit
  const getSalaryUnit = () => {
    if (salaryObj.salaryType === "fixed") return "/ tháng";
    if (salaryObj.salaryType === "hourly") return "/ giờ";
    if (salaryObj.salaryType === "shift") return "/ ca";
    return "";
  };

  // Prepare table data for advanced rows
  const advancedTableData =
    salaryObj.showAdvanced && Array.isArray(salaryObj.advancedRows)
      ? salaryObj.advancedRows.map((row: any, idx: number) => ({
          key: idx,
          shift: row.shiftId === 0 ? "Mặc định" : row.shiftName || row.shiftId || "-",
          amount: row.amount ? `${row.amount} ${getSalaryUnit()}` : "-",
          saturday: row.saturday || "-",
          sunday: row.sunday || "-",
          holiday: row.holiday || "-",
          specialDay: row.specialDay || "-",
        }))
      : [];

  const advancedColumns: ColumnsType<any> = [
    {
      title: "Ca",
      dataIndex: "shift",
      key: "shift",
      width: 150,
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "Lương/ca",
      dataIndex: "amount",
      key: "amount",
      width: 150,
      render: (text: string) => <b>{text}</b>,
    },
    {
      title: "Thứ 7",
      dataIndex: "saturday",
      key: "saturday",
      width: 100,
      align: "center",
    },
    {
      title: "Chủ nhật",
      dataIndex: "sunday",
      key: "sunday",
      width: 100,
      align: "center",
    },
    {
      title: "Ngày nghỉ",
      dataIndex: "holiday",
      key: "holiday",
      width: 100,
      align: "center",
    },
    {
      title: "Ngày lễ tết",
      dataIndex: "specialDay",
      key: "specialDay",
      width: 120,
      align: "center",
    },
  ];

  return (
    <Card
      title="Thông tin lương"
      extra={
        <Button type="primary" onClick={handleUpdate}>
          Cập nhật
        </Button>
      }
      style={{ marginTop: 8, borderRadius: 8 }}
    >
      {hasSalary ? (
        <div>
          {/* Lương chính */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 16 }}>Lương chính</div>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="Loại lương" span={1}>
                {salaryObj.salaryType === "fixed" && "Lương cố định"}
                {salaryObj.salaryType === "hourly" && "Lương theo giờ"}
                {salaryObj.salaryType === "shift" && "Lương theo ca"}
              </Descriptions.Item>
              {salaryObj.salaryAmount && (
                <Descriptions.Item label="Mức lương" span={1}>
                  <b>{salaryObj.salaryAmount}</b> {getSalaryUnit()}
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* Thiết lập nâng cao */}
            {salaryObj.showAdvanced && Array.isArray(salaryObj.advancedRows) && salaryObj.advancedRows.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 500, marginBottom: 8, color: "#666" }}>Thiết lập nâng cao</div>
                <Table
                  columns={advancedColumns}
                  dataSource={advancedTableData}
                  pagination={false}
                  size="small"
                  bordered
                  style={{ background: "#fafafa" }}
                />
              </div>
            )}
          </div>

          {/* Giảm trừ */}
          {(salaryObj.deductionLateMethod ||
            salaryObj.deductionLateValue ||
            salaryObj.deductionLateParam ||
            salaryObj.deductionEarlyMethod ||
            salaryObj.deductionEarlyValue ||
            salaryObj.deductionEarlyParam) && (
            <>
              <Divider />
              <div>
                <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 16 }}>Giảm trừ</div>
                <Descriptions column={2} bordered size="small">
                  {(salaryObj.deductionLateMethod || salaryObj.deductionLateValue || salaryObj.deductionLateParam) && (
                    <Descriptions.Item label="Đi muộn" span={1}>
                      <b>{salaryObj.deductionLateValue}</b> VNĐ / {salaryObj.deductionLateParam}{" "}
                      {salaryObj.deductionLateMethod === "count" ? "lần" : "phút"}
                    </Descriptions.Item>
                  )}
                  {(salaryObj.deductionEarlyMethod || salaryObj.deductionEarlyValue || salaryObj.deductionEarlyParam) && (
                    <Descriptions.Item label="Về sớm" span={1}>
                      <b>{salaryObj.deductionEarlyValue}</b> VNĐ / {salaryObj.deductionEarlyParam}{" "}
                      {salaryObj.deductionEarlyMethod === "count" ? "lần" : "phút"}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </div>
            </>
          )}
        </div>
      ) : (
        <div style={{ color: "#888", textAlign: "center", padding: "32px 0" }}>Chưa có cấu hình lương</div>
      )}
    </Card>
  );
};

export default SalaryConfigTab;
