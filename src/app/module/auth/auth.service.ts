import bcrypt from "bcryptjs";
import type { JwtPayload, SignOptions } from "jsonwebtoken";
import {
  AuthProvider,
  Role,
  UserStatus,
} from "../../../generated/prisma/enums";
import config from "../../config";
import { prisma } from "../../lib/prisma";
import { jwtUtils } from "../../utils/jwt";
import httpStatus from "http-status";
import type {
  IForgotPasswordPayload,
  IGoogleLoginIdTokenPayload,
  ILoginUserPayload,
  IRegisterCourierPayload,
  IRegisterCustomerPayload,
  IRequestUser,
  IResetPasswordPayload,
} from "./auth.interface";
import { AppError } from "../../utils/AppError";
import { OAuth2Client, TokenPayload } from "google-auth-library";
import { googleClient } from "../../lib/googleAuth";
import { redisClient } from "../../lib/redis";
import crypto from "crypto";
import { transporter } from "../../lib/nodemailer";
import ejs from "ejs";
import path from "path";

// const registerPatient = async (payload: IRegisterPatientPayload) => {
// 	const { name, password } = payload;
// 	const email = payload.email.trim().toLowerCase();

// 	const isUserExists = await prisma.user.findUnique({
// 		where: { email },
// 	});

// 	if (isUserExists) {
// 		throw new Error("User with this email already exists");
// 	}

// 	const hashedPassword = await bcrypt.hash(password, 8);

// 	const createdUser = await prisma.user.create({
// 		data: {
// 			name,
// 			email,
// 			password: hashedPassword,
// 			role: Role.CUSTOMER,
// 			status: UserStatus.ACTIVE,
// 			emailVerified: false,
// 			patient: {
// 				create: { name, email },
// 			},
// 		},
// 		omit: { password: true },
// 		include: { patient: true },
// 	});

// 	const { patient, ...user } = createdUser;
// 	const jwtPayload = {
// 		userId: user.id,
// 		name: user.name,
// 		email: user.email,
// 		role: user.role,
// 	};

// 	const accessToken = jwtUtils.createToken(
// 		jwtPayload,
// 		config.jwt_access_secret,
// 		config.jwt_access_expires_in as SignOptions,
// 	);

// 	const refreshToken = jwtUtils.createToken(
// 		jwtPayload,
// 		config.jwt_refresh_secret,
// 		config.jwt_refresh_expires_in as SignOptions,
// 	);

// 	return {
// 		user,
// 		patient,
// 		accessToken,
// 		refreshToken,
// 	};
// };

const registerCustomer = async (payload: IRegisterCustomerPayload) => {
  const { name, password } = payload;
  const email = payload.email.trim().toLowerCase();

  // Check existing user
  const isUserExists = await prisma.user.findUnique({
    where: { email },
  });

  if (isUserExists) {
    throw new AppError(
      httpStatus.CONFLICT,
      "User with this email already exists",
    );
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 8);
  // create otp
  const otpkey = `customer-registration-otp:${email}`;
  const otpValue = crypto.randomInt(100000, 1000000).toString();

  await redisClient.set(otpkey, otpValue, {
    expiration: {
      type: "EX",
      value: 300,
    },
  });

  // create customer and set in redis

  const redisUserDataPayload = {
    name,
    email,
    password: hashedPassword,
  };

  const customerRegistrationKey = `customer-registration-data:${email}`;

  await redisClient.set(
    customerRegistrationKey,
    JSON.stringify(redisUserDataPayload),
    {
      expiration: {
        type: "EX",
        value: 300,
      },
    },
  );

  const templatePath = path.join(
    process.cwd(),
    "src/app/templates/registration-user-otp.ejs",
  );

  const templateData = {
    name,
    email,
    otpValue,
    expirationMinutes: (5 * 60) / 60,
  };

  const html = await ejs.renderFile(templatePath, templateData);

  await transporter.sendMail({
    from: config.email_sender,
    to: email,
    subject: "Email Verification",
    html,
  });

  /***
   *   // Create user
  const createdUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: Role.CUSTOMER,
      status: UserStatus.ACTIVE,
      emailVerified: false,
    },
    omit: {
      password: true,
    },
  });

  // JWT payload
  const jwtPayload = {
    userId: createdUser.id,
    name: createdUser.name,
    email: createdUser.email,
    role: createdUser.role,
  };

  // Create access token
  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions,
  );

  // Create refresh token
  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions,
  );

  return {
    user: createdUser,
    accessToken,
    refreshToken,
  };
   */
};

const loginUser = async (payload: ILoginUserPayload) => {
  const { password } = payload;
  const email = payload.email.trim().toLowerCase();

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // Check deleted user
  if (user.isDeleted) {
    throw new AppError(httpStatus.FORBIDDEN, "User account has been deleted");
  }

  // Check blocked user
  if (user.status === UserStatus.BLOCKED) {
    throw new AppError(httpStatus.FORBIDDEN, "User account is blocked");
  }

  // Google-authenticated user may not have a password
  if (!user.password) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This account uses Google authentication. Please login with Google.",
    );
  }

  // Check password
  const isPasswordMatched = await bcrypt.compare(
    password,
    user.password as string,
  );

  if (!isPasswordMatched) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Invalid email or password");
  }

  // JWT payload
  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  // Access token
  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions,
  );

  // Refresh token
  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions,
  );

  return {
    accessToken,
    refreshToken,
  };
};

