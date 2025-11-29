import { Request, Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// 1. Cấu hình Cloudinary (Giữ nguyên)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'zalo_app_tasks',
      format: 'jpg',
      public_id: file.originalname.split('.')[0] + '-' + Date.now(),
    };
  },
});

export const upload = multer({ storage: storage });

export const uploadController = {
  uploadMedia: (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({ error: 1, message: 'No files uploaded' });
      }
      const urls = files.map((file: any) => file.path);
      res.status(200).send({
        error: 0,
        message: 'Success',
        data: {
          urls: urls,
        },
      });
    } catch (err: any) {
      res.status(500).send({ error: -1, message: err.message });
    }
  },
};
