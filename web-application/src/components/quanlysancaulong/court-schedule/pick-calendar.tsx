import dayjs from "dayjs";
import React, { useState } from "react";

import "dayjs/locale/zh-cn";

import { Calendar, ConfigProvider, Flex, Radio, Select, theme, Button } from "antd";
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
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs());

  const wrapperStyle: React.CSSProperties = {
    width: 300,
    border: `1px solid #e0e0e0`,
    borderRadius: token.borderRadiusLG,
  };

  const handlePickToday = () => {
    onPickDate(dayjs().format("YYYY-MM-DD"));
    setSelectedDate(dayjs());
  };

  return (
    <ConfigProvider locale={viVN}>
      <div style={wrapperStyle}>
        <Calendar
          fullscreen={false}
          value={selectedDate}
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
                      setSelectedDate(now);
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
                      setSelectedDate(now);
                    }}
                  />
                </Flex>
              </div>
            );
          }}
          onSelect={(value) => {
            setSelectedDate(value);
            onPickDate(value.format("YYYY-MM-DD"));
          }}
        />
      </div>

      <div className="mt-2 flex flex-row justify-center gap-2">
        <Button variant="outlined" onClick={handlePickToday}>
          Ngày hôm nay, {new Date().toLocaleDateString("vi-VN")}
        </Button>
      </div>
    </ConfigProvider>
  );
};

export default PickCalendar;
