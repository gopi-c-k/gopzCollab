import express from 'express';
import multer from 'multer';
import fs from 'fs';
import { uploadImage } from '../services/cloudinaryService.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' }); 

router.post('/upload', upload.single('image'), async (req, res) => {
  try {

    const result = await uploadImage(req.file.path);

    // Delete temp file after upload
    fs.unlink(req.file.path, (err) => {
      if (err) {
        console.error('❌ Failed to delete temp file:', req.file.path);
      } else {
        console.log('✅ Temp file deleted:', req.file.path);
      }
    });

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({
      message: 'Image upload failed',
      error: err.message,
    });
  }
});

export default router;
