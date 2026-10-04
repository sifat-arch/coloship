import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import type { IRequestUser } from "./auth.interface";
import { AuthService } from "./auth.service";
import { AppError } from "../../utils/AppError";
import config from "../../config";
import { applyCourierValidationSchema } from "./auth.validition";

const registerCustomer = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  await AuthService.registerCustomer(payload);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Customer registered successfully",
    data: null,
  });
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  const result = await AuthService.loginUser(payload);

  const { accessToken, refreshToken } = result;

  // Access token
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: config.node_env === "development" ? false : true,
    sameSite: config.node_env === "development" ? "lax" : "none",
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  });

  // Refresh token
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: config.node_env === "development" ? false : true,
    sameSite: config.node_env === "development" ? "lax" : "none",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User logged in successfully",
    data: {
      accessToken,
      refreshToken,
    },
  });
});

const verifyCustomerEmail = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  const result = await AuthService.verifyCustomerEmail(payload);

  const { accessToken, refreshToken, user } = result;

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: config.node_env === "development" ? false : true,
    sameSite: config.node_env === "development" ? "lax" : "none",
    maxAge: 1000 * 60 * 60 * 24, // 24 hour or 1 day
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: config.node_env === "development" ? false : true,
    sameSite: config.node_env === "development" ? "lax" : "none",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Email Verified successfully",
    data: {
      accessToken,
      refreshToken,
      user,
    },
  });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;

  if (!user) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "User information is missing in the request",
    );
  }

  const result = await AuthService.getMe(user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User profile fetched successfully",
    data: result,
  });
});
const refreshToken = catchAsync(async (req: Request, res: Response) => {
  if (!req.cookies.refreshToken) {
    throw new Error("Refresh token is missing");
  }
  const result = await AuthService.refreshToken(req.cookies.refreshToken);
  const { accessToken, refreshToken: newRefreshToken } = result;

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: config.node_env === "development" ? false : true,
    sameSite: config.node_env === "development" ? "lax" : "none",
    maxAge: 1000 * 60 * 60 * 24, // 24 hour or 1 day
  });
  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: config.node_env === "development" ? false : true,
    sameSite: config.node_env === "development" ? "lax" : "none",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "New tokens generated successfully",
    data: {
      accessToken,
      refreshToken: newRefreshToken,
    },
  });
});

const googleLogin = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  console.log("gogole id token", payload);

  const { accessToken, refreshToken } = await AuthService.googleLogin(payload);

  // Access token
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: config.node_env === "production",
    sameSite: config.node_env === "production" ? "none" : "lax",
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  });

  // Refresh token
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: config.node_env === "production",
    sameSite: config.node_env === "production" ? "none" : "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "New tokens generated successfully",
    data: {
      accessToken,
      refreshToken,
    },
  });
});

const applyAsCourier = catchAsync(async (req: Request, res: Response) => {
  console.log("BODY:", req.body);
  console.log("FILES:", req.files);

  const files = req.files as {
    [fieldname: string]: Express.Multer.File[];
  };

  const resume = files?.["resume"]?.[0] ?? null;
  const profileImage = files?.["profileImage"]?.[0] ?? null;

  const zodValidationResult = applyCourierValidationSchema.safeParse(
    JSON.parse(req.body.data),
  );

  if (!zodValidationResult.success) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      zodValidationResult.error.issues[0].message,
    );
  }

  const payload = zodValidationResult.data;
  const userId = req.user?.userId;

  const result = await AuthService.applyAsCourier(
    userId as string,
    payload,
    resume,
    profileImage,
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Applied as courier successfully",
    data: result,
  });
});
const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.forgotPassword(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password reset OTP sent successfully.",
    data: null,
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.resetPassword(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message:
      "Password reset successful! You can now login with your new password.",
    data: null,
  });
});
const logout = catchAsync(async (req: Request, res: Response) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User logged out successfully",
    data: null,
  });
});

export const AuthController = {
  registerCustomer,
  loginUser,
  getMe,
  refreshToken,
  googleLogin,
  applyAsCourier,
  forgotPassword,
  resetPassword,
  verifyCustomerEmail,
  logout,
};
