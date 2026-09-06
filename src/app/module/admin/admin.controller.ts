import { Request, Response } from "express";
import httpStatus from "http-status";

import { AdminService } from "./admin.service";
import { sendResponse } from "../../utils/sendResponse";
import { catchAsync } from "../../utils/catchAsync";

const assignCourierToShipment = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { courierProfileId } = req.body;

    const result = await AdminService.assignCourierToShipment(
      id as string,
      courierProfileId,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Courier assigned to shipment successfully!",
      data: result,
    });
  },
);

const getAllUsersController = catchAsync(
  async (req: Request, res: Response) => {
    const result = await AdminService.getAllUsers(req.query);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Users retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  },
);

const getAllCouriersController = catchAsync(
  async (req: Request, res: Response) => {
    const result = await AdminService.getAllCouriers(req.query);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Couriers retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  },
);

const getAvailableCouriersController = catchAsync(
  async (req: Request, res: Response) => {
    const result = await AdminService.getAvailableCouriers(req.query);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Available couriers retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  },
);

export const AdminController = {
  assignCourierToShipment,
  getAllCouriersController,
  getAllUsersController,
  getAvailableCouriersController,
};
