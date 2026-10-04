import { z } from "zod";

const assignCourierValidationSchema = z.object({
  courierProfileId: z.string().min(1, "Courier Profile ID is required"),
});

const updateUserStatusValidationSchema = z.object({
  status: z.enum(["ACTIVE", "BLOCKED", "SUSPENDED"]),
});

const updateShipmentStatusValidationSchema = z.object({
  status: z.enum([
    "CREATED",
    "PAYMENT_PENDING",
    "PAID",
    "PICKUP_REQUESTED",
    "COURIER_ASSIGNED",
    "PICKED_UP",
    "AT_ORIGIN_HUB",
    "IN_TRANSIT",
    "AT_DESTINATION_HUB",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "DELIVERY_FAILED",
    "CANCELLED",
    "RETURNED",
  ]),
  location: z.string().optional(),
  description: z.string().optional(),
});

export const AdminValidation = {
  assignCourierValidationSchema,
  updateUserStatusValidationSchema,
  updateShipmentStatusValidationSchema,
};
