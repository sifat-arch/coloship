import { z } from "zod";

const assignCourierValidationSchema = z.object({
  courierProfileId: z.string("Courier Profile ID is required"),
});

export const AdminValidation = {
  assignCourierValidationSchema,
};
