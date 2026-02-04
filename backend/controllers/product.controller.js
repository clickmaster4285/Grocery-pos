const Product = require('../models/product.model');
const mongoose = require('mongoose');

// Helper function to generate a unique SKU
const generateUniqueSku = (productName, variantName, variantValue) => {
  const sanitize = (str) => str ? str.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 5) : ''; // Take first 5 alphanumeric chars
  const productPart = sanitize(productName);
  const variantNamePart = sanitize(variantName);
  const variantValuePart = sanitize(variantValue);
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase(); // 4 random chars

  let sku = `${productPart}-${variantNamePart}-${variantValuePart}-${randomSuffix}`;
  // Ensure SKU isn't too long (max 50 chars)
  if (sku.length > 50) {
    sku = sku.substring(0, 45) + randomSuffix; // Truncate and add suffix
  }
  return sku;
};

// Function to validate individual variant data and handle SKU generation
const validateVariantData = async (variant, productName, existingProductId = null, existingVariantSkusInRequest) => {
  let { name, value, sku, buyingPrice, sellingPrice, stock } = variant;

  // Auto-generate SKU if not provided
  if (!sku) {
    sku = generateUniqueSku(productName, name, value);
    variant.sku = sku; // Update the variant object with the generated SKU
  }

  if (!sku || !buyingPrice || !sellingPrice) {
    return `Variant SKU, buying price, and selling price are required. Missing in variant: ${sku || (name ? `${name} ${value}` : 'unknown')}`;
  }
  if (buyingPrice < 0 || sellingPrice < 0) {
    return `Variant prices cannot be negative. SKU: ${sku}`;
  }
  if (stock !== undefined && stock < 0) {
    return `Variant stock cannot be negative. SKU: ${sku}`;
  }

  // Check for unique SKU within the current request's variants
  if (existingVariantSkusInRequest.has(sku.toUpperCase())) {
    return `Duplicate SKU found in current request's variants: ${sku}`;
  }
  existingVariantSkusInRequest.add(sku.toUpperCase());

  // Check for global unique SKU across all products and variants
  // This needs to be done carefully to exclude the current product's variants during an update
  const query = { 'variants.sku': sku.toUpperCase(), isDeleted: false };
  if (existingProductId) {
    query._id = { $ne: existingProductId };
  }
  const existingVariantWithSku = await Product.findOne(query);
  if (existingVariantWithSku) {
    return `Variant with SKU '${sku}' already exists in another product.`;
  }

  return null; // No validation errors
};


