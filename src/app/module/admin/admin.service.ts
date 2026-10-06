import httpStatus from "http-status";

import { AppError } from "../../utils/AppError";
import { prisma } from "../../lib/prisma";
import { IUserFilterRequest } from "./admin.interface";
import {
  Prisma,
  Role,
  UserStatus,
  VehicleType,
  VerificationStatus,
} from "../../../generated/prisma/client";
import {
  NotificationType,
  ShipmentStatus,
} from "../../../generated/prisma/enums";
import { NotificationService } from "../notification/notification.service";

const assignCourierToShipment = async (
  shipmentId: string,
  courierProfileId: string,
) => {
  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId, deletedAt: null },
    include: { customer: true },
  });

  if (!shipment) {
    throw new AppError(httpStatus.NOT_FOUND, "Shipment not found!");
  }

  const courier = await prisma.courierProfile.findUnique({
    where: { id: courierProfileId },
    include: { user: true },
  });

  if (!courier) {
    throw new AppError(httpStatus.NOT_FOUND, "Courier profile not found!");
  }

  if (courier.isDeleted) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Cannot assign shipment to a deleted courier profile!",
    );
  }

  if (!courier.isApproved || courier.VerificationStatus !== "APPROVED") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Courier is not approved. Only approved couriers can be assigned tasks!",
    );
  }

  if (courier.user.status !== UserStatus.ACTIVE) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Cannot assign shipment to a courier whose account is ${courier.user.status.toLowerCase()}!`,
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedShipment = await tx.shipment.update({
      where: { id: shipmentId },
      data: {
        courierId: courierProfileId,
        status: ShipmentStatus.COURIER_ASSIGNED,
      },
      include: {
        courier: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        pickupAddress: true,
        deliveryAddress: true,
      },
    });

    await tx.shipmentTrackingEvent.create({
      data: {
        shipmentId,
        status: ShipmentStatus.COURIER_ASSIGNED,
        description: `Shipment assigned to courier ${courier.user?.name || ""} (Phone: ${courier.phone})`,
        location: "Central Distribution Hub",
      },
    });

    return updatedShipment;
  });

  // Create notifications asynchronously
  await Promise.all([
    NotificationService.createNotification({
      userId: courier.userId,
      courierId: courier.id,
      title: "New Task Assigned",
      message: `New pickup task assigned near your area (${result.pickupAddress?.area || "Central Hub"}).`,
      type: NotificationType.DELIVERY,
    }),
    NotificationService.createNotification({
      userId: shipment.customerId,
      courierId: courier.id,
      title: "Courier Assigned",
      message: `A delivery hero has been assigned for your parcel #${shipment.trackingNumber}.`,
      type: NotificationType.SHIPMENT,
    }),
  ]);

  return result;
};

const unassignCourierFromShipment = async (shipmentId: string) => {
  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId, deletedAt: null },
    include: { courier: { include: { user: true } } },
  });

  if (!shipment) {
    throw new AppError(httpStatus.NOT_FOUND, "Shipment not found!");
  }

  if (!shipment.courierId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "No courier is currently assigned to this shipment!",
    );
  }

  if (
    shipment.status === ShipmentStatus.DELIVERED ||
    shipment.status === ShipmentStatus.CANCELLED
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Cannot assign a completed or cancelled shipment!",
    );
  }

  const previousCourier = shipment.courier;

  const result = await prisma.$transaction(async (tx) => {
    const updatedShipment = await tx.shipment.update({
      where: { id: shipmentId },
      data: {
        courierId: null,
        status: ShipmentStatus.PICKUP_REQUESTED,
      },
      include: {
        customer: true,
        pickupAddress: true,
        deliveryAddress: true,
      },
    });

    await tx.shipmentTrackingEvent.create({
      data: {
        shipmentId,
        status: ShipmentStatus.PICKUP_REQUESTED,
        description: "Courier unassigned by admin. Re-queued for assignment.",
        location: "Central Distribution Hub",
      },
    });

    return updatedShipment;
  });

  if (previousCourier) {
    await NotificationService.createNotification({
      userId: previousCourier.userId,
      courierId: previousCourier.id,
      title: "Task Unassigned",
      message: `Shipment #${shipment.trackingNumber} has been unassigned from you by admin.`,
      type: NotificationType.DELIVERY,
    });
  }

  return result;
};

