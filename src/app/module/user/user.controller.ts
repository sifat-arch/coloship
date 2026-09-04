import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import httpStatus from "http-status";
import { sendResponse } from "../../utils/sendResponse";
import { UserServices } from "./user.service";

const uploadProfileImage = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!req.file) {
    throw new Error("No file found");
  }

  const result = await UserServices.uploadProfileImage(
    req.file?.buffer,
    userId as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "new token generated successfully",
    data: result,
  });
});

export const UserController = {
  uploadProfileImage,
};
