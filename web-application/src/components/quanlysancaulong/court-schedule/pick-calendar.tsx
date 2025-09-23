import dayjs from "dayjs";
import React from "react";

import "dayjs/locale/zh-cn";

import { Calendar, ConfigProvider, Flex, Radio, Select, theme } from "antd";
import viVN from "antd/locale/vi_VN";
import "dayjs/locale/vi";
import dayLocaleData from "dayjs/plugin/localeData";

dayjs.extend(dayLocaleData);
dayjs.locale("vi");

interface PickCalendarProps {
  onPickDate: (value: string) => void;
}

const PickCalendar = ({ onPickDate }: PickCalendarProps) => {
  const { token } = theme.useToken();

  const wrapperStyle: React.CSSProperties = {
    width: 300,
    border: `1px solid #e0e0e0`,
    borderRadius: token.borderRadiusLG,
  };

  return (
    <ConfigProvider locale={viVN}>
      <div style={wrapperStyle}>
        <Calendar
          fullscreen={false}
          headerRender={({ value, type, onChange, onTypeChange }) => {
            const year = value.year();
            const month = value.month();

            const yearOptions = Array.from({ length: 20 }, (_, i) => {
              const label = year - 10 + i;
              return { label, value: label };
            });

            const monthOptions = value
              .localeData()
              .monthsShort()
              .map((label, index) => ({
                label,
                value: index,
              }));

            return (
              <div style={{ padding: 8 }}>
                <Flex gap={8}>
                  <Radio.Group size="small" onChange={(e) => onTypeChange(e.target.value)} value={type}>
                    <Radio.Button value="month">Tháng</Radio.Button>
                    <Radio.Button value="year">Năm</Radio.Button>
                  </Radio.Group>
                  <Select
                    size="small"
                    popupMatchSelectWidth={false}
                    value={year}
                    options={yearOptions}
                    onChange={(newYear) => {
                      const now = value.clone().year(newYear);
                      onChange(now);
                    }}
                  />
                  <Select
                    size="small"
                    popupMatchSelectWidth={false}
                    value={month}
                    options={monthOptions}
                    onChange={(newMonth) => {
                      const now = value.clone().month(newMonth);
                      onChange(now);
                    }}
                  />
                </Flex>
              </div>
            );
          }}
          onSelect={(value) => {
            onPickDate(value.format("YYYY-MM-DD"));
          }}
        />
      </div>
    </ConfigProvider>
  );
};

export default PickCalendar;
