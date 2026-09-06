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
router.get(
  "/all-users",
  auth(Role.ADMIN),

  AdminController.getAllUsersController,
);
router.get(
  "/all-couriers",
  auth(Role.ADMIN),

  AdminController.getAllCouriersController,
);
router.get(
  "/available-courier",
  auth(Role.ADMIN),

  AdminController.getAvailableCouriersController,
);

router.patch(
  "/couriers/:id/approve",
  auth(Role.ADMIN),
  AdminController.approveCourierController,
);

router.patch(
  "/users/:id/status",
  auth(Role.ADMIN),
  validateRequest(AdminValidation.updateUserStatusValidationSchema),
  AdminController.updateUserStatusController,
);

export const AdminRoutes = router;
