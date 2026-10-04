import { Request, Response } from "express";
import httpStatus from "http-status";

import { CourierService } from "./courier.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const result = await CourierService.getMyProfile(userId as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Courier profile retrieved successfully!",
    data: result,
  });
});

const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const result = await CourierService.updateProfile(
    userId as string,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Courier profile updated successfully!",
    data: result,
  });
});

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
  const result = await CourierService.getMyAssignments(
    userId as string,
    req.query,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Assigned shipments retrieved successfully!",
    data: result,
  });
});

const getSingleAssignment = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  const result = await CourierService.getSingleAssignment(
    id as string,
    userId as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Assignment details retrieved successfully!",
    data: result,
  });
});

const respondToAssignment = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  const result = await CourierService.respondToAssignment(
    id as string,
    userId as string,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Assignment ${req.body.action.toLowerCase()}ed successfully!`,
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

const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const result = await CourierService.getDashboardStats(userId as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Courier dashboard stats retrieved successfully!",
    data: result,
  });
});

export const CourierController = {
  getMyProfile,
  updateProfile,
  toggleAvailability,
  getMyAssignments,
  getSingleAssignment,
  respondToAssignment,
  updateAssignmentStatus,
  getDashboardStats,
};
