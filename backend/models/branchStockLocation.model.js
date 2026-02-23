const mongoose = require('mongoose');

const branchStockLocationSchema = new mongoose.Schema({
    branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: true,
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    variantId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    location: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BranchLocation',
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
    },
    isDisplayOnly: {
        type: Boolean,
        default: false,
    },
    lastUpdated: {
        type: Date,
        default: Date.now,
    }
}, {
    timestamps: true,
});

// Compound index to ensure unique stock entry per branch, variant, and physical location
branchStockLocationSchema.index({ branch: 1, product: 1, variantId: 1, location: 1 }, { unique: true });

// Middleware to sync with BranchStock summary table
async function syncBranchStock(doc) {
    const BranchStock = mongoose.model('BranchStock');
    const BranchStockLocation = mongoose.model('BranchStockLocation');

    // Aggregate total quantity for this variant in this branch
    const result = await BranchStockLocation.aggregate([
        {
            $match: {
                branch: doc.branch,
                product: doc.product,
                variantId: doc.variantId
            }
        },
        {
            $group: {
                _id: null,
                totalQuantity: { $sum: "$quantity" }
            }
        }
    ]);

    const totalQuantity = result.length > 0 ? result[0].totalQuantity : 0;

    // Update the BranchStock summary table
    await BranchStock.findOneAndUpdate(
        {
            branch: doc.branch,
            product: doc.product,
            variantId: doc.variantId
        },
        {
            quantity: totalQuantity,
            lastUpdated: Date.now()
        },
        {
            upsert: true,
            new: true
        }
    );
}

branchStockLocationSchema.post('save', async function(doc) {
    await syncBranchStock(doc);
});

branchStockLocationSchema.post('remove', async function(doc) {
    await syncBranchStock(doc);
});

module.exports = mongoose.model('BranchStockLocation', branchStockLocationSchema);
