const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema(
  {
    //brand code auto generate or manual , brnad origin , brand website ,  brand image , brand status , brand created by , brand updated by , brand created at , brand updated at
    name: {
      type: String,
      required: [true, 'Brand name is required'],
      unique: true,
      trim: true,
      maxlength: [50, 'Brand name cannot be more than 50 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Brand description cannot be more than 200 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Brand', brandSchema);
