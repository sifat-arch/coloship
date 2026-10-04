import { NotificationType } from "../../../generated/prisma/enums";

export type TNotificationFilter = {
  page?: number;
  limit?: number;
  isRead?: string;
};

export type TCreateNotificationPayload = {
  userId: string;
  courierId?: string;
  title: string;
  message: string;
  type?: NotificationType;
};
