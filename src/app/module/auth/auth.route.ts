import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { validateRequest } from "../../middleware/validateRequest";
import { UserValidation } from "./auth.validition";

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

router.post("/google", AuthService.googleLogin);

router.post(
  "/register-courier",
  // upload.single("profileImage"),
  validateRequest(UserValidation.registerCourierValidationSchema),
  AuthController.registerCourier,
);

router.post(
  "/forgot-password",
  validateRequest(UserValidation.forgotPasswordSchema),
  AuthController.forgotPassword,
);
export const AuthRoutes = router;