import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { CourierService } from "../courier/courier.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { PaymentService } from "./payment.service";
import { PaymentStatus } from "../../../generated/prisma/enums";
import config from "../../config";

const initiatePayment = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const result = await PaymentService.initiatePayment(
    userId as string,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payment initiated successfully!",
    data: result,
  });
});

const handleBkashCallback = catchAsync(async (req: Request, res: Response) => {
  const { paymentID, status } = req.query;

  const result = await PaymentService.handleBkashCallback(
    paymentID as string,
    status as string,
  );

  if (result.status === PaymentStatus.PAID) {
    return res.redirect(
      `${config.frontend_url}/payment/success?paymentId=${paymentID}`,
    );
  } else {
    return res.redirect(
      `${config.frontend_url}/payment/failed?paymentId=${paymentID}`,
    );
  }
});

// const handleBkashCallback = catchAsync(async (req: Request, res: Response) => {
//   console.log("🔥 BKASH CALLBACK HIT");
//   console.log("Query:", req.query);

//   const { paymentID, status } = req.query;

//   console.log("Payment ID:", paymentID);
//   console.log("Status:", status);

//   const result = await PaymentService.handleBkashCallback(
//     paymentID as string,
//     status as string,
//   );

//   console.log("Callback Service Result:", result);

//   // তোমার existing redirect logic...
// });

const refundPayment = catchAsync(async (req: Request, res: Response) => {
  const { shipmentId } = req.params;
  const { reason } = req.body;

  const result = await PaymentService.refundPayment(
    shipmentId as string,
    reason,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payment refunded successfully",
    data: result,
  });
});

export const PaymentController = {
  handleBkashCallback,
  initiatePayment,
  refundPayment,
};
