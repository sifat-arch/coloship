import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { NotificationType, Role } from "../../../generated/prisma/enums";
import {
  TCreateNotificationPayload,
  TNotificationFilter,
} from "./notification.interface";

const getUserNotifications = async (
  userId: string,
  query: TNotificationFilter,
) => {
  const page = query.page ? Number(query.page) : 1;
  const limit = query.limit ? Number(query.limit) : 10;
  const skip = (page - 1) * limit;

  const whereConditions: Record<string, any> = {
    userId,
  };

  if (query.isRead !== undefined) {
    whereConditions.isRead = query.isRead === "true";
  }

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.notification.count({
      where: whereConditions,
    }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: notifications,
  };
};

const getUnreadNotificationCount = async (userId: string) => {
  const unreadCount = await prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });

  return { unreadCount };
};

const markNotificationAsRead = async (id: string, userId: string) => {
  const notification = await prisma.notification.findUnique({
    where: { id },
  });

  if (!notification) {
    throw new AppError(httpStatus.NOT_FOUND, "Notification not found!");
  }

  if (notification.userId !== userId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You do not have permission to view or update this notification!",
    );
  }

  return await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });
};

const markAllNotificationsAsRead = async (userId: string) => {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  return { count: result.count };
};

const createNotification = async (payload: TCreateNotificationPayload) => {
  try {
    return await prisma.notification.create({
      data: {
        userId: payload.userId,
        CourierId: payload.courierId || null,
        title: payload.title,
        message: payload.message,
        type: payload.type || NotificationType.SYSTEM,
      },
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
};

const notifyAdmins = async (payload: {
  title: string;
  message: string;
  type?: NotificationType;
}) => {
  try {
    const admins = await prisma.user.findMany({
      where: { role: Role.ADMIN, isDeleted: false },
      select: { id: true },
    });
    if (!admins || admins.length === 0) return null;

    return await prisma.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        title: payload.title,
        message: payload.message,
        type: payload.type || NotificationType.SYSTEM,
      })),
    });
  } catch (error) {
    console.error("Failed to notify admins:", error);
    return null;
  }
};

export const NotificationService = {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createNotification,
  notifyAdmins,
};
