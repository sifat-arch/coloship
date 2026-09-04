import express from "express";

import { AddressController } from "./address.controller";
import { AddressValidation } from "./address.validation";

import { validateRequest } from "../../middleware/validateRequest";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";

const router = express.Router();

router.post(
  "/",
  auth(Role.CUSTOMER), // Authenticated user check
  validateRequest(AddressValidation.createAddressValidationSchema),
  AddressController.createAddress,
);

export const AddressRoutes = router;
