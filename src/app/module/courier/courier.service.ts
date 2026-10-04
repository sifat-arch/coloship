import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
  NotificationType,
  ShipmentStatus,
  UserStatus,
  VehicleType,
} from "../../../generated/prisma/enums";
import { NotificationService } from "../notification/notification.service";
import { ALLOWED_STATUS_TRANSITIONS } from "../../utils/allowed-status";

const getMyProfile = async (userId: string) => {
  const courierProfile = await prisma.courierProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          imageUrl: true,
          createdAt: true,
        },
      },
    },
  });

  if (!courierProfile) {
    throw new AppError(httpStatus.NOT_FOUND, "Courier profile not found!");
  }

  return courierProfile;
};

const updateProfile = async (
  userId: string,
  payload: {
    phone?: string;
    vehicleType?: VehicleType;
    vehicleNumber?: string;
    licenseNumber?: string;
  },
) => {
  const courierProfile = await prisma.courierProfile.findUnique({
    where: { userId },
    include: { user: true },
  });

  if (!courierProfile) {
    throw new AppError(httpStatus.NOT_FOUND, "Courier profile not found!");
  }

  if (courierProfile.user.status === UserStatus.SUSPENDED) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your account is suspended. Profile and vehicle details cannot be updated.",
    );
  }

  if (courierProfile.user.status === UserStatus.BLOCKED) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your account is blocked. Profile and vehicle details cannot be updated.",
    );
  }

  const result = await prisma.courierProfile.update({
    where: { userId },
    data: {
      ...(payload.phone && { phone: payload.phone }),
      ...(payload.vehicleType && { vehicleType: payload.vehicleType }),
      ...(payload.vehicleNumber !== undefined && {
        vehicleNumber: payload.vehicleNumber,
      }),
      ...(payload.licenseNumber !== undefined && {
        licenseNumber: payload.licenseNumber,
      }),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          imageUrl: true,
        },
      },
    },
  });

  return result;
};

const toggleAvailability = async (userId: string, isAvailable?: boolean) => {
  const courierProfile = await prisma.courierProfile.findUnique({
    where: { userId },
    include: { user: true },
  });

  if (!courierProfile) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Courier profile not found for this user!",
    );
  }

  if (
    courierProfile.user.status === UserStatus.SUSPENDED ||
    courierProfile.user.status === UserStatus.BLOCKED
  ) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your account is suspended. You cannot change your availability status.",
    );
  }

  const updatedStatus =
    isAvailable !== undefined ? isAvailable : !courierProfile.isAvailable;

  const result = await prisma.courierProfile.update({
    where: { userId },
    data: {
      isAvailable: updatedStatus,
    },
    select: {
      id: true,
      userId: true,
      phone: true,
      vehicleType: true,
      vehicleNumber: true,
      isAvailable: true,
      updatedAt: true,
    },
  });

  return result;
};

