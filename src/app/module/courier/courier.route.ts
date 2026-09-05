import express from "express";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { CourierValidation } from "./courier.validate";
import { CourierController } from "./courier.controller";

const router = express.Router();

router.patch(
  "/availability",
  auth("COURIER"),
  validateRequest(CourierValidation.toggleAvailabilityValidationSchema),
  CourierController.toggleAvailability,
);

// 1. View Assigned Tasks
router.get("/assignments", auth("COURIER"), CourierController.getMyAssignments);

// 2. Update Status (PICKED_UP / DELIVERED)
router.patch(
  "/assignments/:id/status",
  auth("COURIER"),
  validateRequest(CourierValidation.updateAssignmentStatusValidationSchema),
  CourierController.updateAssignmentStatus,
);

export const CourierRoutes = router;
