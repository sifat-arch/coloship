import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { NotificationService } from "./notification.service";

const getUserNotifications = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const result = await NotificationService.getUserNotifications(
    userId as string,
    req.query,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notifications retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getUnreadNotificationCount = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const result = await NotificationService.getUnreadNotificationCount(
      userId as string,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Unread notification count retrieved successfully",
      data: result,
    });
  },
);

const markNotificationAsRead = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId;

    const result = await NotificationService.markNotificationAsRead(
      id as string,
      userId as string,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Notification marked as read successfully",
      data: result,
    });
  },
);

const markAllNotificationsAsRead = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    const result = await NotificationService.markAllNotificationsAsRead(
      userId as string,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "All notifications marked as read successfully",
      data: result,
    });
  },
);

export const NotificationController = {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};
