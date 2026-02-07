const Product = require('../models/product.model');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const generateUniqueSku = (productName, variantName, variantValue) => {
  const sanitize = (str) => str ? str.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 5) : ''; // Take first 5 alphanumeric chars
  const productPart = sanitize(productName);
  const variantNamePart = sanitize(variantName);
  const variantValuePart = sanitize(variantValue);
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase(); // 4 random chars

  let sku = `${productPart}-${variantNamePart}-${variantValuePart}-${randomSuffix}`;
  if (sku.length > 50) {
    sku = sku.substring(0, 45) + randomSuffix; // Truncate and add suffix
  }
  return sku;
};

const validateVariantData = async (variant, productName, existingProductId = null, existingVariantSkusInRequest) => {
  let { name, value, sku, buyingPrice, sellingPrice, stock } = variant;

  buyingPrice = Number(buyingPrice);
  sellingPrice = Number(sellingPrice);
  stock = Number(stock);

  if (!sku) {
    sku = generateUniqueSku(productName, name, value);
    variant.sku = sku; // Update the variant object with the generated SKU
  }

  if (!sku || isNaN(buyingPrice) || isNaN(sellingPrice)) {
    return `Variant SKU, buying price, and selling price are required and must be valid numbers. Missing in variant: ${sku || (name ? `${name} ${value}` : 'unknown')}`;
  }
  if (buyingPrice < 0 || sellingPrice < 0) {
    return `Variant prices cannot be negative. SKU: ${sku}`;
  }
  if (!isNaN(stock) && stock < 0) {
    return `Variant stock cannot be negative. SKU: ${sku}`;
  }

  if (existingVariantSkusInRequest.has(sku.toUpperCase())) {
    return `Duplicate SKU found in current request's variants: ${sku}`;
  }
  existingVariantSkusInRequest.add(sku.toUpperCase());

  const query = { 'variants.sku': sku.toUpperCase(), isDeleted: false };
  if (existingProductId) {
    query._id = { $ne: existingProductId };
  }
  const existingVariantWithSku = await Product.findOne(query);
  if (existingVariantWithSku) {
    return `Variant with SKU '${sku}' already exists in another product.`;
  }

  return null;
};

const processAndMoveVariantImages = (files, variants, productName) => {
  const uploadDir = path.join(__dirname, '../uploads/products');
  const sanitizeFilename = (str) => str ? str.replace(/\s/g, '-') : 'unknown-product';
  const sanitizedProductName = sanitizeFilename(productName);

  const uploadedFileMap = new Map();
  files.forEach(file => {
    const match = file.fieldname.match(/variant_(\d+)_image_(\d+)/);
    if (match) {
      const variantIndex = parseInt(match[1]);
      const imageIndex = parseInt(match[2]);

      const newFilename = `${sanitizedProductName}-variant-${variantIndex}-img-${Date.now()}${path.extname(file.originalname)}`;
      const newPath = path.join(uploadDir, newFilename);

      fs.renameSync(file.path, newPath);

      const fileUrl = `/uploads/products/${newFilename}`;
      uploadedFileMap.set(`${variantIndex}_${imageIndex}`, fileUrl);
    } else {
      fs.unlinkSync(file.path);
    }
  });

  return variants.map((variant, variantIdx) => {
    const updatedImages = variant.images.map((imgUrl, imageIdx) => {
      const mapKey = `${variantIdx}_${imageIdx}`;
      return uploadedFileMap.has(mapKey) ? uploadedFileMap.get(mapKey) : imgUrl;
    });
    return { ...variant, images: updatedImages };
  });
};

