import httpStatus from "http-status";

import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";

const toggleAvailability = async (userId: string, isAvailable?: boolean) => {
  // 1. Check if courier profile exists
  const courierProfile = await prisma.courierProfile.findUnique({
    where: { userId },
  });

  if (!courierProfile) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Courier profile not found for this user!",
    );
  }

  // 2. If isAvailable explicitly passed, use it; otherwise toggle current state
  const updatedStatus =
    isAvailable !== undefined ? isAvailable : !courierProfile.isAvailable;

  // 3. Update status in database
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
      currentHubId: true,
      updatedAt: true,
    },
  });

  return result;
};

const getMyAssignments = async (userId: string) => {
  const courierProfile = await prisma.courierProfile.findUnique({
    where: { userId },
  });

  if (!courierProfile) {
    throw new AppError(httpStatus.NOT_FOUND, "Courier profile not found!");
  }

  return await prisma.shipment.findMany({
    where: {
      courierId: courierProfile.id,
      deletedAt: null,
    },
    include: {
      pickupAddress: true,
      deliveryAddress: true,
      payment: true,
    },
    orderBy: { updatedAt: "desc" },
  });
};

const updateAssignmentStatus = async (
  shipmentId: string,
  userId: string,
  payload: { status: string; note?: string; location?: string },
) => {
  const courierProfile = await prisma.courierProfile.findUnique({
    where: { userId },
  });

  if (!courierProfile) {
    throw new AppError(httpStatus.NOT_FOUND, "Courier profile not found!");
  }

  const shipment = await prisma.shipment.findFirst({
    where: {
      id: shipmentId,
      courierId: courierProfile.id,
      deletedAt: null,
    },
  });

  if (!shipment) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Shipment not assigned to you or not found!",
    );
  }

  return await prisma.$transaction(async (tx) => {
    const updatedShipment = await tx.shipment.update({
      where: { id: shipmentId },
      data: {
        status: payload.status as any,
        ...(payload.status === "PICKED_UP" && { pickedUpAt: new Date() }),
        ...(payload.status === "DELIVERED" && { deliveredAt: new Date() }),
      },
    });

    await tx.shipmentTrackingEvent.create({
      data: {
        shipmentId,
        status: payload.status as any,
        description:
          payload.note || `Status updated to ${payload.status} by courier.`,
        location: payload.location || "In Transit",
      },
    });

    return updatedShipment;
  });
};

export const CourierService = {
  toggleAvailability,
  getMyAssignments,
  updateAssignmentStatus,
};
