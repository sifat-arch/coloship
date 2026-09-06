import { Prisma } from "../../../generated/prisma/client";
import { PaymentMethod, PaymentStatus } from "../../../generated/prisma/enums";
import config from "../../config";
import { getBkashIdToken, refundBkashPayment } from "../../lib/bkash";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import httpStatus from "http-status";

// const initiatePayment = async (
//   userId: string,
//   payload: { method: "BKASH" | "COD" },
// ) => {
//   const { method } = payload;

//   const shipment = await prisma.shipment.findFirst({
//     where: {
//       customerId: userId,
//       deletedAt: null,
//     },
//     include: {
//       customer: true,
//     },
//   });

//   if (!shipment) {
//     throw new AppError(httpStatus.NOT_FOUND, "Shipment not found!");
//   }

//   // check payment is already exist

//   const existingPayment = await prisma.payment.findUnique({
//     where: { shipmentId: shipment.id },
//   });

//   if (existingPayment && existingPayment.status === "PAID") {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       "Payment already completed for this shipment!",
//     );
//   }

//   const totalAmount = Number(shipment.deliveryFee) + Number(shipment.codAmount);

//   const merchantInvoiceNumber = shipment.id;

//   if (method === "COD") {
//     const payment = await prisma.payment.upsert({
//       where: {
//         shipmentId: shipment.id,
//       },

//       update: {
//         method: "COD",
//         amount: totalAmount,
//         status: PaymentStatus.PAID,
//         invoiceNumber: merchantInvoiceNumber,
//         merchantInvoiceNumber,
//         paymentReference: shipment.customer.email,
//       },

//       create: {
//         shipmentId: shipment.id,
//         amount: totalAmount,
//         method: "COD",
//         status: "PENDING",
//         invoiceNumber: merchantInvoiceNumber,
//         merchantInvoiceNumber,
//         paymentReference: shipment.customer.email,
//       },
//     });

//     return {
//       message: "Payment method set to Cash on Delivery successfully!",
//       payment,
//     };
//   }

//   // --- Option B: bKash Online Checkout ---

//   const idToken = await getBkashIdToken();

//   const bkashCreateRes = await fetch(
//     `${config.bkash_base_url}/tokenized/checkout/create`,
//     {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Accept: "application/json",
//         authorization: idToken as string,
//         "x-app-key": config.bkash_app_key as string,
//       },
//       body: JSON.stringify({
//         mode: "0011",
//         payerReference: shipment.customer.email || "Coloship Customer",
//         callbackURL: `${config.bkash_callback_url}/payments/bkash/callback`,
//         amount: totalAmount.toFixed(2),
//         currency: "BDT",
//         intent: "sale",
//         merchantInvoiceNumber,
//       }),
//     },
//   );

//   const bkashData = await bkashCreateRes.json();

//   if (!bkashCreateRes.ok || bkashData.statusCode !== "0000") {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       bkashData?.statusMessage || "bKash payment creation failed",
//     );
//   }

//   const payment = await prisma.payment.upsert({
//     where: { shipmentId: shipment.id },
//     update: {
//       method: "BKASH",
//       amount: totalAmount,
//       status: "PENDING",
//       invoiceNumber: merchantInvoiceNumber,
//       merchantInvoiceNumber,
//       bkashPaymentId: bkashData.paymentID,
//       paymentUrl: bkashData.bkashURL,
//       transactionReference: bkashData.paymentID,
//       paymentReference: shipment.customer.email || shipment.customer.email,
//       gatewayResponse: bkashData,
//     },
//     create: {
//       shipmentId: shipment.id,
//       amount: totalAmount,
//       method: "BKASH",
//       status: "PENDING",
//       invoiceNumber: merchantInvoiceNumber,
//       merchantInvoiceNumber,
//       bkashPaymentId: bkashData.paymentID,
//       paymentUrl: bkashData.bkashURL,
//       transactionReference: bkashData.paymentID,
//       paymentReference: shipment.customer.email || shipment.customer.email,
//       gatewayResponse: bkashData,
//     },
//   });

//   return {
//     paymentUrl: bkashData.bkashURL,
//     bkashPaymentId: bkashData.paymentID,
//     payment,
//   };
// };

// // bKash callback logic Exeuation

// const handleBkashCallback = async (paymentID: string, status: string) => {
//   const payment = await prisma.payment.findFirst({
//     where: {
//       bkashPaymentId: paymentID,
//     },
//     include: {
//       shipment: true,
//     },
//   });

//   if (!payment) {
//     throw new AppError(httpStatus.NOT_FOUND, "Payment record not found!");
//   }

//   // Customer cancelled / payment failed
//   if (status !== "success") {
//     await prisma.payment.update({
//       where: {
//         id: payment.id,
//       },
//       data: {
//         status:
//           status === "cancel" ? PaymentStatus.CANCELLED : PaymentStatus.FAILED,
//       },
//     });

//     return {
//       status:
//         status === "cancel" ? PaymentStatus.CANCELLED : PaymentStatus.FAILED,