const getMyAssignments = async (
  userId: string,
  query?: { status?: string },
) => {
  const courierProfile = await prisma.courierProfile.findUnique({
    where: { userId },
  });

  if (!courierProfile) {
    throw new AppError(httpStatus.NOT_FOUND, "Courier profile not found!");
  }

  const whereConditions: Record<string, any> = {
    courierId: courierProfile.id,
    deletedAt: null,
  };

  if (query?.status && query.status !== "ALL") {
    whereConditions.status = query.status as ShipmentStatus;
  }

  return await prisma.shipment.findMany({
    where: whereConditions,
    include: {
      pickupAddress: true,
      deliveryAddress: true,
      payment: true,
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      trackingEvents: {
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
};

const getSingleAssignment = async (shipmentId: string, userId: string) => {
  const courierProfile = await prisma.courierProfile.findUnique({
    where: { userId },
  });

  if (!courierProfile) {
    throw new AppError(httpStatus.NOT_FOUND, "Courier profile not found!");
  }

  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId, deletedAt: null },
    include: {
      pickupAddress: true,
      deliveryAddress: true,
      payment: true,
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      trackingEvents: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!shipment) {
    throw new AppError(httpStatus.NOT_FOUND, "Shipment not found!");
  }

  if (shipment.courierId !== courierProfile.id) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not authorized to view this shipment!",
    );
  }

  return shipment;
};

const respondToAssignment = async (
  shipmentId: string,
  userId: string,
  payload: { action: "ACCEPT" | "REJECT"; reason?: string },
) => {
  const courierProfile = await prisma.courierProfile.findUnique({
    where: { userId },
    include: { user: true },
  });

  if (!courierProfile) {
    throw new AppError(httpStatus.NOT_FOUND, "Courier profile not found!");
  }

  if (courierProfile.isDeleted) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your courier profile has been deactivated!",
    );
  }

  if (
    !courierProfile.isApproved ||
    courierProfile.VerificationStatus !== "APPROVED"
  ) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your courier profile is not approved yet. Only approved couriers can accept or reject tasks!",
    );
  }

  if (
    courierProfile.user.status === UserStatus.SUSPENDED ||
    courierProfile.user.status === UserStatus.BLOCKED
  ) {
    if (payload.action === "ACCEPT") {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "Your account is suspended. You cannot accept new delivery tasks!",
      );
    }
  }

  const existingShipment = await prisma.shipment.findUnique({
    where: { id: shipmentId, deletedAt: null },
    include: { customer: true },
  });

  if (!existingShipment) {
    throw new AppError(httpStatus.NOT_FOUND, "Shipment not found!");
  }

  if (existingShipment.courierId !== courierProfile.id) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not assigned to this shipment!",
    );
  }

  if (existingShipment.status !== ShipmentStatus.COURIER_ASSIGNED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Cannot ${payload.action.toLowerCase()} task with current status '${existingShipment.status}'. Only newly assigned tasks can be responded to.`,
    );
  }

  if (payload.action === "ACCEPT") {
    // Check if task is already accepted
    const alreadyAccepted = await prisma.shipmentTrackingEvent.findFirst({
      where: {
        shipmentId,
        description: { contains: "Task accepted by courier" },
      },
    });

    if (alreadyAccepted) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "You have already accepted this delivery task!",
      );
    }

    const updatedShipment = await prisma.$transaction(async (tx) => {
      await tx.shipmentTrackingEvent.create({
        data: {
          shipmentId,
          status: existingShipment.status,
          description: `Task accepted by courier ${courierProfile.user.name}. Ready for parcel pickup.`,
          location: "With Courier",
          createdBy: courierProfile.user.name,
        },
      });

      return existingShipment;
    });

    await NotificationService.createNotification({
      userId: existingShipment.customerId,
      courierId: courierProfile.id,
      title: "Courier Accepted Task",
      message: `Courier ${courierProfile.user.name} has accepted shipment #${existingShipment.trackingNumber}.`,
      type: NotificationType.DELIVERY,
    });

    return updatedShipment;
  }

  // If REJECT:
  const result = await prisma.$transaction(async (tx) => {
    const updatedShipment = await tx.shipment.update({
      where: { id: shipmentId },
      data: {
        courierId: null,
        status: ShipmentStatus.PICKUP_REQUESTED,
      },
      include: {
        pickupAddress: true,
        deliveryAddress: true,
        customer: true,
      },
    });

    await tx.shipmentTrackingEvent.create({
      data: {
        shipmentId,
        status: ShipmentStatus.PICKUP_REQUESTED,
        description: `Task rejected by courier (${courierProfile.user.name}). Reason: ${payload.reason || "Courier unavailable"}. Awaiting re-assignment.`,
        location: "Awaiting Reassignment",
        createdBy: courierProfile.user.name,
      },
    });

    return updatedShipment;
  });

  // Notify customer
  await NotificationService.createNotification({
    userId: existingShipment.customerId,
    title: "Shipment Reassignment Needed",
    message: `Courier was unable to accept shipment #${existingShipment.trackingNumber}. Finding a new courier for you.`,
    type: NotificationType.SHIPMENT,
  });

  return result;
};

