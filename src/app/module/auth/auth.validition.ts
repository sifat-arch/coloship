import { z } from "zod";
import { VehicleType } from "../../../generated/prisma/enums";

const registerCustomerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters"),

  email: z
    .string()
    .email("Invalid email address")
    .transform((value) => value.trim().toLowerCase()),

  password: z.string().min(8, "Password must be at least 8 characters"),
});

const loginCustomerSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .transform((value) => value.trim().toLowerCase()),

  password: z.string().min(8, "Password must be at least 8 characters"),
});

const registerCourierValidationSchema = z.object({
  name: z
    .string({ message: "Name is required" })
    .min(1, "Name cannot be empty"),
  email: z
    .string({ message: "Email is required" })
    .email("Invalid email format"),
  password: z
    .string({ message: "Password is required" })
    .min(6, "Password must be at least 6 characters"),
  phone: z.string({ message: "Phone number is required" }),
  vehicleType: z.nativeEnum(VehicleType, {
    message: "Vehicle type is required",
  }),
  nidNumber: z.string().optional(),
  vehicleNumber: z.string().optional(),
  licenseNumber: z.string().optional(),
  profileImageUrl: z.string().optional(),
});

const forgotPasswordSchema = z.object({
  email: z
    .string({ message: "Email is required" })
    .email("Invalid email format")
    .transform((value) => value.trim().toLowerCase()),
});

const resetPasswordValidationSchema = z.object({
  email: z
    .string({ message: "Email is required" })
    .email("Invalid email format")
    .transform((val) => val.trim().toLowerCase()),
  otp: z
    .string({ message: "OTP is required" })
    .length(6, "OTP must be exactly 6 digits"),
  newPassword: z
    .string({ message: "New password is required" })
    .min(6, "Password must be at least 6 characters"),
});

export const UserValidation = {
  registerCustomerSchema,
  loginCustomerSchema,
  registerCourierValidationSchema,
  forgotPasswordSchema,
  resetPasswordValidationSchema,
};
