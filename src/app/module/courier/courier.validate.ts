import { z } from "zod";

const toggleAvailabilityValidationSchema = z.object({
  isAvailable: z.boolean().optional(),
});

const updateProfileValidationSchema = z.object({
  phone: z.string().min(1, "Phone number cannot be empty").optional(),
  vehicleType: z
    .enum(["BIKE", "BICYCLE", "MOTORCYCLE", "VAN", "TRUCK"])
    .optional(),
  vehicleNumber: z.string().optional(),
  licenseNumber: z.string().optional(),
});

const respondAssignmentValidationSchema = z.object({
  action: z.enum(["ACCEPT", "REJECT"]),
  reason: z.string().optional(),
});

const updateAssignmentStatusValidationSchema = z.object({
  status: z.enum([
    "PICKED_UP",
    "IN_TRANSIT",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "DELIVERY_FAILED",
    "CANCELLED",
    "RETURNED",
  ]),
  note: z.string().optional(),
  location: z.string().optional(),
});

export const CourierValidation = {
  toggleAvailabilityValidationSchema,
  updateProfileValidationSchema,
  respondAssignmentValidationSchema,
  updateAssignmentStatusValidationSchema,
};