const updateAssignmentStatus = async (
  shipmentId: string,
  userId: string,
  payload: { status: string; note?: string; location?: string },
) => {
  const courierProfile = await prisma.courierProfile.findUnique({
    where: { userId },
    include: { user: true },
  });

  if (!courierProfile) {
    throw new AppError(httpStatus.NOT_FOUND, "Courier profile not found!");
  }

  if (courierProfile.isDeleted) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your courier profile has been deactivated!",
    );
  }

  if (
    !courierProfile.isApproved ||
    courierProfile.VerificationStatus !== "APPROVED"
  ) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your courier profile is not approved. Only approved couriers can update tasks!",
    );
  }

  const shipment = await prisma.shipment.findUnique({
    where: {
      id: shipmentId,
      deletedAt: null,
    },
    include: { customer: true },
  });

  if (!shipment) {
    throw new AppError(httpStatus.NOT_FOUND, "Shipment not found!");
  }

  if (shipment.courierId !== courierProfile.id) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not authorized to update this shipment!",
    );
  }

  // Account status restrictions
  if (courierProfile.user.status === UserStatus.BLOCKED) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your account is blocked. You cannot update shipments.",
    );
  }

  if (courierProfile.user.status === UserStatus.SUSPENDED) {
    const inProgressStatuses: ShipmentStatus[] = [
      ShipmentStatus.PICKED_UP,
      ShipmentStatus.IN_TRANSIT,
      ShipmentStatus.OUT_FOR_DELIVERY,
    ];
    if (!inProgressStatuses.includes(shipment.status)) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "Your account is suspended. You cannot pick up new shipments; only already picked up in-progress deliveries can be completed.",
      );
    }
  }

  // Prevent updates on terminal statuses
  if (shipment.status === ShipmentStatus.DELIVERED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Shipment has already been delivered! No further updates are permitted.",
    );
  }

  if (shipment.status === ShipmentStatus.CANCELLED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Shipment has been cancelled! No further updates are permitted.",
    );
  }

  if (shipment.status === ShipmentStatus.DELIVERY_FAILED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Delivery attempt was already recorded as failed. Awaiting admin resolution.",
    );
  }

  const requestedStatus = payload.status as ShipmentStatus;
  const allowedNext = ALLOWED_STATUS_TRANSITIONS[shipment.status] || [];

  if (!allowedNext.includes(requestedStatus)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Invalid status transition! Cannot update status from '${shipment.status}' to '${requestedStatus}'.`,
    );
  }

  // Determine standard tracking description
  let defaultDescription = `Status updated to ${requestedStatus.replace(/_/g, " ")} by courier.`;
  if (requestedStatus === ShipmentStatus.PICKED_UP) {
    defaultDescription = `Parcel successfully picked up by courier ${courierProfile.user?.name || ""}.`;
  } else if (requestedStatus === ShipmentStatus.IN_TRANSIT) {
    defaultDescription = `Parcel is now in transit towards destination.`;
  } else if (requestedStatus === ShipmentStatus.OUT_FOR_DELIVERY) {
    defaultDescription = `Parcel is out for delivery with courier. Expect delivery soon.`;
  } else if (requestedStatus === ShipmentStatus.DELIVERED) {
    defaultDescription = `Shipment delivered successfully to recipient.`;
  } else if (requestedStatus === ShipmentStatus.DELIVERY_FAILED) {
    defaultDescription = `Delivery attempt failed. ${payload.note ? `Reason: ${payload.note}` : "Recipient unavailable."}`;
  }

  const finalDescription = payload.note
    ? `${defaultDescription} Note: ${payload.note}`
    : defaultDescription;

  const updatedShipment = await prisma.$transaction(async (tx) => {
    const res = await tx.shipment.update({
      where: { id: shipmentId },
      data: {
        status: requestedStatus,
        ...(requestedStatus === ShipmentStatus.PICKED_UP && {
          pickedUpAt: new Date(),
        }),
        ...(requestedStatus === ShipmentStatus.DELIVERED && {
          deliveredAt: new Date(),
        }),
        ...(requestedStatus === ShipmentStatus.CANCELLED && {
          cancelledAt: new Date(),
        }),
      },
      include: {
        pickupAddress: true,
        deliveryAddress: true,
        payment: true,
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        trackingEvents: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    await tx.shipmentTrackingEvent.create({
      data: {
        shipmentId,
        status: requestedStatus,
        description: finalDescription,
        location:
          payload.location ||
          (requestedStatus === ShipmentStatus.DELIVERED
            ? "Delivered at Destination"
            : "In Transit"),
        createdBy: courierProfile.user?.name || "Courier",
      },
    });

    return res;
  });

  // Specific notifications based on requested status
  if (requestedStatus === ShipmentStatus.PICKED_UP) {
    await NotificationService.createNotification({
      userId: shipment.customerId,
      courierId: courierProfile.id,
      title: "Picked Up",
      message: "Your parcel has been picked up from your address.",
      type: NotificationType.DELIVERY,
    });
  } else if (requestedStatus === ShipmentStatus.OUT_FOR_DELIVERY) {
    await NotificationService.createNotification({
      userId: shipment.customerId,
      courierId: courierProfile.id,
      title: "Out for Delivery",
      message: "Your parcel is out for delivery today.",
      type: NotificationType.DELIVERY,
    });
  } else if (requestedStatus === ShipmentStatus.DELIVERED) {
    // Notify customer
    await NotificationService.createNotification({
      userId: shipment.customerId,
      courierId: courierProfile.id,
      title: "Delivered",
      message: `Parcel #${shipment.trackingNumber} delivered successfully!`,
      type: NotificationType.DELIVERY,
    });

    // Notify courier about earnings
    const earning = 60;
    await NotificationService.createNotification({
      userId: courierProfile.userId,
      courierId: courierProfile.id,
      title: "Earning Added",
      message: `Earned ৳${earning} for delivering parcel #${shipment.trackingNumber}.`,
      type: NotificationType.PAYMENT,
    });

    // Notify admins
    await NotificationService.notifyAdmins({
      title: "Shipment Delivered",
      message: `Shipment #${shipment.trackingNumber} delivered successfully.`,
      type: NotificationType.DELIVERY,
    });
  } else if (requestedStatus === ShipmentStatus.DELIVERY_FAILED) {
    const reasonText = payload.note ? payload.note : "Customer unreachable";
    // Notify customer
    await NotificationService.createNotification({
      userId: shipment.customerId,
      courierId: courierProfile.id,
      title: "Delivery Failed",
      message: `Delivery attempt failed (${reasonText}).`,
      type: NotificationType.SHIPMENT,
    });

    // Notify admins
    await NotificationService.notifyAdmins({
      title: "Delivery Failed",
      message: `Shipment #${shipment.trackingNumber} failed to deliver. Returned to Hub.`,
      type: NotificationType.SHIPMENT,
    });
  } else {
    // Other transitions (e.g. IN_TRANSIT)
    await NotificationService.createNotification({
      userId: shipment.customerId,
      courierId: courierProfile.id,
      title: `Shipment Update: ${requestedStatus.replace(/_/g, " ")}`,
      message: `Your shipment #${shipment.trackingNumber} status is now ${requestedStatus.replace(/_/g, " ")}.${payload.note ? ` Note: ${payload.note}` : ""}`,
      type: NotificationType.SHIPMENT,
    });
  }

  return updatedShipment;
};

