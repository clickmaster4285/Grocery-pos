const fs = require('fs');
const path = require('path');

const deleteFile = (filePath) => {
  if (filePath) {
    // Ensure we don't have a leading slash for path.join to work correctly with __dirname
    const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    const fullPath = path.join(__dirname, '..', cleanPath);
    
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
        return true;
      } catch (err) {
        console.error(`Error deleting file at ${fullPath}:`, err);
        return false;
      }
    }
  }
  return false;
};

module.exports = {
  deleteFile
};
