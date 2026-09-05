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

export const AdminController = {
  assignCourierToShipment,
};