//       message: "Payment was not completed.",
//     };
//   }

//   // Get bKash token
//   const bkashIdToken = await getBkashIdToken();

//   if (!bkashIdToken) {
//     throw new AppError(
//       httpStatus.INTERNAL_SERVER_ERROR,
//       "No bKash access token found",
//     );
//   }

//   // Execute payment
//   const executePaymentResponse = await fetch(
//     `${config.bkash_base_url}/tokenized/checkout/execute`,
//     {
//       method: "POST",

//       headers: {
//         "Content-Type": "application/json",
//         Accept: "application/json",
//         Authorization: bkashIdToken,
//         "X-App-Key": config.bkash_app_key,
//       },

//       body: JSON.stringify({
//         paymentID,
//       }),
//     },
//   );

//   const executePaymentResult = await executePaymentResponse.json();

//   console.log("bKash Execute Response:", executePaymentResult);
//   console.log("bKash HTTP Status:", executePaymentResponse.status);

//   // bKash execution failed
//   if (
//     !executePaymentResponse.ok ||
//     executePaymentResult.statusCode !== "0000"
//   ) {
//     await prisma.payment.update({
//       where: {
//         id: payment.id,
//       },

//       data: {
//         status: PaymentStatus.FAILED,
//         gatewayResponse: executePaymentResult,
//       },
//     });

//     return {
//       status: PaymentStatus.FAILED,
//       message: "Payment execution failed.",
//     };
//   }

//   // Payment successful
//   await prisma.payment.update({
//     where: {
//       id: payment.id,
//     },

//     data: {
//       status: PaymentStatus.SUCCESS,
//       bakshTrxId: executePaymentResult.trxID,
//       paidAt: executePaymentResult.paymentExecuteTime,
//       gatewayResponse: executePaymentResult,
//     },
//   });

//   return {
//     status: PaymentStatus.SUCCESS,
//     message: "Payment completed successfully.",
//     transactionId: executePaymentResult.trxID,
//   };
// };

interface IInitiatePaymentPayload {
  shipmentId: string;
  method: "BKASH" | "COD";
}

const initiatePayment = async (
  userId: string,
  payload: IInitiatePaymentPayload,
) => {
  const { shipmentId, method } = payload;

  // ১. নির্দিষ্ট শিপমেন্ট চেক করা
  const shipment = await prisma.shipment.findFirst({
    where: {
      id: shipmentId,
      customerId: userId,
      deletedAt: null,
    },
    include: {
      customer: true,
    },
  });

  if (!shipment) {
    throw new AppError(httpStatus.NOT_FOUND, "Shipment not found!");
  }

  // ২. অলরেডি পেমেন্ট করা হয়ে থাকলে আটকানো
  const existingPayment = await prisma.payment.findUnique({
    where: { shipmentId },
  });

  if (existingPayment && existingPayment.status === PaymentStatus.PAID) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Payment already completed for this shipment!",
    );
  }

  const totalAmount =
    Number(shipment.deliveryFee) + Number(shipment.codAmount || 0);
  const merchantInvoiceNumber = shipmentId;

  // --- Option A: Cash on Delivery (COD) ---
  if (method === "COD") {
    const payment = await prisma.payment.upsert({
      where: {
        shipmentId: shipmentId,
      },
      update: {
        method: "COD",
        amount: totalAmount,
        status: PaymentStatus.UNPAID,
        invoiceNumber: merchantInvoiceNumber,
        merchantInvoiceNumber,
        paymentReference: shipment.customer.email,
      },
      create: {
        shipmentId,
        amount: totalAmount,
        method: "COD",
        status: PaymentStatus.UNPAID,
        invoiceNumber: merchantInvoiceNumber,
        merchantInvoiceNumber,
        paymentReference: shipment.customer.email,
      },
    });

    return {
      message: "Payment method set to Cash on Delivery successfully!",
      payment,
    };
  }

  // --- Option B: bKash Online Checkout ---
  const idToken = await getBkashIdToken();

  const bkashCreateRes = await fetch(
    `${config.bkash_base_url}/tokenized/checkout/create`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        authorization: idToken as string,
        "x-app-key": config.bkash_app_key as string,
      },
      body: JSON.stringify({
        mode: "0011",
        payerReference: shipment.customer.email || "Coloship Customer",
        callbackURL: `${config.bkash_callback_url}/payments/bkash/callback`,
        amount: totalAmount.toFixed(2),
        currency: "BDT",
        intent: "sale",
        merchantInvoiceNumber,
      }),
    },
  );

  const bkashData = await bkashCreateRes.json();

  if (!bkashCreateRes.ok || bkashData.statusCode !== "0000") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      bkashData?.statusMessage || "bKash payment creation failed",
    );
  }

  // ১. JSON Gateway Response Safe Format
  const safeGatewayResponse = bkashData
    ? (JSON.parse(JSON.stringify(bkashData)) as Prisma.InputJsonValue)
    : Prisma.JsonNull;

  // ২. Schema Compliant Upsert Operation
  const payment = await prisma.payment.upsert({
    where: {
      shipmentId: shipmentId,
    },
    update: {
      method: PaymentMethod.BKASH,
      amount: totalAmount,
      status: PaymentStatus.UNPAID,
      merchantInvoiceNumber,
      bkashPaymentId: bkashData.paymentID,
      paymentUrl: bkashData.bkashURL,
      payerReference: shipment.customer.email || "N/A",
      gatewayResponse: safeGatewayResponse,
    },
    create: {
      shipmentId: shipmentId,
      amount: totalAmount,
      method: PaymentMethod.BKASH,
      status: PaymentStatus.UNPAID,
      merchantInvoiceNumber,
      bkashPaymentId: bkashData.paymentID,
      paymentUrl: bkashData.bkashURL,
      payerReference: shipment.customer.email || "N/A",
      gatewayResponse: safeGatewayResponse,
    },
  });

  return {
    paymentUrl: bkashData.bkashURL,
    bkashPaymentId: bkashData.paymentID,
    payment,
  };
};

