import { Request, Response } from "express";
import httpStatus from "http-status";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ShipmentService } from "./shipment.service";

const createShipment = catchAsync(async (req: Request, res: Response) => {
  const customerId = req.user?.userId;
  const result = await ShipmentService.createShipment(
    customerId as string,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Shipment booked successfully!",
    data: result,
  });
});

const getMyShipments = catchAsync(async (req: Request, res: Response) => {
  const customerId = req.user?.userId;
  const result = await ShipmentService.getMyShipments(
    customerId as string,
    req.query,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Shipments retrieved successfully!",
    meta: result.meta,
    data: result.data,
  });
});

export const ShipmentController = {
  createShipment,
  getMyShipments,
};
