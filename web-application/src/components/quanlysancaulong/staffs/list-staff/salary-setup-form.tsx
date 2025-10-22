import { shiftService } from "@/services/shiftService";
import { Button, Card, Form, Input, Select, Switch } from "antd";
import React from "react";

const salaryTypes = [
  { value: "fixed", label: "Lương cố định" },
  { value: "hourly", label: "Lương theo giờ" },
  { value: "shift", label: "Lương theo ca" },
];
// const salaryTemplates = [
//   { value: "template1", label: "Mẫu lương 1" },
//   { value: "template2", label: "Mẫu lương 2" },
// ];

import type { FormInstance } from "antd/es/form";

interface SalarySetupFormProps {
  staff?: any;
  onSubmit?: (values: any) => void;
  onCancel?: () => void;
  form: FormInstance<any>;
  onSalaryDataChange?: (data: any) => void;
  salarySettingsLoaded?: boolean;
}

export default function SalarySetupForm({ onSubmit, onCancel, form, onSalaryDataChange, staff }: SalarySetupFormProps) {
  // State declarations
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [shiftOptions, setShiftOptions] = React.useState<{ value: string; label: string }[]>([]);

  // Lấy danh sách ca khi bật nâng cao hoặc khi mount
  React.useEffect(() => {
    if (showAdvanced) {
      shiftService.list().then((res) => {
        if (res.data && Array.isArray(res.data)) {
          setShiftOptions(res.data.map((shift) => ({ value: shift.id?.toString() || "", label: shift.name || "" })));
        }
      });
    }
  }, [showAdvanced]);
  // Only keep the first declaration and useEffect above

  React.useEffect(() => {
    if (staff && staff.salarySettings) {
      let salaryObj = staff.salarySettings;
      if (typeof salaryObj === "string") {
        try {
          salaryObj = JSON.parse(salaryObj);
        } catch {}
      }
      // Đồng bộ nâng cao
      if (typeof salaryObj.showAdvanced !== "undefined") {
        setShowAdvanced(!!salaryObj.showAdvanced);
        if (salaryObj.showAdvanced && Array.isArray(salaryObj.advancedRows)) {
          // Đảm bảo advancedRows có đủ shiftId và shiftName
          const mappedRows = salaryObj.advancedRows.map((row: any, idx: number) => {
            if (idx === 0) {
              return {
                ...row,
                shiftId: 0,
                shiftName: "Mặc định",
              };
            }
            // Nếu đã có shiftId và shiftName thì giữ nguyên, nếu chưa thì lấy từ shiftType
            if (typeof row.shiftId === "undefined" && typeof row.shiftType !== "undefined") {
              // Tìm shiftName từ shiftOptions nếu có
              const found = shiftOptions.find((opt) => opt.value === row.shiftType);
              return {
                ...row,
                shiftId: row.shiftType,
                shiftName: found ? found.label : "",
              };
            }
            return row;
          });
          setAdvancedRows(mappedRows);
        }
      }
      // Đồng bộ giảm trừ
      const hasDeduction =
        salaryObj.deductionLateMethod ||
        salaryObj.deductionLateValue ||
        salaryObj.deductionLateParam ||
        salaryObj.deductionEarlyMethod ||
        salaryObj.deductionEarlyValue ||
        salaryObj.deductionEarlyParam;
      setShowDeductionConfig(!!hasDeduction);
    }
  }, [staff?.salarySettings, shiftOptions]);
  // Khi staff.salarySettings thay đổi, đồng bộ lại state nâng cao
  React.useEffect(() => {
    if (staff && staff.salarySettings) {
      let salaryObj = staff.salarySettings;
      if (typeof salaryObj === "string") {
        try {
          salaryObj = JSON.parse(salaryObj);
        } catch {}
      }
      if (typeof salaryObj.showAdvanced !== "undefined") {
        setShowAdvanced(!!salaryObj.showAdvanced);
        if (salaryObj.showAdvanced && Array.isArray(salaryObj.advancedRows)) {
          setAdvancedRows(salaryObj.advancedRows);
        }
      }
    }
  }, [staff?.salarySettings]);
  if (!form) {
    throw new Error("SalarySetupForm requires a connected form instance via the 'form' prop.");
  }
  // ...existing code...
  // Remove duplicate declarations and useEffect
  const [showDeductionConfig, setShowDeductionConfig] = React.useState(false);
  // Hàm lấy dữ liệu submit
  const getSalaryData = () => {
    if (showAdvanced) {
      // Nếu dùng nâng cao, chỉ lấy advancedRows
      return { advancedRows };
    } else {
      // Nếu không, chỉ lấy salaryAmount
      return { salaryAmount: form?.getFieldValue("salaryAmount") };
    }
  };
  type AdvancedRow = {
    shiftId: string | number;
    shiftName: string;
    amount: number | undefined;
    saturday: string;
    sunday: string;
    holiday: string;
    specialDay: string;
    [key: string]: any;
  };
  const [advancedRows, setAdvancedRows] = React.useState<AdvancedRow[]>([
    {
      shiftId: 0,
      shiftName: "Mặc định",
      amount: 0,
      saturday: "100%",
      sunday: "100%",
      holiday: "100%",
      specialDay: "100%",
    },
  ]);

  // Sync advancedRows and showAdvanced from form initial values (for edit mode)
  // Đồng bộ showAdvanced và advancedRows mỗi khi giá trị form thay đổi
  const handleFormValuesChange = (changedValues: any, allValues: any) => {
    if (typeof allValues.showAdvanced !== "undefined") {
      setShowAdvanced(!!allValues.showAdvanced);
      if (allValues.showAdvanced && Array.isArray(allValues.advancedRows)) {
        setAdvancedRows(allValues.advancedRows);
      }
    }
  };

  const handleAddAdvancedRow = () => {
    setAdvancedRows([
      ...advancedRows,
      {
        shiftId: "",
        shiftName: "",
        amount: undefined,
        saturday: "100%",
        sunday: "100%",
        holiday: "100%",
        specialDay: "100%",
      },
    ]);
  };
  const handleAdvancedChange = (idx: number, field: string, value: any) => {
    const newRows = [...advancedRows];
    if (field === "shiftId") {
      newRows[idx].shiftId = value;
      // Tìm shiftName từ shiftOptions
      const found = shiftOptions.find((opt) => opt.value === value);
      newRows[idx].shiftName = found ? found.label : "";
    } else {
      newRows[idx][field] = value;
    }
    setAdvancedRows(newRows);
  };
  const handleRemoveAdvancedRow = (idx: number) => {
    setAdvancedRows(advancedRows.filter((_, i) => i !== idx));
  };
  const [salaryType, setSalaryType] = React.useState<string | undefined>(undefined);
  // Truyền dữ liệu nâng cao lên parent mỗi khi thay đổi
  React.useEffect(() => {
    if (typeof onSalaryDataChange === "function") {
      if (showAdvanced) {
        onSalaryDataChange({ showAdvanced, advancedRows });
      } else {
        onSalaryDataChange({ showAdvanced, salaryAmount: form?.getFieldValue("salaryAmount") });
      }
    }
  }, [showAdvanced, advancedRows, form, onSalaryDataChange]);

  React.useEffect(() => {
    // Sync salaryType state with form value
    setSalaryType(form?.getFieldValue("salaryType"));
  }, [form]);
  let salaryUnit = "";
  if (salaryType === "fixed") salaryUnit = "/ tháng";
  else if (salaryType === "hourly") salaryUnit = "/ giờ";
  else if (salaryType === "shift") salaryUnit = "/ ca";

  return (
    <Form layout="vertical" style={{ background: "#fff", padding: 0 }} form={form} onValuesChange={handleFormValuesChange}>
      {/* <Card style={{ marginBottom: 16, padding: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>
          Mẫu lương{" "}
          <Tooltip title="Chọn mẫu lương có sẵn">
            <InfoCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </div>
        <Form.Item name="salaryTemplate">
          <Select options={salaryTemplates} placeholder="Chọn mẫu lương có sẵn" allowClear />
        </Form.Item>
      </Card> */}
      <Card style={{ marginBottom: 16, padding: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Lương chính</div>
        <Form.Item label="Loại lương" name="salaryType">
          <Select options={salaryTypes} placeholder="Chọn Loại lương" allowClear onChange={(val) => setSalaryType(val)} />
        </Form.Item>
        {salaryType && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
              <span style={{ minWidth: 100 }}>Mức lương</span>
              {!showAdvanced && (
                <Form.Item name="salaryAmount" style={{ marginBottom: 0, flex: 1 }} rules={[{ required: true, message: "Vui lòng nhập mức lương" }]}>
                  <Input style={{ width: 240 }} addonAfter={salaryUnit} />
                </Form.Item>
              )}
              <div style={{ flex: 1 }} />
              {salaryType !== "fixed" && (
                <span style={{ marginLeft: "auto" }}>
                  Thiết lập nâng cao <Switch style={{ marginLeft: 8 }} checked={showAdvanced} onChange={setShowAdvanced} />
                </span>
              )}
            </div>
            {showAdvanced && salaryType && salaryType !== "fixed" && (
              <div style={{ marginTop: 16 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", background: "#fafafa", marginBottom: 8 }}>
                  <thead>
                    <tr style={{ background: "#e5e5e5" }}>
                      <th style={{ padding: 8, border: "1px solid #eee" }}>Ca</th>
                      <th style={{ padding: 8, border: "1px solid #eee" }}>Lương/ca</th>
                      <th style={{ padding: 8, border: "1px solid #eee" }}>Thứ 7</th>
                      <th style={{ padding: 8, border: "1px solid #eee" }}>Chủ nhật</th>
                      <th style={{ padding: 8, border: "1px solid #eee" }}>Ngày nghỉ</th>
                      <th style={{ padding: 8, border: "1px solid #eee" }}>Ngày lễ tết</th>
                      <th style={{ padding: 8, border: "1px solid #eee" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {advancedRows.map((row, idx) => (
                      <tr key={idx}>
                        <td style={{ padding: 8, border: "1px solid #eee" }}>
                          {idx === 0 ? (
                            <span style={{ fontWeight: 500 }}>Mặc định</span>
                          ) : (
                            <Select
                              placeholder="Chọn ca"
                              style={{ width: 120 }}
                              value={row.shiftId}
                              onChange={(val) => handleAdvancedChange(idx, "shiftId", val)}
                              options={shiftOptions}
                            />
                          )}
                        </td>
                        <td style={{ padding: 8, border: "1px solid #eee" }}>
                          <Input
                            placeholder="Lương/ca"
                            value={row.amount}
                            type="number"
                            addonAfter={salaryUnit}
                            onChange={(e) => handleAdvancedChange(idx, "amount", e.target.value)}
                          />
                        </td>
                        <td style={{ padding: 8, border: "1px solid #eee" }}>
                          <Input value={row.saturday} style={{ width: 80 }} onChange={(e) => handleAdvancedChange(idx, "saturday", e.target.value)} />
                        </td>
                        <td style={{ padding: 8, border: "1px solid #eee" }}>
                          <Input value={row.sunday} style={{ width: 80 }} onChange={(e) => handleAdvancedChange(idx, "sunday", e.target.value)} />
                        </td>
                        <td style={{ padding: 8, border: "1px solid #eee" }}>
                          <Input value={row.holiday} style={{ width: 80 }} onChange={(e) => handleAdvancedChange(idx, "holiday", e.target.value)} />
                        </td>
                        <td style={{ padding: 8, border: "1px solid #eee" }}>
                          <Input
                            value={row.specialDay}
                            style={{ width: 80 }}
                            onChange={(e) => handleAdvancedChange(idx, "specialDay", e.target.value)}
                          />
                        </td>
                        <td style={{ padding: 8, border: "1px solid #eee", textAlign: "center" }}>
                          {advancedRows.length > 1 && idx !== 0 && (
                            <Button danger size="small" onClick={() => handleRemoveAdvancedRow(idx)}>
                              Xóa
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Button type="dashed" onClick={handleAddAdvancedRow}>
                  Thêm điều kiện
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
      <Card style={{ marginBottom: 16, padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Giảm trừ</div>
            <div style={{ color: "#888", marginBottom: 8 }}>Thiết lập giảm trừ cho đi muộn và về sớm</div>
          </div>
          <Switch checked={showDeductionConfig} onChange={setShowDeductionConfig} />
        </div>
        {showDeductionConfig && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>Đi muộn</div>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <Form.Item label="Hình thức" name="deductionLateMethod" initialValue="count" style={{ marginBottom: 0 }}>
                <Select
                  options={[
                    { value: "count", label: "Theo số lần" },
                    { value: "minute", label: "Theo số phút" },
                  ]}
                  style={{ width: 140 }}
                />
              </Form.Item>
              <Form.Item
                label="Số tiền phạt (VNĐ)"
                name="deductionLateValue"
                rules={[{ required: true, message: "Nhập giá trị" }]}
                style={{ marginBottom: 0 }}
              >
                <Input type="number" style={{ width: 120 }} min={0} />
              </Form.Item>
              /
              <Form.Item label="Đơn vị" name="deductionLateParam" rules={[{ required: true, message: "Nhập tham số" }]} style={{ marginBottom: 0 }}>
                <Input type="number" style={{ width: 120 }} min={1} />
              </Form.Item>
            </div>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>Về sớm</div>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <Form.Item label="Hình thức" name="deductionEarlyMethod" initialValue="count" style={{ marginBottom: 0 }}>
                <Select
                  options={[
                    { value: "count", label: "Theo số lần" },
                    { value: "minute", label: "Theo số phút" },
                  ]}
                  style={{ width: 140 }}
                />
              </Form.Item>
              <Form.Item
                label="Số tiền phạt (VNĐ)"
                name="deductionEarlyValue"
                rules={[{ required: true, message: "Nhập giá trị" }]}
                style={{ marginBottom: 0 }}
              >
                <Input type="number" style={{ width: 120 }} min={0} />
              </Form.Item>
              /
              <Form.Item label="Đơn vị" name="deductionEarlyParam" rules={[{ required: true, message: "Nhập tham số" }]} style={{ marginBottom: 0 }}>
                <Input type="number" style={{ width: 120 }} min={1} />
              </Form.Item>
            </div>
          </div>
        )}
      </Card>
    </Form>
  );
}
