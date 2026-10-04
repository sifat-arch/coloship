import express from "express";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { NotificationController } from "./notification.controller";

const router = express.Router();

router.get(
  "/",
  auth(Role.CUSTOMER, Role.COURIER, Role.ADMIN),
  NotificationController.getUserNotifications,
);

router.get(
  "/unread-count",
  auth(Role.CUSTOMER, Role.COURIER, Role.ADMIN),
  NotificationController.getUnreadNotificationCount,
);

router.patch(
  "/mark-all-read",
  auth(Role.CUSTOMER, Role.COURIER, Role.ADMIN),
  NotificationController.markAllNotificationsAsRead,
);

router.patch(
  "/:id/read",
  auth(Role.CUSTOMER, Role.COURIER, Role.ADMIN),
  NotificationController.markNotificationAsRead,
);

export const NotificationRoutes = router;
