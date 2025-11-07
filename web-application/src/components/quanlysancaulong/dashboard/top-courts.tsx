"use client";

import React from "react";
import { Card, List } from "antd";

interface Props {
  items?: Array<{ court: string; count: number }>;
}

const TopCourts: React.FC<Props> = ({ items = [] }) => {
  return (
    <Card title="Top sân" style={{ minHeight: 220 }}>
      <List
        dataSource={items}
        renderItem={(item) => (
          <List.Item>
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
              <div>{item.court}</div>
              <div style={{ fontWeight: 700 }}>{item.count}</div>
            </div>
          </List.Item>
        )}
      />
    </Card>
  );
};

export default React.memo(TopCourts);
