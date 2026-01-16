import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import { promisify } from 'util';
import stream from 'stream';
import { Types } from 'mongoose';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_API_NAME,
  api_key: process.env.CLOUDINARY_API,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


// Create uploads directory if it doesn't exist
// const uploadDir = path.join(__dirname, '../../uploads');
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
// }

const isVercel = process.env.VERCEL || process.env.NODE_ENV === 'production';

// Configure multer for file upload
const storage = isVercel 
  ? multer.memoryStorage()  // For Vercel - no file system access
  : multer.diskStorage({
      destination: (req, file, cb) => {
        // Only create directory locally
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
      }
    });

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-flv',
      'video/webm',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, videos, audio and documents are allowed.'));
    }
  }
}).single('file');

const uploadAsync = promisify(upload);

// Helper function to generate thumbnail for videos
async function generateVideoThumbnail(videoPath: string): Promise<string | null> {
  try {
    // Using ffmpeg via fluent-ffmpeg would be better here
    // For now, we'll just return null and handle it client-side
    return null;
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    return null;
  }
}

// Helper function to get file type category
function getFileCategory(mimetype: string): string {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  return 'document';
}

export const uploadMedia = async (req: AuthRequest, res: Response) => {
  try {
    // Handle file upload
    await uploadAsync(req, res);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const userId = req.user._id.toString();
    const filePath = req.file.path;
    const originalName = req.file.originalname;
    const fileSize = req.file.size;
    const mimetype = req.file.mimetype;
    const fileCategory = getFileCategory(mimetype);

    let secureUrl: string;
    let thumbnailUrl: string | null = null;
    let publicId: string;

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(filePath, {
      folder: `chat_media/${userId}`,
      resource_type: fileCategory === 'video' ? 'video' : 'image',
      transformation: fileCategory === 'image' ? [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ] : undefined,
      timeout: 60000
    });

    secureUrl = uploadResult.secure_url;
    publicId = uploadResult.public_id;

    // Generate thumbnail for videos
    if (fileCategory === 'video') {
      try {
        const videoThumbnail = cloudinary.url(publicId, {
          transformation: [
            { width: 400, height: 400, crop: 'fill' },
            { quality: 'auto' },
            { format: 'jpg' }
          ]
        });
        thumbnailUrl = videoThumbnail;
      } catch (error) {
        console.error('Error generating video thumbnail:', error);
      }
    }

    // Delete temporary file
    fs.unlink(filePath, (err) => {
      if (err) console.error('Error deleting temp file:', err);
    });

    res.status(200).json({
      success: true,
      data: {
        url: secureUrl,
        publicId,
        fileName: originalName,
        fileSize,
        fileType: mimetype,
        fileCategory,
        thumbnailUrl,
        uploadedAt: new Date().toISOString()
      },
      message: 'File uploaded successfully'
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    
    // Clean up temp file if exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlink(req.file.path, () => {});
    }

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to upload file'
    });
  }
};

// Get signed URL for direct upload
export const getSignedUrl = async (req: AuthRequest, res: Response) => {
  try {
    const { fileName, fileType, fileSize } = req.body;
    const userId = req.user._id.toString();
    
    if (!fileName || !fileType) {
      return res.status(400).json({
        success: false,
        message: 'File name and type are required'
      });
    }

    // Generate unique file name
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const uniqueFileName = `${timestamp}-${randomString}-${fileName}`;
    
    // For Cloudinary direct upload
    const timestampForSignature = Math.round(Date.now() / 1000);
    const params = {
      timestamp: timestampForSignature,
      folder: `chat_media/${userId}`,
      public_id: uniqueFileName.split('.')[0]
    };

    const signature = cloudinary.utils.api_sign_request(
      params,
      process.env.CLOUDINARY_API_SECRET!
    );

    res.status(200).json({
      success: true,
      data: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        signature,
        timestamp: params.timestamp,
        folder: params.folder,
        publicId: params.public_id,
        fileName: uniqueFileName,
        uploadUrl: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/${
          fileType.startsWith('video') ? 'video' : 'image'
        }/upload`
      }
    });

  } catch (error: any) {
    console.error('Get signed URL error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get signed URL'
    });
  }
};

/// Delete uploaded media
export const deleteMedia = async (req: AuthRequest, res: Response) => {
  try {
    const { publicId } = req.params;
    
    // Ensure publicId is a string (take the first if it's an array)
    const publicIdString = Array.isArray(publicId) ? publicId[0] : publicId;
    
    if (!publicIdString) {
      return res.status(400).json({
        success: false,
        message: 'Public ID is required'
      });
    }

    const result = await cloudinary.uploader.destroy(publicIdString);
    
    res.status(200).json({
      success: result.result === 'ok',
      message: result.result === 'ok' ? 'File deleted successfully' : 'Failed to delete file'
    });

  } catch (error: any) {
    console.error('Delete media error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete file'
    });
  }
};