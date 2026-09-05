import express from "express";

import { AdminController } from "./admin.controller";
import { AdminValidation } from "./admin.validation";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { Role } from "../../../generated/prisma/enums";

const router = express.Router();

// 1. Assign Courier to Shipment
router.patch(
  "/shipments/:id/assign",
  auth(Role.ADMIN),
  validateRequest(AdminValidation.assignCourierValidationSchema),
  AdminController.assignCourierToShipment,
);

export const AdminRoutes = router;
