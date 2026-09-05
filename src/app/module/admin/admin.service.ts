import httpStatus from "http-status";

import { AppError } from "../../utils/AppError";
import { prisma } from "../../lib/prisma";

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

export const AdminService = {
  assignCourierToShipment,
};
