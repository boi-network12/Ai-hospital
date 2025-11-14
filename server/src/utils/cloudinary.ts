// src/utils/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Initialise once with env vars
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_API_NAME,
  api_key: process.env.CLOUDINARY_API,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a Buffer / Stream to Cloudinary
 * @param fileBuffer - raw file bytes
 * @param folder - optional sub-folder (e.g. "avatars")
 * @returns Cloudinary response (url, public_id, etc.)
 */
export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  folder: string = 'avatars'
): Promise<{
  secure_url: string;
  public_id: string;
  width?: number;
  height?: number;
}> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        transformation: [
          { width: 400, height: 400, crop: 'limit' }, // max 400x400
          { quality: 'auto' },
          { fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error('Upload failed – no result'));
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
          width: result.width,
          height: result.height,
        });
      }
    );

    // Pipe buffer into stream
    const readable = new Readable();
    readable.push(fileBuffer);
    readable.push(null); // EOF
    readable.pipe(stream);
  });
};

/**
 * Delete image from Cloudinary
 */
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  await cloudinary.uploader.destroy(publicId);
};