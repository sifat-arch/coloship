import express from "express";
import { auth } from "../../middleware/checkAuth";
import { PaymentController } from "./payment.controller";

const router = express.Router();

// ১. Initiate Payment (bKash or COD)
router.post("/initiate", auth("CUSTOMER"), PaymentController.initiatePayment);

// ২. bKash Callback Endpoint (bKash Redirects Here)
router.get("/bkash/callback", PaymentController.handleBkashCallback);

router.post(
  "/refund/:shipmentId",
  auth("CUSTOMER"),
  PaymentController.refundPayment,
);

export const PaymentRoutes = router;
