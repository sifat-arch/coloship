import express from "express";

import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { upload } from "../../lib/multer";
import { UserController } from "./user.controller";
// import { UserController } from "./user.controller";
// import { upload } from "../../middlewares/upload";

const router = express.Router();

router.patch(
  "/profile-image",
  auth(Role.CUSTOMER, Role.ADMIN, Role.COURIER),
  upload.single("profile-image"),
  UserController.uploadProfileImage,
);

export const UserRoutes = router;
