// services/cloudinaryService.js
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImage(imagePathOrUrl, publicId = '') {
  try {
    const result = await cloudinary.uploader.upload(imagePathOrUrl, {
      public_id: publicId || undefined, 
    });

    // Construct optimized and transformed URLs
    const secureUrl = result.secure_url;

    const optimizedUrl = cloudinary.url(result.public_id, {
      fetch_format: 'auto',
      quality: 'auto',
    });

    const autoCropUrl = cloudinary.url(result.public_id, {
      crop: 'auto',
      gravity: 'auto',
      width: 500,
      height: 500,
    });

    return {
      publicId: result.public_id,
      secureUrl,
      optimizedUrl,
      autoCropUrl,
    };
  } catch (error) {
    console.error('Cloudinary Upload Failed:', error);
    throw error;
  }
}
