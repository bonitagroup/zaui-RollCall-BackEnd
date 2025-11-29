import { Router } from 'express';
import { upload, uploadController } from '../controllers/upload.controller';

const router = Router();

// field name bắt buộc là 'file' theo tài liệu Zalo
router.post('/upload/media', upload.array('file'), uploadController.uploadMedia);

//router.get('/files/:name', uploadController.getFile);

export default router;
