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

const unassignCourierFromShipment = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await AdminService.unassignCourierFromShipment(id as string);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Courier unassigned from shipment successfully!",
      data: result,
    });
  },
);

const getAllShipmentsController = catchAsync(
  async (req: Request, res: Response) => {
    const result = await AdminService.getAllShipments(req.query);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Shipments retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  },
);

const updateShipmentStatusByAdmin = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await AdminService.updateShipmentStatusByAdmin(
      id as string,
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

const approveCourierController = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await AdminService.approveCourier(id as string);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Courier account approved successfully!",
      data: result,
    });
  },
);
const rejectCourierController = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await AdminService.rejectCourier(id as string);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Courier profile rejected successfully!",
      data: result,
    });
  },
);

const updateUserStatusController = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    const result = await AdminService.updateUserStatus(id as string, status);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: `User status changed to ${status} successfully!`,
      data: result,
    });
  },
);

export const AdminController = {
  assignCourierToShipment,
  unassignCourierFromShipment,
  getAllShipmentsController,
  updateShipmentStatusByAdmin,
  getAllCouriersController,
  getAllUsersController,
  getAvailableCouriersController,
  approveCourierController,
  updateUserStatusController,
  rejectCourierController,
};
