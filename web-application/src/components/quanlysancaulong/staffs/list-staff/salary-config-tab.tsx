import { Button, Card, Descriptions, Tag } from "antd";

const SalaryConfigTab = ({ staff }: { staff: any }) => {
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

  return (
    <Card title="Thông tin lương" extra={<Button type="primary">Cập nhật</Button>} style={{ marginTop: 8, borderRadius: 8 }}>
      {hasSalary ? (
        <Descriptions column={1} bordered size="small" style={{ marginTop: 8 }}>
          <Descriptions.Item label="Loại lương">
            {salaryObj.salaryType === "fixed" && "Lương cố định"}
            {salaryObj.salaryType === "hourly" && "Lương theo giờ"}
            {salaryObj.salaryType === "shift" && "Lương theo ca"}
          </Descriptions.Item>
          {salaryObj.salaryAmount && (
            <Descriptions.Item label="Mức lương">
              <b>{salaryObj.salaryAmount}</b>
              {salaryObj.salaryType === "fixed" && " / tháng"}
              {salaryObj.salaryType === "hourly" && " / giờ"}
              {salaryObj.salaryType === "shift" && " / ca"}
            </Descriptions.Item>
          )}
          {salaryObj.showAdvanced && Array.isArray(salaryObj.advancedRows) && (
            <Descriptions.Item label="Thiết lập nâng cao">
              {salaryObj.advancedRows.map((row: any, idx: number) => (
                <div key={idx} style={{ marginBottom: 8 }}>
                  <Tag color="blue">{row.shiftId === 0 ? "Mặc định" : row.shiftName || row.shiftId}</Tag> - <b>{row.amount}</b> / ca
                  <span style={{ marginLeft: 8 }}>
                    Thứ 7: {row.saturday}, Chủ nhật: {row.sunday}, Ngày nghỉ: {row.holiday}, Ngày lễ: {row.specialDay}
                  </span>
                </div>
              ))}
            </Descriptions.Item>
          )}
          {(salaryObj.deductionLateMethod || salaryObj.deductionLateValue || salaryObj.deductionLateParam) && (
            <Descriptions.Item label="Giảm trừ đi muộn">
              {salaryObj.deductionLateMethod === "count" ? "Theo số lần" : "Theo số phút"} - <b>{salaryObj.deductionLateValue}</b> VNĐ /{" "}
              {salaryObj.deductionLateParam}
            </Descriptions.Item>
          )}
          {(salaryObj.deductionEarlyMethod || salaryObj.deductionEarlyValue || salaryObj.deductionEarlyParam) && (
            <Descriptions.Item label="Giảm trừ về sớm">
              {salaryObj.deductionEarlyMethod === "count" ? "Theo số lần" : "Theo số phút"} - <b>{salaryObj.deductionEarlyValue}</b> VNĐ /{" "}
              {salaryObj.deductionEarlyParam}
            </Descriptions.Item>
          )}
        </Descriptions>
      ) : (
        <div style={{ color: "#888", textAlign: "center", padding: "32px 0" }}>Chưa có cấu hình lương</div>
      )}
    </Card>
  );
};

export default SalaryConfigTab;