const createProduct = async (req, res, next) => {
  try {
    const parsedProductData = JSON.parse(req.body.productData);
    let {
      productName,
      description,
      category,
      brand,
      supplier,
      branch_id: branchIdFromRequest, // Rename 'branch_id' from request to distinguish from 'final_branch_id'
      variants,
    } = parsedProductData;


    let final_branch_id = branchIdFromRequest;
    // If the user is not an admin, use their branch_id from the token
    if (req.user && req.user.role !== 'admin') {
      final_branch_id = req.user.branch_id;
    }

    if (!final_branch_id) {
      return res.status(400).json({ message: 'Branch ID is required.' });
    }

    if (req.files && req.files.length > 0) {
      variants = processAndMoveVariantImages(req.files, variants, productName);
    }
    if (!productName) {
      return res.status(400).json({ message: 'Product name is required.' });
    }
    if (!variants || variants.length === 0) {
      return res.status(400).json({ message: 'At least one variant is required for a product.' });
    }

    const existingProductByName = await Product.findOne({ productName, isDeleted: false });
    if (existingProductByName) {
      return res.status(409).json({ message: 'Product with this name already exists.' });
    }

    const processedVariants = [];
    let calculatedTotalStock = 0;
    const existingVariantSkusInRequest = new Set();

    for (const variant of variants) {
      let mutableVariant = { ...variant };

      // Validate variant data using the helper
      const validationError = await validateVariantData(mutableVariant, productName, null, existingVariantSkusInRequest);
      if (validationError) {
        return res.status(400).json({ message: validationError });
      }

      const { name, value, sku, buyingPrice, sellingPrice, stock, images } = mutableVariant;

      const priceHistory = [{
        buyingPrice,
        sellingPrice,
        effectiveDate: new Date(),
        changedBy: req.user ? req.user._id : null,
      }];

      processedVariants.push({
        name,
        value,
        sku: sku.toUpperCase(),
        priceHistory,
        stock: stock !== undefined ? stock : 0,
        images: images || [],
      });

      calculatedTotalStock += (stock || 0);
    }

    const product = await Product.create({
      productName,
      description,
      category,
      brand,
      supplier,
      branch_id: final_branch_id,
      totalStock: calculatedTotalStock,
      variants: processedVariants,
      isDeleted: false,
    });

    res.status(201).json(product);
  } catch (error) {
    // If files were uploaded, clean them up on error
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => fs.unlinkSync(file.path));
    }
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
        .populate('variants.priceHistory.changedBy', 'firstName lastName')
        .populate('branch_id', 'branch_name') // Populate branch_id to get branch_name
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }), Product.countDocuments({ isDeleted: false })
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
      .populate('variants.priceHistory.changedBy', 'firstName lastName') // Populate who changed the price for variants
      .populate('branch_id', 'branch_name') // Populate branch_id to get branch_name
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
    const parsedProductData = JSON.parse(req.body.productData);
    let {
      productName,
      description,
      category,
      brand,
      supplier,
      branch_id,
      variants,
    } = parsedProductData;

    if (req.files && req.files.length > 0) {
      variants = processAndMoveVariantImages(req.files, variants, productName);
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }

    const product = await Product.findOne({ _id: id, isDeleted: false });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (parsedProductData.isDeleted === true) {
      return res.status(400).json({ message: 'Use the DELETE endpoint to soft-delete a product.' });
    }

    if (variants) {
      const incomingVariants = variants;
      let newTotalStock = 0;
      const processedVariantSkus = new Set(); // To check for unique SKUs within this update request

      // Keep track of variant IDs that are still present or newly added
      const incomingVariantIds = new Set(incomingVariants.filter(v => v._id).map(v => v._id.toString()));

      // First, process updates to existing variants and add new ones
      for (const incomingVariant of incomingVariants) {
        let mutableIncomingVariant = { ...incomingVariant };

        // Validate variant data using the helper
        const validationError = await validateVariantData(mutableIncomingVariant, product.productName, product._id, processedVariantSkus);
        if (validationError) {
          return res.status(400).json({ message: validationError });
        }

        let { _id, name, value, sku, buyingPrice, sellingPrice, stock, images } = mutableIncomingVariant;

        if (_id) { // This is an existing variant being updated
          let variantToUpdate = product.variants.id(_id);

          if (!variantToUpdate) {
            return res.status(404).json({ message: `Variant with ID ${_id} not found in product.` });
          }

          // Check if SKU exists in another variant within THIS product (if _id is different)
          const duplicateSkuInSameProduct = product.variants.some(v => v._id && v._id.toString() !== _id.toString() && v.sku.toUpperCase() === sku.toUpperCase());
          if (duplicateSkuInSameProduct) {
            return res.status(409).json({ message: `Duplicate SKU found in other variants of this product: ${sku}` });
          }

          // Check if prices have changed to add to history
          const latestPriceEntry = variantToUpdate.priceHistory[variantToUpdate.priceHistory.length - 1];
          if (!latestPriceEntry || latestPriceEntry.buyingPrice !== buyingPrice || latestPriceEntry.sellingPrice !== sellingPrice) {
            variantToUpdate.priceHistory.push({
              buyingPrice,
              sellingPrice,
              effectiveDate: new Date(),
              changedBy: req.user ? req.user._id : null,
            });
          }

          // Update other fields
          variantToUpdate.name = name;
          variantToUpdate.value = value;
          variantToUpdate.sku = sku.toUpperCase();
          variantToUpdate.stock = stock !== undefined ? stock : variantToUpdate.stock;
          variantToUpdate.images = images || []; // Update images array

        } else { // This is a new variant being added
          const newVariant = {
            name,
            value,
            sku: sku.toUpperCase(),
            priceHistory: [{
              buyingPrice,
              sellingPrice,
              effectiveDate: new Date(),
              changedBy: req.user ? req.user._id : null,
            }],
            stock: stock !== undefined ? stock : 0,
            images: images || [],
          };
          product.variants.push(newVariant); // Mongoose will assign _id
        }
        newTotalStock += (stock || 0);
      }

      // Second, remove variants that are no longer present in the incoming request
      for (let i = product.variants.length - 1; i >= 0; i--) {
        const existingVariant = product.variants[i];
        if (existingVariant._id && !incomingVariantIds.has(existingVariant._id.toString())) {
          product.variants.pull(existingVariant._id);
        }
      }

      product.totalStock = newTotalStock; // Update total stock based on processed variants
    }

    // Apply remaining direct updates (e.g., description, category, brand, supplier)
    Object.keys(parsedProductData).forEach(key => {
      if (parsedProductData[key] !== undefined && key !== 'variants' && key !== 'productName') {
        product[key] = parsedProductData[key];
      }
    });

    await product.save();

    res.status(200).json(product);
  } catch (error) {
    // If files were uploaded, clean them up on error
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => fs.unlinkSync(file.path));
    }
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
