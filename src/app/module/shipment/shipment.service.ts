import httpStatus from "http-status";

import { prisma } from "../../lib/prisma";

import {
  ICreateShipmentPayload,
  IShipmentQueryFilters,
} from "./shipment.interface";
import { Prisma, Shipment } from "../../../generated/prisma/client";
import {
  calculateDeliveryFee,
  generateTrackingNumber,
} from "../../utils/shipment";
import { AppError } from "../../utils/AppError";

const createShipment = async (
  customerId: string,
  payload: ICreateShipmentPayload,
): Promise<Shipment> => {
  // 1. Fallback Logic: pickupAddressId না পাঠালে deliveryAddressId-কেই পিকআপ হিসেবে ধরে নেবে
  const pickupAddressId = payload.pickupAddressId || payload.deliveryAddressId;
  const deliveryAddressId = payload.deliveryAddressId;

  // 2. Pickup Address Validation
  const pickupAddress = await prisma.address.findFirst({
    where: {
      id: pickupAddressId,
      isDeleted: false,
    },
  });

  if (!pickupAddress) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Pickup address not found or invalid!",
    );
  }

  // 3. Delivery Address Validation (পিকআপ ও ডেলিভারি সেম আইডি হলে আবার নতুন কুয়েরি এড়িয়ে যাবে)
  let deliveryAddress = pickupAddress;
  if (pickupAddressId !== deliveryAddressId) {
    const foundDeliveryAddress = await prisma.address.findFirst({
      where: {
        id: deliveryAddressId,
        isDeleted: false,
      },
    });

    if (!foundDeliveryAddress) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "Delivery address not found or invalid!",
      );
    }
    deliveryAddress = foundDeliveryAddress;
  }

  // 4. Calculate Delivery Fee & Generate Tracking Number
  const deliveryFee = calculateDeliveryFee(
    payload.weight,
    payload.deliveryType,
  );
  const trackingNumber = generateTrackingNumber();

  // 5. Create Shipment inside Database Transaction
  return await prisma.$transaction(async (tx) => {
    const shipment = await tx.shipment.create({
      data: {
        trackingNumber,
        customerId,
        pickupAddressId,
        deliveryAddressId,
        deliveryType: payload.deliveryType,
        weight: payload.weight,
        deliveryFee,
        codAmount: payload.codAmount || 0,
        parcelDescription: payload.parcelDescription,
        status: "CREATED",
      },
      include: {
        pickupAddress: true,
        deliveryAddress: true,
      },
    });

    // Create Initial Tracking Event Entry
    await tx.shipmentTrackingEvent.create({
      data: {
        shipmentId: shipment.id,
        status: "CREATED",
        description: "Shipment booking created successfully.",
        location: pickupAddress.city,
      },
    });

    return shipment;
  });
};

const getMyShipments = async (
  customerId: string,
  query: IShipmentQueryFilters,
) => {
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;

  // andConditions Array initialize
  const andConditions: Prisma.ShipmentWhereInput[] = [
    {
      customerId,
    },
    {
      deletedAt: null,
    },
  ];

  // Search Filter (trackingNumber or parcelDescription)
  if (query.searchTerm) {
    andConditions.push({
      OR: [
        {
          trackingNumber: {
            contains: query.searchTerm,
            mode: "insensitive",
          },
        },
        {
          parcelDescription: {
            contains: query.searchTerm,
            mode: "insensitive",
          },
        },
      ],
    });
  }

  // Status Filter
  if (query.status) {
    andConditions.push({
      status: query.status as Prisma.EnumShipmentStatusFilter,
    });
  }

  // DeliveryType Filter
  if (query.deliveryType) {
    andConditions.push({
      deliveryType: query.deliveryType as Prisma.EnumDeliveryTypeFilter,
    });
  }

  // Database Queries
  const whereConditions: Prisma.ShipmentWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const shipments = await prisma.shipment.findMany({
    where: whereConditions,
    take: limit,
    skip: skip,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      pickupAddress: true,
      deliveryAddress: true,
    },
  });

  const total = await prisma.shipment.count({
    where: whereConditions,
  });

  return {
    data: shipments,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const ShipmentService = {
  createShipment,
  getMyShipments,
};
