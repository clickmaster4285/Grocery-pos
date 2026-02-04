const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // For now, upload to a generic temp directory.
    // The controller will be responsible for moving files to their final product/variant specific location.
    const uploadPath = path.join(__dirname, '../uploads/temp');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif|webp/; // Added webp for modern web
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {    
    return cb(null, true);
  }
  cb(new Error('Only images (JPEG, JPG, PNG, GIF, WebP) are allowed!'));
};

const upload = multer({
  storage: uploadStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
  fileFilter: fileFilter,
}).any(); // Use .any() to handle all files with dynamic field names

module.exports = upload;