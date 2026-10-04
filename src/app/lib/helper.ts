import { UploadApiResponse } from "cloudinary";
import { cloudinary } from "./cloulinary";
import { AppError } from "../utils/AppError";
import httpStatus from "http-status";

export const uploadFileToCloudinary = (
  file: Express.Multer.File,
  folder: string,
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: "auto",
          folder,
        },
        (error, result) => {
          if (error) return reject(error);

          if (!result) {
            return reject(
              new AppError(
                httpStatus.INTERNAL_SERVER_ERROR,
                "No result returned from Cloudinary",
              ),
            );
          }

          resolve(result);
        },
      )
      .end(file.buffer);
  });
};
