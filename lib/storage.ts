import cloudinary from "./cloudinary";
import { Readable } from "stream";

export async function uploadBufferToCloudinary(
  buffer: Buffer,
  folderPath: string,
  resourceType: "image" | "video" | "raw" | "auto" = "auto",
  publicId?: string
): Promise<{ url: string; publicId: string; duration?: number; size?: number }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folderPath,
        resource_type: resourceType,
        public_id: publicId,
      },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error("No result from Cloudinary"));
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          duration: result.duration,
          size: result.bytes,
        });
      }
    );

    const readable = new Readable();
    readable._read = () => {};
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
}

export async function uploadFileToCloudinary(
  filePath: string,
  folderPath: string,
  resourceType: "image" | "video" | "raw" | "auto" = "auto",
  publicId?: string
) {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: folderPath,
    resource_type: resourceType,
    public_id: publicId,
  });
  return {
    url: result.secure_url,
    publicId: result.public_id,
    duration: result.duration,
    size: result.bytes,
  };
}

export async function uploadUrlToCloudinary(
  imageUrl: string,
  folderPath: string,
  resourceType: "image" | "video" | "raw" | "auto" = "auto",
  publicId?: string
) {
  const result = await cloudinary.uploader.upload(imageUrl, {
    folder: folderPath,
    resource_type: resourceType,
    public_id: publicId,
  });
  return {
    url: result.secure_url,
    publicId: result.public_id,
    duration: result.duration,
    size: result.bytes,
  };
}
