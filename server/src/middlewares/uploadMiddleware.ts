// src/middlewares/uploadMiddleware.ts
import multer from 'multer';
import { Request } from 'express';

const multerMemory = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP allowed.'));
    }
  },
});

export const uploadAvatar = multerMemory.single('avatar'); 