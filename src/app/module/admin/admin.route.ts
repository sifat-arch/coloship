import express from "express";

import { AdminController } from "./admin.controller";
import { AdminValidation } from "./admin.validation";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { Role } from "../../../generated/prisma/enums";

const router = express.Router();

// 1. Shipments Management
router.get(
  "/shipments",
  auth(Role.ADMIN),
  AdminController.getAllShipmentsController,
);

// 2. Assign Courier to Shipment (Task Assign)
router.patch(
  "/shipments/:id/assign",
  auth(Role.ADMIN),
  validateRequest(AdminValidation.assignCourierValidationSchema),
  AdminController.assignCourierToShipment,
);

// 3. Unassign Courier from Shipment
router.patch(
  "/shipments/:id/unassign",
  auth(Role.ADMIN),
  AdminController.unassignCourierFromShipment,
);

// 4. Update Shipment Status (Hub Tracking Override)
router.patch(
  "/shipments/:id/status",
  auth(Role.ADMIN),
  validateRequest(AdminValidation.updateShipmentStatusValidationSchema),
  AdminController.updateShipmentStatusByAdmin,
);

// 5. User & Courier Management
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
  "/couriers/:id/reject",
  auth(Role.ADMIN),
  AdminController.rejectCourierController,
);

router.patch(
  "/users/:id/status",
  auth(Role.ADMIN),
  validateRequest(AdminValidation.updateUserStatusValidationSchema),
  AdminController.updateUserStatusController,
);

export const AdminRoutes = router;
