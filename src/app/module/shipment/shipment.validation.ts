import { z } from "zod";

const createShipmentValidationSchema = z.object({
  pickupAddressId: z
    .string()
    .uuid("Invalid pickup address ID format")
    .optional(),

  deliveryAddressId: z
    .string("Delivery address ID is required")
    .uuid("Invalid delivery address ID format"),

  deliveryType: z.enum(["STANDARD", "EXPRESS"]).default("STANDARD"),

  weight: z
    .number("Parcel weight is required")
    .positive("Weight must be greater than 0"),

  codAmount: z.number().nonnegative("COD amount cannot be negative").default(0),

  parcelDescription: z.string().optional(),
});

export const ShipmentValidation = {
  createShipmentValidationSchema,
};
