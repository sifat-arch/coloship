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
import { differenceInHours } from "date-fns";

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

  // 3. Delivery Address Validation
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

const getSingleShipment = async (shipmentId: string, userId: string) => {
  const shipment = await prisma.shipment.findFirst({
    where: {
      id: shipmentId,
      customerId: userId,
      deletedAt: null,
    },
    include: {
      pickupAddress: true,
      deliveryAddress: true,
      trackingEvents: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!shipment) {
    throw new AppError(httpStatus.NOT_FOUND, "Shipment not found!");
  }

  return shipment;
};

// cancel shipment

// const cancelShipment = async (shipmentId: string, customerId: string) => {
//   // ১. শিপমেন্ট এবং পেমেন্ট ডেটা নিয়ে আসা
//   const shipment = await prisma.shipment.findFirst({
//     where: {
//       id: shipmentId,
//       customerId,
//       deletedAt: null,
//     },
//     include: { payment: true },
//   });

//   if (!shipment) {
//     throw new AppError(httpStatus.NOT_FOUND, "Shipment not found!");
//   }

//   // ২. শুধুমাত্র CREATED স্ট্যাটাসে থাকা অবস্থায় ক্যানসেল করা যাবে
//   if (shipment.status !== "CREATED") {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       `Cannot cancel shipment once it is in '${shipment.status}' status.`,
//     );
//   }

//   const payment = shipment.payment;
//   let isEligibleForRefund = false;

//   // ৩. পেমেন্ট যদি ইতোমধ্যে সম্পন্ন হয়ে থাকে (PAID Check)
//   if (payment && payment.status === "PAID" && payment.paidAt) {
//     const now = new Date();
//     const paidAt = new Date(payment.paidAt);

//     // পেমেন্টের পর কত ঘণ্টা পার হয়েছে তা হিসাব করা (Hours Difference)
//     const hoursDifference =
//       (now.getTime() - paidAt.getTime()) / (1000 * 60 * 60);

//     // ২ ঘণ্টার বেশি হয়ে গেলে ক্যানসেল করা যাবে না
//     if (hoursDifference > 2) {
//       throw new AppError(
//         httpStatus.BAD_REQUEST,
//         "Cancellation window expired! You cannot cancel a shipment after 2 hours of payment. Please contact customer support.",
//       );
//     }

//     // ২ ঘণ্টার মধ্যে হলে রিফান্ডের জন্য এলিজিবল
//     isEligibleForRefund = true;
//   }

//   // ৪. ট্রানজ্যাকশনের মাধ্যমে শিপমেন্ট ক্যানসেল এবং পেমেন্ট/রিফান্ড হ্যান্ডলিং
//   return await prisma.$transaction(async (tx) => {
//     // শিপমেন্ট ক্যানসেল করা
//     const updatedShipment = await tx.shipment.update({
//       where: { id: shipmentId },
//       data: {
//         status: "CANCELLED",
//         cancelledAt: new Date(),
//       },
//     });

//     // ট্র্যাকিং ইভেন্ট যোগ করা
//     await tx.shipmentTrackingEvent.create({
//       data: {
//         shipmentId,
//         status: "CANCELLED",
//         description: isEligibleForRefund
//           ? "Shipment cancelled within 2 hours of payment. Refund initiated."
//           : "Shipment cancelled by customer.",
//       },
//     });

//     // পেমেন্ট স্ট্যাটাস আপডেট লজিক
//     if (payment) {
//       if (isEligibleForRefund) {
//         // ২ ঘণ্টার মধ্যে ক্যানসেল করলে - পেমেন্ট স্ট্যাটাস REFUNDED বা REFUND_PENDING হবে
//         await tx.payment.update({
//           where: { shipmentId },
//           data: {
//             status: "REFUNDED", // আপনার PaymentStatus Enum এ না থাকলে REFUND_PENDING বা CANCELLED দিন
//           },
//         });

//         // TODO: কলার সার্ভিস থেকে আপনার পেমেন্ট গেটওয়ের (bKash/SSLCommerz/Stripe) Refund API হিট হবে
//         // await PaymentService.triggerGatewayRefund(payment.transactionId, payment.amount);
//       } else if (payment.status === "PENDING") {
//         // টাকা না দিয়ে ক্যানসেল করলে - পেমেন্ট ক্যানসেলড/ফেইল্ড
//         await tx.payment.update({
//           where: { shipmentId },
//           data: {
//             status: "CANCELLED",
//             failedAt: new Date(),
//           },
//         });
//       }
//     }

//     return updatedShipment;
//   });
// };

// tracking 

const trackShipment = async (trackingNumber: string) => {
  const shipment = await prisma.shipment.findFirst({
    where: {
      trackingNumber,
      deletedAt: null,
    },
    select: {
      id: true,
      trackingNumber: true,
      status: true,
      deliveryType: true,
      weight: true,
      parcelDescription: true,
      createdAt: true,
      pickedUpAt: true,
      deliveredAt: true,
      cancelledAt: true,
      pickupAddress: {
        select: {
          area: true,
          city: true,
        },
      },
      deliveryAddress: {
        select: {
          area: true,
          city: true,
        },
      },
      trackingEvents: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!shipment) {
    throw new AppError(httpStatus.NOT_FOUND, "Shipment not found with this tracking number!");
  }

  return shipment;
};

export const ShipmentService = {
  createShipment,
  getMyShipments,
  getSingleShipment,
  trackShipment
};
