import { z } from "zod";

const createAddressValidationSchema = z.object({
  label: z
    .string({ message: "Label is required" })
    .min(1, "Label cannot be empty")
    .transform((val) => val.trim()), // e.g., "Home", "Office", "Warehouse"
  recipientName: z
    .string({ message: "Recipient name is required" })
    .min(2, "Recipient name must be at least 2 characters")
    .transform((val) => val.trim()),
  phone: z
    .string({ message: "Phone number is required" })
    .min(11, "Phone number must be valid"),
  addressLine: z
    .string({ message: "Address line is required" })
    .min(5, "Address line is too short")
    .transform((val) => val.trim()),
  area: z
    .string({ message: "Area is required" })
    .transform((val) => val.trim()),
  city: z
    .string({ message: "City is required" })
    .transform((val) => val.trim()),
  postalCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  isDefault: z.boolean().default(false),
});

export const AddressValidation = {
  createAddressValidationSchema,
};
