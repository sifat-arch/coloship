import { ShipmentStatus } from "../../generated/prisma/enums";

export const ALLOWED_STATUS_TRANSITIONS: Record<string, ShipmentStatus[]> = {
  COURIER_ASSIGNED: [ShipmentStatus.PICKED_UP, ShipmentStatus.CANCELLED],
  PICKUP_REQUESTED: [ShipmentStatus.PICKED_UP, ShipmentStatus.CANCELLED],
  PICKED_UP: [
    ShipmentStatus.IN_TRANSIT,
    ShipmentStatus.OUT_FOR_DELIVERY,
    ShipmentStatus.CANCELLED,
  ],
  IN_TRANSIT: [ShipmentStatus.OUT_FOR_DELIVERY, ShipmentStatus.CANCELLED],
  OUT_FOR_DELIVERY: [ShipmentStatus.DELIVERED, ShipmentStatus.DELIVERY_FAILED],
  DELIVERED: [],
  DELIVERY_FAILED: [],
  CANCELLED: [],
  RETURNED: [],
  CREATED: [],
  PAYMENT_PENDING: [],
  PAID: [],
  AT_ORIGIN_HUB: [ShipmentStatus.IN_TRANSIT],
  AT_DESTINATION_HUB: [ShipmentStatus.OUT_FOR_DELIVERY],
};
