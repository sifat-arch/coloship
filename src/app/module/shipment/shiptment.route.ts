import express from "express";

import { ShipmentController } from "./shipment.controller";
import { ShipmentValidation } from "./shipment.validation";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { Role } from "../../../generated/prisma/enums";

const router = express.Router();

router.post(
  "/",
  auth(Role.CUSTOMER),
  validateRequest(ShipmentValidation.createShipmentValidationSchema),
  ShipmentController.createShipment,
);

router.get(
  "/my-shipments",
  auth(Role.CUSTOMER),
  ShipmentController.getMyShipments,
);
export const ShipmentRoutes = router;
