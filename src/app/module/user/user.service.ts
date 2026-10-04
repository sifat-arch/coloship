import { UploadApiResponse } from "cloudinary";
import { UserStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { cloudinary } from "../../lib/cloulinary";
import { AppError } from "../../utils/AppError";
import httpStatus from "http-status";

const uploadProfileImage = async (buffer: Buffer, userId: string) => {
  const currentUser = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      imagePublicId: true,
      imageUrl: true,
      status: true,
    },
  });

  if (!currentUser) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (currentUser.status === UserStatus.SUSPENDED) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your account is suspended. You cannot update profile image.",
    );
  }

  if (currentUser.status === UserStatus.BLOCKED) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your account is blocked. You cannot update profile image.",
    );
  }

  const cloudinaryResult = await new Promise<UploadApiResponse>(
    (resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "auto",
          },
          async (error, result) => {
            if (error) {
              return reject(error);
            }

            if (!result) {
              throw new AppError(
                httpStatus.NOT_FOUND,
                "No result return form cloudinary",
              );
            }

            resolve(result);
          },
        )
        .end(buffer);
    },
  );

  const updateUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      imageUrl: cloudinaryResult.secure_url,
      imagePublicId: cloudinaryResult.public_id,
    },
    omit: {
      password: true,
    },
  });

  //  delete the image from cloudinary

  if (currentUser?.imagePublicId && currentUser.imageUrl) {
    await cloudinary.uploader.destroy(currentUser.imagePublicId);
  }

  return updateUser;
};

export const UserServices = {
  uploadProfileImage,
};
