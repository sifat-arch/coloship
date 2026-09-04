import { Request, Response } from "express";
import httpStatus from "http-status";

import { AddressService } from "./address.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

const createAddress = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId; // Attaching from auth middleware
  const result = await AddressService.createAddress(userId as string, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Address created successfully!",
    data: result,
  });
});

export const AddressController = {
  createAddress,
};
