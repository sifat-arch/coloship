import { Request, Response } from "express";
import httpStatus from "http-status";

import { CourierService } from "./courier.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

const toggleAvailability = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { isAvailable } = req.body;

  const result = await CourierService.toggleAvailability(
    userId as string,
    isAvailable,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Courier status updated to ${result.isAvailable ? "ONLINE" : "OFFLINE"} successfully!`,
    data: result,
  });
});

const getMyAssignments = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const result = await CourierService.getMyAssignments(userId as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Assigned shipments retrieved successfully!",
    data: result,
  });
});

const updateAssignmentStatus = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId;

    const result = await CourierService.updateAssignmentStatus(
      id as string,
      userId as string,
      req.body,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: `Shipment status updated to ${req.body.status} successfully!`,
      data: result,
    });
  },
);

export const CourierController = {
  toggleAvailability,
  getMyAssignments,
  updateAssignmentStatus,
};
