const mongoose = require('mongoose');

const branchLocationSchema = new mongoose.Schema({
    branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: true,
    },
    name: {
        type: String,
        required: [true, 'Location name is required.'],
        trim: true,
    },
    type: {
        type: String,
        enum: ['AISLE', 'RACK', 'SHELF', 'GONDOLA', 'REFRIGERATOR', 'FREEZER', 'DISPLAY', 'BACKROOM'],
        default: 'BACKROOM',
        required: true,
    },
    floor: {
        type: Number,
        default: 0, // 0 for ground floor
    },
    direction: {
        type: String,
        trim: true,
        placeholder: 'e.g., Left, Right, Center',
    },
    capacity: {
        type: Number,
        default: 0, // 0 means unlimited or not tracked
        min: [0, 'Capacity cannot be negative.'],
    },
    currentOccupancy: {
        type: Number,
        default: 0,
        min: [0, 'Current occupancy cannot be negative.'],
    },
    isActive: {
        type: Boolean,
        default: true,
    }
}, {
    timestamps: true,
});

// Ensure unique location names within a branch
branchLocationSchema.index({ branch: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('BranchLocation', branchLocationSchema);
