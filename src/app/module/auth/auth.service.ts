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
  IGoogleLoginIdTokenPayload,
  ILoginUserPayload,
  IRegisterCourierPayload,
  IRegisterCustomerPayload,
  IRequestUser,
} from "./auth.interface";
import { AppError } from "../../utils/AppError";
import { OAuth2Client, TokenPayload } from "google-auth-library";
import { googleClient } from "../../lib/googleAuth";

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

  // Create user
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
};

// const loginUser = async (payload: ILoginUserPayload) => {
//   const { password } = payload;
//   const email = payload.email.trim().toLowerCase();

//   const user = await prisma.user.findUnique({
//     where: { email },
//   });

//   if (!user) {
//     throw new Error("User not found");
//   }

//   if (user.status === UserStatus.BLOCKED) {
//     throw new Error("User is blocked");
//   }

//   if (user.isDeleted || user.status === UserStatus.DELETED) {
//     throw new Error("User is deleted");
//   }

//   const isPasswordMatched = await bcrypt.compare(password, user.password);

//   if (!isPasswordMatched) {
//     throw new Error("Invalid credentials");
//   }

//   const jwtPayload = {
//     userId: user.id,
//     name: user.name,
//     email: user.email,
//     role: user.role,
//   };

//   const accessToken = jwtUtils.createToken(
//     jwtPayload,
//     config.jwt_access_secret,
//     config.jwt_access_expires_in as SignOptions,
//   );

//   const refreshToken = jwtUtils.createToken(
//     jwtPayload,
//     config.jwt_refresh_secret,
//     config.jwt_refresh_expires_in as SignOptions,
//   );

//   return {
//     accessToken,
//     refreshToken,
//   };
// };

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

export const AuthService = {
  registerCustomer,
  loginUser,
  getMe,
  refreshToken,
  googleLogin,
  registerCourier,
};
