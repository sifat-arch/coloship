import { z } from "zod";

const toggleAvailabilityValidationSchema = z.object({
  isAvailable: z.boolean().optional(),
});

const updateAssignmentStatusValidationSchema = z.object({
  status: z.enum(
    ["PICKED_UP", "IN_TRANSIT", "DELIVERED", "CANCELLED"],
    "Status is required",
  ),

  note: z.string().optional(),

  location: z.string().optional(),
});
export const CourierValidation = {
  toggleAvailabilityValidationSchema,
  updateAssignmentStatusValidationSchema,
};
