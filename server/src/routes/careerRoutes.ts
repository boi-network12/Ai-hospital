import { Router } from 'express';
import * as careerController from '../controllers/careerController';
import { verifyToken } from '../middlewares/authMiddleware';
import { requireAdmin } from '../middlewares/adminMiddleware';
import multer from 'multer';
import { uploadToCloudinary } from '../utils/cloudinary';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

// Public routes (no authentication required)
router.post('/apply', 
  upload.fields([
    { name: 'resume', maxCount: 1 },
    { name: 'profilePicture', maxCount: 1 },
    { name: 'licenseDocument', maxCount: 1 },
    { name: 'certificates', maxCount: 5 },
  ]),
  async (req: any, res: any, next: any) => {
    try {
      // Upload files to cloud storage
      const uploadedFiles: any = {};
      
      if (req.files['resume']) {
        uploadedFiles.resumeUrl = await uploadToCloudinary(
          req.files['resume'][0].buffer,
          'career/resumes'
        );
      }
      
      if (req.files['profilePicture']) {
        uploadedFiles.profilePictureUrl = await uploadToCloudinary(
          req.files['profilePicture'][0].buffer,
          'career/profile-pictures'
        );
      }
      
      if (req.files['licenseDocument']) {
        uploadedFiles.licenseDocumentUrl = await uploadToCloudinary(
          req.files['licenseDocument'][0].buffer,
          'career/licenses'
        );
      }
      
      if (req.files['certificates']) {
        uploadedFiles.certificates = await Promise.all(
          req.files['certificates'].map(async (file: any, index: number) => {
            const url = await uploadToCloudinary(file.buffer, 'career/certificates');
            return {
              name: file.originalname,
              url,
              issuedDate: req.body[`certificates[${index}][issuedDate]`],
              expiryDate: req.body[`certificates[${index}][expiryDate]`],
            };
          })
        );
      }
      
      // Combine uploaded files with form data
      req.body = {
        ...req.body,
        ...uploadedFiles,
      };
      
      next();
    } catch (error) {
      next(error);
    }
  },
  careerController.submitApplication
);

router.get('/check-status', careerController.checkStatus);

// Admin routes (require authentication and admin role)
router.use(verifyToken, requireAdmin);

router.get('/applications', careerController.getAllApplications);
router.get('/applications/:id', careerController.getApplication);
router.patch('/applications/:id/status', careerController.updateStatus);
router.post('/applications/:id/schedule-interview', careerController.scheduleInterview);
router.post('/applications/:id/approve', careerController.approveAndCreateUser);
router.patch('/applications/:id/assign', careerController.assignToAdmin);
router.get('/statistics', careerController.getStatistics);

export default router;