// bKash Callback Execution Logic
const handleBkashCallback = async (paymentID: string, status: string) => {
  const payment = await prisma.payment.findFirst({
    where: {
      bkashPaymentId: paymentID,
    },
    include: {
      shipment: true,
    },
  });

  if (!payment) {
    throw new AppError(httpStatus.NOT_FOUND, "Payment record not found!");
  }

  // Customer cancelled / payment failed
  if (status !== "success") {
    const updatedStatus =
      status === "cancel" ? PaymentStatus.CANCELED : PaymentStatus.FAILED;

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: updatedStatus },
    });

    return {
      status: updatedStatus,
      message: "Payment was not completed.",
    };
  }

  // Get bKash Token
  const bkashIdToken = await getBkashIdToken();

  if (!bkashIdToken) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "No bKash access token found",
    );
  }

  // Execute Payment
  const executePaymentResponse = await fetch(
    `${config.bkash_base_url}/tokenized/checkout/execute`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: bkashIdToken,
        "X-App-Key": config.bkash_app_key as string,
      },
      body: JSON.stringify({ paymentID }),
    },
  );

  const executePaymentResult = await executePaymentResponse.json();

  // bKash execution failed
  if (
    !executePaymentResponse.ok ||
    executePaymentResult.statusCode !== "0000"
  ) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.FAILED,
        gatewayResponse: executePaymentResult,
      },
    });

    return {
      status: PaymentStatus.FAILED,
      message: "Payment execution failed.",
    };
  }

  // Payment Successful (Database Update with Correct Field Names)
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: PaymentStatus.PAID,
      bkashTrxId: executePaymentResult.trxID, // bakshTrxId টাইপো ঠিক করা হয়েছে
      paidAt:
        executePaymentResult.paymentExecuteTime || new Date().toISOString(),
      gatewayResponse: executePaymentResult,
    },
  });

  return {
    status: PaymentStatus.PAID,
    message: "Payment completed successfully.",
    transactionId: executePaymentResult.trxID,
  };
};

const refundPayment = async (shipmentId: string, refundReason: string) => {
  const payment = await prisma.payment.findUnique({
    where: { shipmentId },
    include: { shipment: true },
  });

  if (!payment) {
    throw new AppError(httpStatus.NOT_FOUND, "Payment record not found!");
  }

  if (payment.status !== PaymentStatus.PAID) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Only completed (PAID) payments can be refunded!",
    );
  }

  // check the shipment time
  const shipmentCreatedAt = new Date(payment.shipment.createdAt).getTime();
  const currentTime = new Date().getTime();
  const twoHoursInMilliseconds = 2 * 60 * 60 * 1000; // 2 hours = 7,200,000 ms

  if (currentTime - shipmentCreatedAt > twoHoursInMilliseconds) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Refund period expired! Refund requests must be made within 2 hours of shipment creation.",
    );
  }

  if (!payment.bkashPaymentId || !payment.bkashTrxId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "bKash Payment ID or Transaction ID is missing!",
    );
  }

  // call bkash api
  const refundResponse = await refundBkashPayment({
    paymentID: payment.bkashPaymentId,
    trxID: payment.bkashTrxId,
    amount: Number(payment.amount).toFixed(2),
    reason: refundReason,
  });

  if (refundResponse.statusCode !== "0000") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      refundResponse.statusMessage || "bKash refund failed!",
    );
  }

  // update the database
  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: PaymentStatus.REFUNDED,
      refundTrxId: refundResponse.refundTrxID,
      refundAmount: payment.amount,
      refundReason: refundReason,
      refundedAt: new Date().toISOString(),
      gatewayResponse: JSON.parse(JSON.stringify(refundResponse)),
    },
  });

  return {
    message: "Payment refunded successfully!",
    refundTrxId: refundResponse.refundTrxID,
    payment: updatedPayment,
  };
};

export const PaymentService = {
  initiatePayment,
  handleBkashCallback,
  refundPayment,
};
