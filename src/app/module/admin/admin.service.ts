import httpStatus from "http-status";

import { AppError } from "../../utils/AppError";
import { prisma } from "../../lib/prisma";
import { IUserFilterRequest } from "./admin.interface";
import {
  Prisma,
  UserStatus,
  VehicleType,
} from "../../../generated/prisma/client";

const assignCourierToShipment = async (
  shipmentId: string,
  courierProfileId: string,
) => {
  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId, deletedAt: null },
  });

  if (!shipment) {
    throw new AppError(httpStatus.NOT_FOUND, "Shipment not found!");
  }

  const courier = await prisma.courierProfile.findUnique({
    where: { id: courierProfileId },
  });

  if (!courier) {
    throw new AppError(httpStatus.NOT_FOUND, "Courier profile not found!");
  }

  return await prisma.$transaction(async (tx) => {
    const updatedShipment = await tx.shipment.update({
      where: { id: shipmentId },
      data: {
        courierId: courierProfileId,
      },
    });

    await tx.shipmentTrackingEvent.create({
      data: {
        shipmentId,
        status: shipment.status,
        description: `Assigned to courier (Phone: ${courier.phone})`,
      },
    });

    return updatedShipment;
  });
};

const getAllUsers = async (query: Record<string, any>) => {
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;

  // 1. andConditions Array initialize
  const andConditions: Prisma.UserWhereInput[] = [
    {
      isDeleted: false, // Soft deleted ইউজারগুলো বাদ দেওয়ার জন্য
    },
  ];

  // 2. Search Filter (name, email, phone)
  if (query.searchTerm) {
    andConditions.push({
      OR: [
        {
          name: {
            contains: query.searchTerm,
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: query.searchTerm,
            mode: "insensitive",
          },
        },
      ],
    });
  }

  // 3. Status Filter (ACTIVE, BLOCKED, SUSPENDED)
  if (query.status) {
    andConditions.push({
      status: query.status as UserStatus,
    });
  }

  // 4. Role Filter (CUSTOMER, COURIER, ADMIN)
  if (query.role) {
    andConditions.push({
      role: query.role,
    });
  }

  // 5. Database Where Condition Construct
  const whereConditions: Prisma.UserWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  // 6. Dynamic Sorting Setup
  const sortBy = query.sortBy || "createdAt";
  const sortOrder = query.sortOrder || "desc";

  // 7. DB Query
  const users = await prisma.user.findMany({
    where: whereConditions,
    take: limit,
    skip: skip,
    orderBy: {
      [sortBy]: sortOrder,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      imageUrl: true,
      createdAt: true,
    },
  });

  const total = await prisma.user.count({
    where: whereConditions,
  });

  return {
    data: users,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getAllCouriers = async (query: Record<string, any>) => {
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;

  console.log(query, "courier query");

  // 1. andConditions Array initialize
  const andConditions: Prisma.CourierProfileWhereInput[] = [
    {
      isDeleted: false,
    },
  ];

  // 2. Search Filter (vehicleType, licenseNumber, and nested User fields)
  if (query.searchTerm) {
    andConditions.push({
      OR: [
        {
          licenseNumber: {
            contains: query.searchTerm,
            mode: "insensitive",
          },
        },
        {
          user: {
            name: {
              contains: query.searchTerm,
              mode: "insensitive",
            },
          },
        },
        {
          user: {
            email: {
              contains: query.searchTerm,
              mode: "insensitive",
            },
          },
        },
      ],
    });
  }

  // 3. Approval Status Filter
  if (query.isApproved !== undefined) {
    andConditions.push({
      isApproved: query.isApproved === "true",
    });
  }

  // 4. Availability Filter
  if (query.isAvailable !== undefined) {
    andConditions.push({
      isAvailable: query.isAvailable === "true",
    });
  }

  // 5. Vehicle Type Filter (BIKE, CYCLE, VAN, TRUCK)
  if (query.vehicleType) {
    andConditions.push({
      vehicleType: query.vehicleType as VehicleType,
    });
  }

  // 6. Database Where Condition Construct
  const whereConditions: Prisma.CourierProfileWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  // 7. Dynamic Sorting Setup
  const sortBy = query.sortBy || "createdAt";
  const sortOrder = query.sortOrder || "desc";

  // 8. DB Query
  const couriers = await prisma.courierProfile.findMany({
    where: whereConditions,
    take: limit,
    skip: skip,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          imageUrl: true,
        },
      },
    },
  });

  const total = await prisma.courierProfile.count({
    where: whereConditions,
  });

  return {
    data: couriers,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getAvailableCouriers = async (query: Record<string, any>) => {
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;

  const whereConditions: Prisma.CourierProfileWhereInput = {
    // isApproved: true,
    isAvailable: true,
    isDeleted: false,
  };

  const couriers = await prisma.courierProfile.findMany({
    where: whereConditions,
    take: limit,
    skip: skip,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          imageUrl: true,
        },
      },
    },
  });

  const total = await prisma.courierProfile.count({
    where: whereConditions,
  });

  return {
    data: couriers,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const AdminService = {
  assignCourierToShipment,
  getAllUsers,
  getAllCouriers,
  getAvailableCouriers,
};
