import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { AuthController } from "./auth.controller";

import { validateRequest } from "../../middleware/validateRequest";
import { UserValidation } from "./auth.validition";
import { upload } from "../../lib/multer";
import { CourierController } from "../courier/courier.controller";

const router = Router();

router.post(
  "/register",
  validateRequest(UserValidation.registerCustomerSchema),
  AuthController.registerCustomer,
);
router.post(
  "/login",
  validateRequest(UserValidation.loginCustomerSchema),
  AuthController.loginUser,
);
router.get(
  "/me",
  auth(Role.ADMIN, Role.COURIER, Role.CUSTOMER),
  AuthController.getMe,
);
router.post("/refresh-token", AuthController.refreshToken);

router.post("/google", AuthController.googleLogin);

router.post(
  "/register-courier",
  auth(),
  upload.fields([
    {
      name: "resume",
      maxCount: 1,
    },
    {
      name: "profileImage",
      maxCount: 1,
    },
  ]),
  AuthController.applyAsCourier,
);

router.post(
  "/forgot-password",
  validateRequest(UserValidation.forgotPasswordSchema),
  AuthController.forgotPassword,
);

router.post(
  "/reset-password",
  validateRequest(UserValidation.resetPasswordValidationSchema),
  AuthController.resetPassword,
);

router.post(
  "/verify-customer-email",
  validateRequest(UserValidation.verifyCustomerEmailValidationSchema),
  AuthController.verifyCustomerEmail,
);
router.post("/logout", AuthController.logout);
export const AuthRoutes = router;
