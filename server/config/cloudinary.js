import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'bito-pyqs-uploads', // This folder will be automatically created in Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'], // Only allow these file types
    resource_type: 'auto' // Crucial for allowing PDFs as well as standard images
  },
});

const upload = multer({ storage: storage });

export { upload, cloudinary };