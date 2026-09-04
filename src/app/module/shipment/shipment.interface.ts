export interface ICreateShipmentPayload {
  pickupAddressId?: string;
  deliveryAddressId: string;
  deliveryType: "STANDARD" | "EXPRESS";
  weight: number;
  codAmount?: number;
  parcelDescription?: string;
}

export interface IShipmentQueryFilters {
  page?: string;
  limit?: string;
  searchTerm?: string;
  status?: string;
  deliveryType?: string;
}
