export type IUserFilterRequest = {
  searchTerm?: string;
  isApproved?: string;
  isAvailable?: string;
  vehicleType?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: string | number;
  limit?: string | number;
};