const getMe = async (user: IRequestUser) => {
  const isUserExists = await prisma.user.findUnique({
    where: {
      id: user.userId,
    },
    omit: {
      password: true,
    },
  });

  if (!isUserExists) {
    throw new Error("User not found");
  }

  return isUserExists;
};

const refreshToken = async (token: string) => {
  const verifiedRefreshToken = jwtUtils.verifyToken(
    token,
    config.jwt_refresh_secret,
  );

  if (!verifiedRefreshToken.success || !verifiedRefreshToken.data) {
    throw new Error(
      config.node_env === "development"
        ? verifiedRefreshToken.error
        : "Invalid refresh token",
    );
  }

  const data = verifiedRefreshToken.data as JwtPayload;

  const user = await prisma.user.findUnique({
    where: { id: data.userId },
  });

  if (!user || user.isDeleted || user.status !== UserStatus.ACTIVE) {
    throw new Error("User is inactive or not found");
  }

  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions,
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions,
  );

  return {
    accessToken,
    refreshToken,
  };
};

const googleLogin = async (payload: IGoogleLoginIdTokenPayload) => {
  let googleIdTokenPayload: TokenPayload | null | undefined = null;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: payload.idToken,
      audience: config.google_client_id,
    });

    googleIdTokenPayload = ticket.getPayload();
  } catch (error) {
    console.log("google id token verification failed", error);
    throw new AppError(httpStatus.BAD_REQUEST, "invalid or expired id token");
  }

  if (!googleIdTokenPayload) {
    throw new AppError(httpStatus.BAD_REQUEST, "invalid or expired id token");
  }

  if (!googleIdTokenPayload.email) {
    throw new AppError(httpStatus.BAD_REQUEST, "google email not found");
  }
  if (!googleIdTokenPayload.name) {
    throw new AppError(httpStatus.BAD_REQUEST, "google name not found");
  }

  const isCustomerExistWithGoogleAuth = await prisma.user.findUnique({
    where: {
      email: googleIdTokenPayload.email,
      role: Role.CUSTOMER,
      googleId: googleIdTokenPayload.sub,
    },
  });

  let user = isCustomerExistWithGoogleAuth;

  if (!isCustomerExistWithGoogleAuth) {
    const ifCustomerExistWithCredentials = await prisma.user.findUnique({
      where: {
        email: googleIdTokenPayload.email,
        role: Role.CUSTOMER,
        authProvider: AuthProvider.CREDENTIAL,
      },
    });

    if (ifCustomerExistWithCredentials) {
      if (ifCustomerExistWithCredentials.status === UserStatus.BLOCKED) {
        throw new AppError(httpStatus.NOT_FOUND, "User is blocked");
      }

      if (!ifCustomerExistWithCredentials.emailVerified) {
        throw new AppError(httpStatus.NOT_FOUND, "Email is not verified");
      }

      if (
        ifCustomerExistWithCredentials.isDeleted ||
        ifCustomerExistWithCredentials.status === UserStatus.SUSPENDED
      ) {
        throw new AppError(httpStatus.NOT_FOUND, "User is Deleted");
      }

      user = await prisma.user.update({
        where: {
          id: ifCustomerExistWithCredentials.id,
        },
        data: {
          googleId: googleIdTokenPayload.sub,
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          name: googleIdTokenPayload.name,
          email: googleIdTokenPayload.email,
          role: Role.CUSTOMER,
          authProvider: AuthProvider.CREDENTIAL,
          emailVerified: true,
        },
      });
    }
  }

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "user not found");
  }

  if (user.status === UserStatus.BLOCKED) {
    throw new AppError(httpStatus.NOT_FOUND, "User is blocked");
  }

  if (user.status === UserStatus.SUSPENDED) {
    throw new AppError(httpStatus.NOT_FOUND, "Email is suspended");
  }

  // if (
  //   ifCustomerExistWithCredentials.isDeleted ||
  //   ifCustomerExistWithCredentials.status === UserStatus.SUSPENDED
  // ) {
  //   throw new AppError(httpStatus.NOT_FOUND, "User is Deleted");
  // }

  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions,
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions,
  );

  return {
    accessToken,
    refreshToken,
  };
};

