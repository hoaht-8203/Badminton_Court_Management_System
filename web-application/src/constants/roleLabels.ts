export const ROLE_LABELS: Record<string, string> = {
  Admin: "Quản trị viên",
  BranchAdministrator: "Chủ sân",
  Staff: "Nhân viên",
  WarehouseStaff: "Kiểm kho",
  Receptionist: "Lễ tân",
  Customer: "Khách hàng",
  User: "Người dùng",
};

export const getRoleLabel = (roleName: string | null | undefined): string => {
  if (!roleName) return "-";
  return ROLE_LABELS[roleName] || roleName;
};