const createProduct = async (req, res, next) => {
  try {
    const {
      productName,
      description,
      category,
      brand,
      supplier,
      imageUrl,
      variants, // Array of variant objects
    } = req.body;

    // Basic validation for required fields
    if (!productName) {
      return res.status(400).json({ message: 'Product name is required.' });
    }
    if (!variants || variants.length === 0) {
      return res.status(400).json({ message: 'At least one variant is required for a product.' });
    }

    // Check for unique product name among non-deleted products
    const existingProductByName = await Product.findOne({ productName, isDeleted: false });
    if (existingProductByName) {
      return res.status(409).json({ message: 'Product with this name already exists.' });
    }

    // Prepare variants with their initial price history
    const processedVariants = [];
    let calculatedTotalStock = 0;
    const existingVariantSkusInRequest = new Set(); // To check for unique SKUs within this request

    for (const variant of variants) {
      // Make sure 'variant' is mutable if validateVariantData modifies 'variant.sku'
      let mutableVariant = { ...variant };

      // Validate variant data using the helper
      const validationError = await validateVariantData(mutableVariant, productName, null, existingVariantSkusInRequest);
      if (validationError) {
        return res.status(400).json({ message: validationError });
      }

      const { name, value, sku, buyingPrice, sellingPrice, stock, imageUrl: variantImageUrl } = mutableVariant; // Destructure after validation

      // Create initial price history for the variant
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
        priceHistory, // Only priceHistory, not direct buyingPrice/sellingPrice
        stock: stock !== undefined ? stock : 0,
        imageUrl: variantImageUrl,
      });

      calculatedTotalStock += (stock || 0);
    }

    const product = await Product.create({
      productName,
      description,
      category,
      brand,
      supplier,
      imageUrl,
      totalStock: calculatedTotalStock,
      variants: processedVariants,
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
        .populate('variants.priceHistory.changedBy', 'firstName lastName')
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
      .populate('variants.priceHistory.changedBy', 'firstName lastName') // Populate who changed the price for variants
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

    // Handle productName uniqueness if updated

    // Prevent setting isDeleted to true via updateFields
    if (updateFields.isDeleted === true) {
      return res.status(400).json({ message: 'Use the DELETE endpoint to soft-delete a product.' });
    }

    // --- Handle Variants Update ---
    if (updateFields.variants) {
      const incomingVariants = updateFields.variants;
      const currentVariantIds = new Set(product.variants.map(v => v._id.toString()));
      const incomingVariantIds = new Set(incomingVariants.filter(v => v._id).map(v => v._id.toString()));
      let newTotalStock = 0;
      const processedVariantSkus = new Set(); // To check for unique SKUs within this update request

      const updatedVariantsArray = []; // To build the new variants array for the product

      for (const incomingVariant of incomingVariants) {
        // Make variant data mutable for the helper
        let mutableIncomingVariant = { ...incomingVariant };

        // Validate variant data using the helper
        // Pass product._id to exclude current product's other variants from global SKU check
        const validationError = await validateVariantData(mutableIncomingVariant, product.productName, product._id, processedVariantSkus);
        if (validationError) {
          return res.status(400).json({ message: validationError });
        }

        // Destructure again after validation as SKU might have been generated or updated by the helper
        let { _id, name, value, sku, buyingPrice, sellingPrice, stock, imageUrl: variantImageUrl } = mutableIncomingVariant;


        let variantToSave;

        if (_id && currentVariantIds.has(_id.toString())) {
          // --- Update existing variant ---
          variantToSave = product.variants.id(_id); // Find the subdocument by its _id

          if (!variantToSave) {
            return res.status(404).json({ message: `Variant with ID ${_id} not found in product.` });
          }

          // Check if SKU exists in another variant within THIS product (if _id is different)
          // This specific check was not part of validateVariantData as it needs `product.variants` context
          const duplicateSkuInSameProduct = product.variants.some(v => v._id && v._id.toString() !== _id.toString() && v.sku.toUpperCase() === sku.toUpperCase());
          if (duplicateSkuInSameProduct) {
            return res.status(409).json({ message: `Duplicate SKU found in other variants of this product: ${sku}` });
          }

          // Check if prices have changed to add to history
          const latestPriceEntry = variantToSave.priceHistory[variantToSave.priceHistory.length - 1];
          if (!latestPriceEntry || latestPriceEntry.buyingPrice !== buyingPrice || latestPriceEntry.sellingPrice !== sellingPrice) {
            variantToSave.priceHistory.push({
              buyingPrice,
              sellingPrice,
              effectiveDate: new Date(),
              changedBy: req.user ? req.user._id : null,
            });
          }

          // Update other fields
          variantToSave.name = name;
          variantToSave.value = value;
          variantToSave.sku = sku.toUpperCase(); // Update SKU
          variantToSave.stock = stock !== undefined ? stock : variantToSave.stock;
          variantToSave.imageUrl = variantImageUrl;

        } else {
          // --- Add new variant ---
          variantToSave = {
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
            imageUrl: variantImageUrl,
          };
          // Mongoose will assign _id when pushed or created
        }
        updatedVariantsArray.push(variantToSave); // Add to our new array
        newTotalStock += (stock || 0);
      }

      // --- Remove variants not present in the incoming update ---
      product.variants = updatedVariantsArray.filter(v => currentVariantIds.has(v._id.toString()) || !v._id); // Keep updated existing and newly added

      // Update general product fields that are not variants or price related
      Object.keys(updateFields).forEach(key => {
        if (updateFields[key] !== undefined && key !== 'variants' && key !== 'productName') {
          product[key] = updateFields[key];
        }
      });

      product.totalStock = newTotalStock; // Update total stock based on processed variants

    } else if (updateFields.totalStock !== undefined && updateFields.totalStock < 0) {
      return res.status(400).json({ message: 'Total stock cannot be negative.' });
    }

    // Apply remaining direct updates (e.g., description, category, brand, supplier, imageUrl)
    Object.keys(updateFields).forEach(key => {
      if (key !== 'variants' && key !== 'productName' && product[key] !== undefined) {
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
