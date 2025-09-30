import WorkScheduleTable from "@/components/quanlysancaulong/work-schedule/work-schedule-table";
import { Breadcrumb } from "antd";

export default function WorkSchedulePage() {
  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Breadcrumb items={[{ title: "Quản lý sân cầu lông" }, { title: "Lịch làm việc" }]} />
      </div>
      <WorkScheduleTable />
    </>
  );
}