const getAllShipments = async (query: Record<string, any>) => {
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;

  const andConditions: Prisma.ShipmentWhereInput[] = [
    {
      deletedAt: null,
    },
  ];

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
          customer: {
            name: {
              contains: query.searchTerm,
              mode: "insensitive",
            },
          },
        },
        {
          customer: {
            email: {
              contains: query.searchTerm,
              mode: "insensitive",
            },
          },
        },
        {
          courier: {
            phone: {
              contains: query.searchTerm,
              mode: "insensitive",
            },
          },
        },
      ],
    });
  }

  if (query.status) {
    andConditions.push({
      status: query.status as ShipmentStatus,
    });
  }

  if (query.deliveryType) {
    andConditions.push({
      deliveryType: query.deliveryType,
    });
  }

  if (query.courierId) {
    andConditions.push({
      courierId: query.courierId,
    });
  }

  if (query.startDate && query.endDate) {
    andConditions.push({
      createdAt: {
        gte: new Date(query.startDate),
        lte: new Date(query.endDate),
      },
    });
  }

  const whereConditions: Prisma.ShipmentWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const sortBy = query.sortBy || "createdAt";
  const sortOrder = query.sortOrder || "desc";

  const [shipments, total] = await Promise.all([
    prisma.shipment.findMany({
      where: whereConditions,
      take: limit,
      skip,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        courier: {
          select: {
            id: true,
            phone: true,
            vehicleType: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        pickupAddress: true,
        deliveryAddress: true,
        payment: true,
      },
    }),
    prisma.shipment.count({
      where: whereConditions,
    }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: shipments,
  };
};

const updateShipmentStatusByAdmin = async (
  shipmentId: string,
  payload: { status: ShipmentStatus; location?: string; description?: string },
) => {
  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId, deletedAt: null },
    include: { customer: true, courier: true },
  });

  if (!shipment) {
    throw new AppError(httpStatus.NOT_FOUND, "Shipment not found!");
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedShipment = await tx.shipment.update({
      where: { id: shipmentId },
      data: {
        status: payload.status,
        ...(payload.status === ShipmentStatus.DELIVERED && {
          deliveredAt: new Date(),
        }),
        ...(payload.status === ShipmentStatus.PICKED_UP && {
          pickedUpAt: new Date(),
        }),
        ...(payload.status === ShipmentStatus.CANCELLED && {
          cancelledAt: new Date(),
        }),
      },
      include: {
        customer: true,
        courier: { include: { user: true } },
      },
    });

    await tx.shipmentTrackingEvent.create({
      data: {
        shipmentId,
        status: payload.status,
        description:
          payload.description ||
          `Status updated to ${payload.status} by Admin.`,
        location: payload.location || "Sorting Facility",
      },
    });

    return updatedShipment;
  });

  // Notify customer
  await NotificationService.createNotification({
    userId: shipment.customerId,
    title: `Shipment Update: ${payload.status}`,
    message: `Your shipment #${shipment.trackingNumber} status is now ${payload.status}.${payload.description ? ` Details: ${payload.description}` : ""}`,
    type: NotificationType.SHIPMENT,
  });

  return result;
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

  // // 3. Approval Status Filter
  // if (query.isApproved !== undefined) {
  //   andConditions.push({
  //     isApproved: query.isApproved === "true",
  //   });
  // }

  // // 4. Availability Filter
  // if (query.isAvailable !== undefined) {
  //   andConditions.push({
  //     isAvailable: query.isAvailable === "true",
  //   });
  // }

  // // 5. Vehicle Type Filter (BIKE, CYCLE, VAN, TRUCK)
  // if (query.vehicleType) {
  //   andConditions.push({
  //     vehicleType: query.vehicleType as VehicleType,
  //   });
  // }

  if (query.verificationStatus) {
    andConditions.push({
      VerificationStatus: query.verificationStatus as VerificationStatus,
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
    isAvailable: true,
    isDeleted: false,
    user: {
      status: UserStatus.ACTIVE,
    },
  };

  if (query.isApproved !== undefined) {
    whereConditions.isApproved = query.isApproved === "true";
  }

  if (query.vehicleType) {
    whereConditions.vehicleType = query.vehicleType;
  }

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

const approveCourier = async (courierProfileId: string) => {
  const courier = await prisma.courierProfile.findUnique({
    where: {
      id: courierProfileId,
    },
  });

  if (!courier) {
    throw new AppError(httpStatus.NOT_FOUND, "Courier profile not found");
  }

  if (courier.VerificationStatus === "APPROVED") {
    throw new AppError(httpStatus.BAD_REQUEST, "Courier is already approved");
  }
  if (courier.isApproved) {
    throw new AppError(httpStatus.BAD_REQUEST, "Courier is already approved");
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedCourier = await tx.courierProfile.update({
      where: {
        id: courierProfileId,
      },
      data: {
        VerificationStatus: "APPROVED",
        isApproved: true,
      },
      include: {
        user: true,
      },
    });

    await tx.user.update({
      where: {
        id: courier.userId,
      },
      data: {
        role: Role.COURIER,
      },
    });

    return updatedCourier;
  });

  // Notify courier that application is approved
  await NotificationService.createNotification({
    userId: result.userId,
    courierId: result.id,
    title: "Account Approved",
    message: "Congratulations! Your courier application has been approved.",
    type: NotificationType.SYSTEM,
  });

  return result;
};

const rejectCourier = async (courierProfileId: string) => {
  const courier = await prisma.courierProfile.findUnique({
    where: {
      id: courierProfileId,
    },
  });

  if (!courier) {
    throw new AppError(httpStatus.NOT_FOUND, "Courier profile not found");
  }

  if (courier.VerificationStatus === "REJECTED") {
    throw new AppError(httpStatus.BAD_REQUEST, "Courier is already rejected");
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedCourier = await tx.courierProfile.update({
      where: {
        id: courierProfileId,
      },
      data: {
        isApproved: false,
        VerificationStatus: "REJECTED",
      },
      include: {
        user: true,
      },
    });

    await tx.user.update({
      where: {
        id: courier.userId,
      },
      data: {
        role: Role.CUSTOMER,
      },
    });

    return updatedCourier;
  });

  return result;
};

const updateUserStatus = async (userId: string, status: UserStatus) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.isDeleted) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Cannot update status of a deleted user",
    );
  }

  if (user.role === Role.ADMIN) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Admin account status cannot be updated from this endpoint",
    );
  }

  if (status === UserStatus.PENDING) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "User status cannot be changed to PENDING",
    );
  }

  if (user.status === status) {
    throw new AppError(httpStatus.BAD_REQUEST, `User is already ${status}`);
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: {
        id: userId,
      },
      data: {
        status,
      },
      include: {
        courierProfile: true,
      },
    });

    if (status === UserStatus.SUSPENDED || status === UserStatus.BLOCKED) {
      await tx.courierProfile.updateMany({
        where: { userId },
        data: { isAvailable: false },
      });
    }

    return updatedUser;
  });

  return result;
};

export const AdminService = {
  assignCourierToShipment,
  unassignCourierFromShipment,
  getAllShipments,
  updateShipmentStatusByAdmin,
  getAllUsers,
  getAllCouriers,
  getAvailableCouriers,
  approveCourier,
  updateUserStatus,
  rejectCourier,
};
