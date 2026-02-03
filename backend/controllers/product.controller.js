const Product = require('../models/product.model');
const mongoose = require('mongoose');

const createProduct = async (req, res, next) => {
  try {
    const {
      productName,
      sku,
      description,
      basePrice,
      buyingPrice, // Assuming buyingPrice is sent with initial creation for price history
      category, // Now optional
      brand, // Now optional
      supplier,
      imageUrl, // Now stores path/filename
      totalStock,
      variants, // Array of variant objects
    } = req.body;

    // Basic validation for required fields (productName, sku, basePrice)
    if (!productName || !sku || !basePrice) {
      return res.status(400).json({ message: 'Product name, SKU, and base price are required.' });
    }
    if (basePrice < 0) {
      return res.status(400).json({ message: 'Base price cannot be negative.' });
    }
    if (buyingPrice !== undefined && buyingPrice < 0) {
      return res.status(400).json({ message: 'Buying price cannot be negative.' });
    }

    // Check for unique product name and SKU among non-deleted products
    const existingProductByName = await Product.findOne({ productName, isDeleted: false });
    if (existingProductByName) {
      return res.status(409).json({ message: 'Product with this name already exists.' });
    }
    const existingProductBySku = await Product.findOne({ sku, isDeleted: false });
    if (existingProductBySku) {
      return res.status(409).json({ message: 'Product with this SKU already exists.' });
    }

    // Prepare initial price history
    const priceHistory = [{
      buyingPrice: buyingPrice !== undefined ? buyingPrice : basePrice, // Use buyingPrice if provided, else basePrice
      sellingPrice: basePrice,
      effectiveDate: new Date(),
      changedBy: req.user ? req.user._id : null, // Assuming user is authenticated and req.user is available
    }];

    // Calculate total stock if variants are provided and totalStock is not
    let calculatedTotalStock = totalStock !== undefined ? totalStock : 0;
    if (variants && variants.length > 0) {
      // If totalStock is not explicitly provided, sum from variants
      if (totalStock === undefined) {
        calculatedTotalStock = variants.reduce((sum, variant) => sum + (variant.stock || 0), 0);
      }
    }

    const product = await Product.create({
      productName,
      sku,
      description,
      basePrice,
      priceHistory,
      category,
      brand,
      supplier,
      imageUrl,
      totalStock: calculatedTotalStock,
      variants,
      isDeleted: false, // Ensure product is not deleted on creation
    });

    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

    const getAllProducts = async (req, res, next) => {
      try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const [products, total] = await Promise.all([
          Product.find({ isDeleted: false })
            .select('-priceHistory -variants') // Exclude heavy fields by default
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 }),
          Product.countDocuments({ isDeleted: false })
        ]);

        res.status(200).json({
          success: true,
          count: products.length,
          total,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
          products
        });
      } catch (error) {
        next(error);
      }
    };

    const getProductById = async (req, res, next) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
          return res.status(400).json({ message: 'Invalid product ID format' });
        }

        const product = await Product.findOne({ _id: req.params.id, isDeleted: false })
          .populate('priceHistory.changedBy', 'firstName lastName') // Populate who changed the price
          .lean(); // Use .lean() for faster query execution if no Mongoose methods are needed on the result

        if (!product) {
          return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json(product);
      } catch (error) {
        next(error);
      }
    };

    const updateProduct = async (req, res, next) => {
      try {
        const { id } = req.params;
        const updateFields = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({ message: 'Invalid product ID format' });
        }

        const product = await Product.findOne({ _id: id, isDeleted: false }); // Ensure we're not updating a soft-deleted product
        if (!product) {
          return res.status(404).json({ message: 'Product not found' });
        }

        // Handle SKU uniqueness if updated
        if (updateFields.sku && updateFields.sku !== product.sku) {
          const existingProductBySku = await Product.findOne({ sku: updateFields.sku, _id: { $ne: id }, isDeleted: false });
          if (existingProductBySku) {
            return res.status(409).json({ message: 'Another product with this SKU already exists.' });
          }
        }

        // Handle productName uniqueness if updated
        if (updateFields.productName && updateFields.productName !== product.productName) {
          const existingProductByName = await Product.findOne({ productName: updateFields.productName, _id: { $ne: id }, isDeleted: false });
          if (existingProductByName) {
            return res.status(409).json({ message: 'Another product with this name already exists.' });
          }
        }

        // Prevent setting isDeleted to true via updateFields
        if (updateFields.isDeleted === true) {
          return res.status(400).json({ message: 'Use the DELETE endpoint to soft-delete a product.' });
        }

        // Handle basePrice changes and update priceHistory
        if (updateFields.basePrice !== undefined && updateFields.basePrice !== product.basePrice) {
          if (updateFields.basePrice < 0) {
            return res.status(400).json({ message: 'Base price cannot be negative.' });
          }
          const newPriceHistoryEntry = {
            buyingPrice: updateFields.buyingPrice !== undefined ? updateFields.buyingPrice : (product.priceHistory.length > 0 ? product.priceHistory[product.priceHistory.length - 1].buyingPrice : updateFields.basePrice),
            sellingPrice: updateFields.basePrice,
            effectiveDate: new Date(),
            changedBy: req.user ? req.user._id : null,
          };
          product.priceHistory.push(newPriceHistoryEntry);
          product.basePrice = updateFields.basePrice; // Update the base price on the product
          delete updateFields.basePrice; // Remove from updateFields to prevent double update
          delete updateFields.buyingPrice; // Remove from updateFields
        }

        // Handle totalStock calculation if variants are updated and totalStock is not explicitly provided
        if (updateFields.variants) {
          // If variants are provided, and totalStock is not explicitly set in updateFields,
          // then recalculate totalStock from variants
          if (updateFields.totalStock === undefined) {
            updateFields.totalStock = updateFields.variants.reduce((sum, variant) => sum + (variant.stock || 0), 0);
          }
        } else if (updateFields.totalStock !== undefined && updateFields.totalStock < 0) {
          return res.status(400).json({ message: 'Total stock cannot be negative.' });
        }

        // Apply other direct updates
        Object.keys(updateFields).forEach(key => {
          if (updateFields[key] !== undefined && key !== 'priceHistory') { // priceHistory handled separately
            product[key] = updateFields[key];
          }
        });

        await product.save();

        res.status(200).json(product);
      } catch (error) {
        next(error);
      }
    };

const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }

    const product = await Product.findOneAndUpdate(
      { _id: id, isDeleted: false }, // Ensure we are deleting a non-deleted product
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: req.user ? req.user._id : null, // Record who deleted the product
        isActive: false, // Also set isActive to false
      },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found or already deleted' });
    }

    res.status(200).json({ message: 'Product deleted successfully (soft deleted)' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