const getDashboardStats = async (userId: string) => {
  const courierProfile = await prisma.courierProfile.findUnique({
    where: { userId },
  });

  if (!courierProfile) {
    throw new AppError(httpStatus.NOT_FOUND, "Courier profile not found!");
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [activeTasks, completedTodayShipments, totalCompleted] =
    await Promise.all([
      // 1. Active tasks
      prisma.shipment.count({
        where: {
          courierId: courierProfile.id,
          deletedAt: null,
          status: {
            in: [
              ShipmentStatus.COURIER_ASSIGNED,
              ShipmentStatus.PICKED_UP,
              ShipmentStatus.IN_TRANSIT,
              ShipmentStatus.OUT_FOR_DELIVERY,
            ],
          },
        },
      }),

      // 2. Completed today
      prisma.shipment.findMany({
        where: {
          courierId: courierProfile.id,
          deletedAt: null,
          status: ShipmentStatus.DELIVERED,
          deliveredAt: {
            gte: startOfToday,
          },
        },
        select: {
          codAmount: true,
          deliveryFee: true,
        },
      }),

      // 3. Total completed all time
      prisma.shipment.count({
        where: {
          courierId: courierProfile.id,
          deletedAt: null,
          status: ShipmentStatus.DELIVERED,
        },
      }),
    ]);

  const todayCodCollected = completedTodayShipments.reduce(
    (sum, item) => sum + Number(item.codAmount || 0),
    0,
  );

  return {
    activeTasks,
    completedToday: completedTodayShipments.length,
    totalCompleted,
    todayCodCollected,
    isAvailable: courierProfile.isAvailable,
  };
};

export const CourierService = {
  getMyProfile,
  updateProfile,
  toggleAvailability,
  getMyAssignments,
  getSingleAssignment,
  respondToAssignment,
  updateAssignmentStatus,
  getDashboardStats,
};
