import express from "express";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { CourierValidation } from "./courier.validate";
import { CourierController } from "./courier.controller";
import { Role } from "../../../generated/prisma/enums";

const router = express.Router();

// 1. Courier Profile
router.get(
  "/profile",
  auth(Role.COURIER),
  CourierController.getMyProfile,
);

router.patch(
  "/profile",
  auth(Role.COURIER),
  validateRequest(CourierValidation.updateProfileValidationSchema),
  CourierController.updateProfile,
);

// 2. Toggle Availability
router.patch(
  "/availability",
  auth(Role.COURIER),
  validateRequest(CourierValidation.toggleAvailabilityValidationSchema),
  CourierController.toggleAvailability,
);

// 3. Courier Dashboard Stats
router.get(
  "/dashboard-stats",
  auth(Role.COURIER),
  CourierController.getDashboardStats,
);

// 4. View Assigned Tasks
router.get(
  "/assignments",
  auth(Role.COURIER),
  CourierController.getMyAssignments,
);

router.get(
  "/assignments/:id",
  auth(Role.COURIER),
  CourierController.getSingleAssignment,
);

// 5. Respond to Assignment (Accept or Reject)
router.patch(
  "/assignments/:id/respond",
  auth(Role.COURIER),
  validateRequest(CourierValidation.respondAssignmentValidationSchema),
  CourierController.respondToAssignment,
);

// 6. Update Status (PICKED_UP / DELIVERED / CANCELLED / etc.)
router.patch(
  "/assignments/:id/status",
  auth(Role.COURIER),
  validateRequest(CourierValidation.updateAssignmentStatusValidationSchema),
  CourierController.updateAssignmentStatus,
);

export const CourierRoutes = router;
