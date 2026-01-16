import { Router } from 'express';
import { verifyToken } from '../middlewares/authMiddleware';
import * as uploadCtrl from '../controllers/uploadController';

const router = Router();

// Media upload endpoints
router.post('/media', verifyToken, uploadCtrl.uploadMedia);
router.post('/signed-url', verifyToken, uploadCtrl.getSignedUrl);
router.delete('/:publicId', verifyToken, uploadCtrl.deleteMedia);

export default router;