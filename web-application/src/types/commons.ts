export const ApplicationUserStatus = {
  Active: "Active",
  Inactive: "Inactive",
  Deleted: "Deleted",
};

export interface Province {
  name: string;
  code: number;
  division_type: string;
  codename: string;
  phone_code: number;
  districts: District[];
}

export interface District {
  name: string;
  code: number;
  division_type: string;
  codename: string;
  province_code: number;
  wards: Ward[];
}

export interface Ward {
  name: string;
  code: number;
  division_type: string;
  codename: string;
  district_code: number;
}

export interface ListDistrictsByProvinceCodeResponse {
  name: string;
  code: number;
  division_type: string;
  codename: string;
  phone_code: number;
  districts: District[];
}

export interface ListWardsByDistrictCodeResponse {
  name: string;
  code: number;
  division_type: string;
  codename: string;
  province_code: number;
  wards: Ward[];
}
