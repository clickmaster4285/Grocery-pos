const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Dynamic storage engine
const getStorage = (subfolder) => multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, `../uploads/${subfolder}`);
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif|webp/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {    
    return cb(null, true);
  }
  cb(new Error('Only images (JPEG, JPG, PNG, GIF, WebP) are allowed!'));
};

// Specific uploaders
const productUpload = multer({
  storage: getStorage('temp'),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for products
  fileFilter: fileFilter,
});

const brandUpload = multer({
  storage: getStorage('brands'),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit for logos
  fileFilter: fileFilter,
});

const settingsUpload = multer({
  storage: getStorage('settings'),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit for settings logo
  fileFilter: fileFilter,
});

module.exports = {
  productUpload,
  brandUpload,
  settingsUpload
};
