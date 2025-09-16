"use client";

const DashboardPage = () => {
  return (
    <div>
      {Array.from({ length: 100 }).map((_, index) => (
        <div key={index}>{index}</div>
      ))}
    </div>
  );
};

export default DashboardPage;
