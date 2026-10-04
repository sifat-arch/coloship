import { Address } from "../../../generated/prisma/client";
import { UserStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import httpStatus from "http-status";
import { ICreateAddressPayload } from "./address.interface";

const createAddress = async (
  userId: string,
  payload: ICreateAddressPayload,
): Promise<Address> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found!");
  }

  if (user.status === UserStatus.SUSPENDED) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your account is suspended. You cannot add new addresses.",
    );
  }

  if (user.status === UserStatus.BLOCKED) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your account is blocked. You cannot add new addresses.",
    );
  }

  return await prisma.$transaction(async (tx) => {
    // 1. If this new address is set as default, reset other default addresses for this user
    if (payload.isDefault) {
      await tx.address.updateMany({
        where: {
          userId,
          isDefault: true,
          isDeleted: false,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // 2. If user has no existing addresses, make this first address default automatically
    const existingAddressCount = await tx.address.count({
      where: { userId, isDeleted: false },
    });

    const shouldBeDefault =
      existingAddressCount === 0 ? true : payload.isDefault;

    // 3. Create Address
    const newAddress = await tx.address.create({
      data: {
        userId,
        label: payload.label,
        recipientName: payload.recipientName,
        phone: payload.phone,
        addressLine: payload.addressLine,
        area: payload.area,
        city: payload.city,
        postalCode: payload.postalCode,
        latitude: payload.latitude,
        longitude: payload.longitude,
        isDefault: shouldBeDefault,
      },
    });

    return newAddress;
  });
};

// address.service.ts
const getAllAddresses = async (userId: string): Promise<Address[]> => {
  return await prisma.address.findMany({
    where: {
      userId,
      isDeleted: false,
    },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
};

// address.service.ts
const getDefaultAddress = async (userId: string): Promise<Address | null> => {
  return await prisma.address.findFirst({
    where: {
      userId,
      isDefault: true,
      isDeleted: false,
    },
  });
};

export const AddressService = {
  createAddress,
  getAllAddresses,
};
