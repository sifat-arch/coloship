import { z } from "zod";

const assignCourierValidationSchema = z.object({
  courierProfileId: z.string("Courier Profile ID is required"),
});

const updateUserStatusValidationSchema = z.object({
  status: z.enum(["ACTIVE", "BLOCKED", "SUSPENDED"]),
});

export const AdminValidation = {
  assignCourierValidationSchema,
  updateUserStatusValidationSchema,
};
