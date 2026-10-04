import type { Role, VehicleType } from "../../../generated/prisma/enums";

export interface ILoginUserPayload {
  email: string;
  password: string;
}
export interface IRegisterCustomerPayload {
  name: string;
  email: string;
  password: string;
}
export interface IRequestUser {
  userId: string;
  email: string;
  name: string;
  role: Role;
}

export interface IGoogleLoginIdTokenPayload {
  idToken: string;
}

export interface IApplyCourierPayload {
  phone: string;
  vehicleType: VehicleType;
  nidNumber?: string;
  vehicleNumber?: string;
  licenseNumber?: string;
}
export interface IForgotPasswordPayload {
  email: string;
}

export interface IResetPasswordPayload {
  email: string;
  newPassword: string;
  otp: string;
}

export interface IVerifyCustomerEmailPayload {
  email: string;
  otp: string;
}