const registerCourier = async (payload: IRegisterCourierPayload) => {
  const {
    name,
    password,
    phone,
    nidNumber,
    vehicleType,
    vehicleNumber,
    licenseNumber,
    profileImageUrl,
  } = payload;

  const email = payload.email.trim().toLowerCase();

  // 1. Check existing user
  const isUserExists = await prisma.user.findUnique({
    where: { email },
  });

  if (isUserExists) {
    throw new AppError(
      httpStatus.CONFLICT,
      "User with this email already exists",
    );
  }

  // 2. Hash password
  const hashedPassword = await bcrypt.hash(password, 8);

  // 3. Prisma Transaction to create User & CourierProfile atomically
  const result = await prisma.$transaction(async (tx) => {
    // Create User (Status can be PENDING until Admin approves)
    const createdUser = await tx.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: Role.COURIER,
        status: UserStatus.PENDING, // Admin approval needed
        emailVerified: false,
      },
      omit: {
        password: true,
      },
    });

    // Create Courier Profile
    const createdCourierProfile = await tx.courierProfile.create({
      data: {
        userId: createdUser.id,
        phone,
        nidNumber,
        vehicleType,
        vehicleNumber,
        licenseNumber,
        profileImageUrl,
        isAvailable: false,
      },
    });

    return {
      user: createdUser,
      courierProfile: createdCourierProfile,
    };
  });

  // Optional: Approval ছাড়াও রেজিস্ট্রেশনের পরেই অটো-লগইন করাতে চাইলে JWT টোকেন জেনারেট করতে পারেন
  const jwtPayload = {
    userId: result.user.id,
    name: result.user.name,
    email: result.user.email,
    role: result.user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions,
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions,
  );

  return {
    user: result.user,
    courierProfile: result.courierProfile,
    accessToken,
    refreshToken,
  };
};

const forgotPassword = async (payload: IForgotPasswordPayload) => {
  const { email } = payload;

  const isUserExist = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!isUserExist) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found!");
  }

  if (isUserExist.status === UserStatus.BLOCKED) {
    throw new AppError(httpStatus.FORBIDDEN, "User account is blocked!");
  }

  // if (!isUserExist.emailVerified) {
  //   throw new AppError(httpStatus.BAD_REQUEST, "User email is not verified!");
  // }

  if (isUserExist.isDeleted) {
    throw new AppError(httpStatus.BAD_REQUEST, "User account is deleted!");
  }

  // Google Auth সম্পর্কিত চেক
  if (isUserExist.authProvider === "GOOGLE" || isUserExist.googleId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This account was created using Google login. Password reset is not available.",
    );
  }

  const otp = crypto.randomInt(100000, 1000000).toString();

  const key = `forgot-password-otp:${isUserExist.email}`;

  await redisClient.set(key, otp, {
    EX: 300, // 5 minutes = 300 seconds
  });

  const templatePath = path.join(
    process.cwd(),
    "src/app/templates/forgot-password.ejs",
  );

  const html = await ejs.renderFile(templatePath, {
    name: isUserExist.name,
    otp,
    expirationMinutes: (5 * 60) / 60,
  });

  await transporter.sendMail({
    from: config.email_sender,
    to: isUserExist.email,
    subject: "Forgot Password",
    html,
  });
};
const resetPassword = async (payload: IResetPasswordPayload) => {
  const { email, otp, newPassword } = payload;

  const isUserExist = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!isUserExist) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found!");
  }

  if (isUserExist.status === UserStatus.BLOCKED) {
    throw new AppError(httpStatus.FORBIDDEN, "User account is blocked!");
  }

  // if (!isUserExist.emailVerified) {
  //   throw new AppError(httpStatus.BAD_REQUEST, "User email is not verified!");
  // }

  if (isUserExist.isDeleted) {
    throw new AppError(httpStatus.BAD_REQUEST, "User account is deleted!");
  }

  // Google Auth
  if (isUserExist.authProvider === "GOOGLE" || isUserExist.googleId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This account was created using Google login. Password reset is not available.",
    );
  }

  const key = `forgot-password-otp:${isUserExist.email}`;

  console.log("RESET EMAIL:", JSON.stringify(isUserExist.email));
  console.log("RESET KEY:", JSON.stringify(key));

  const ttl = await redisClient.ttl(key);
  console.log("RESET TTL:", ttl);

  const redisOtp = await redisClient.get(key);
  console.log("RESET OTP:", redisOtp);

  // const redisOtp = await redisClient.get(key);

  if (!redisOtp) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "OTP has expired or is invalid!",
    );
  }

  if (redisOtp !== otp) {
    throw new AppError(httpStatus.BAD_REQUEST, "OTP does not match!");
  }

  const hashedNewPassword = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt_rounds),
  );

  await prisma.user.update({
    where: {
      email: isUserExist.email,
    },
    data: {
      password: hashedNewPassword,
    },
  });

  await redisClient.del([key]);
  const templatePath = path.join(
    process.cwd(),
    "src/app/templates/reset-password.ejs",
  );

  const html = await ejs.renderFile(templatePath, {
    name: isUserExist.name || "User",
    email: isUserExist.email,
  });
  await transporter.sendMail({
    from: config.email_sender,
    to: isUserExist.email,
    subject: "password changed",
    html,
  });
};

export const AuthService = {
  registerCustomer,
  loginUser,
  getMe,
  refreshToken,
  googleLogin,
  registerCourier,
  forgotPassword,
  resetPassword,
};
