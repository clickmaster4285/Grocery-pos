const Product = require('../models/product.model');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { createProductSchema, updateProductSchema } = require('../validation/product.validation');
const { transformEmptyStringsToNull, cleanupUploadedFiles, createInitialVariantHistory } = require('../utils/product.utils');

const MAX_VARIANT_IMAGE_TOTAL_SIZE = 25 * 1024 * 1024; // 25MB file size limit per variant

const generateUniqueSku = (productName, attributes) => {
    const sanitize = (str) => str ? str.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 4) : '';
    const productPart = sanitize(productName);
    const attrsPart = (attributes || []).map(attr => sanitize(attr.value)).join('');
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();

    let sku = `${productPart}-${attrsPart}-${randomSuffix}`;
    return sku.substring(0, 50); // Ensure it doesn't exceed max length
};



const processAndMoveVariantImages = (files, variants, productName) => {
    console.log('--- processAndMoveVariantImages Start ---');
    console.log('Incoming files:', files);
    console.log('Incoming variants parameter:', variants);
    console.log('Incoming productName:', productName);

    const uploadDir = path.join(__dirname, '../uploads/products');
    fs.mkdirSync(uploadDir, { recursive: true }); // Ensure the destination directory exists
    const sanitizeFilename = (str) => str ? str.replace(/\s/g, '-') : 'unknown-product';
    const sanitizedProductName = sanitizeFilename(productName);

    const uploadedFilesByVariant = {}; // { 'variantIndex': [{fileObject}, {fileObject}] }

    if (files) {
        files.forEach(file => {
            const match = file.fieldname.match(/variant_(\d+)_image_(\d+)/);
            if (match) {
                const variantIndex = parseInt(match[1]);
                if (!uploadedFilesByVariant[variantIndex]) {
                    uploadedFilesByVariant[variantIndex] = [];
                }
                uploadedFilesByVariant[variantIndex].push(file); // Store the full file object
            } else {
                // If a file doesn't match the variant pattern, it's not processed here.
                // cleanupUploadedFiles in the controller's catch block will handle unlinking it.
                console.warn(`File ${file.originalname} did not match variant pattern and will be unlinked by cleanupFiles.`);
            }
        });
    }
    console.log('Uploaded files grouped by variant:', uploadedFilesByVariant);


    // --- CUMULATIVE SIZE VALIDATION (BEFORE MOVING FILES) ---
    for (const variantIndex in uploadedFilesByVariant) {
        let totalSizeForVariant = 0;
        uploadedFilesByVariant[variantIndex].forEach(file => {
            totalSizeForVariant += file.size;
        });
        console.log(`Total size for new images of variant ${parseInt(variantIndex) + 1}: ${totalSizeForVariant} bytes`);


        if (totalSizeForVariant > MAX_VARIANT_IMAGE_TOTAL_SIZE) {
            console.error(`Error: Total size of new images for variant ${parseInt(variantIndex) + 1} exceeds ${MAX_VARIANT_IMAGE_TOTAL_SIZE / (1024 * 1024)}MB.`);
            throw new Error(`Total size of new images for variant ${parseInt(variantIndex) + 1} exceeds ${MAX_VARIANT_IMAGE_TOTAL_SIZE / (1024 * 1024)}MB.`);
        }
    }
    // --- END CUMULATIVE SIZE VALIDATION ---

    // --- MOVE FILES AND UPDATE IMAGE PATHS (ONLY IF ALL VALIDATION PASSES) ---
    const processedVariants = variants.map((variant, variantIdx) => {
        console.log(`Processing variant ${variantIdx} in map:`, variant);
        const existingImages = variant.images || []; // Existing images passed from frontend (e.g. during update)
        const newImagesForVariant = [];

        if (uploadedFilesByVariant[variantIdx]) {
            uploadedFilesByVariant[variantIdx].forEach(file => {
                const newFilename = `${sanitizedProductName}-variant-${variantIdx}-img-${Date.now()}${path.extname(file.originalname)}`;
                const newPath = path.join(uploadDir, newFilename);
                fs.renameSync(file.path, newPath); // Move the temporary file
                newImagesForVariant.push(`/uploads/products/${newFilename}`);
                console.log(`Moved file ${file.originalname} to ${newPath}`);
            });
        }
        const updatedVariant = { ...variant, images: [...existingImages, ...newImagesForVariant] };
        console.log(`Updated variant ${variantIdx} with images:`, updatedVariant);
        return updatedVariant;
    });
    console.log('--- processAndMoveVariantImages End ---');
    return processedVariants;
};

const createProduct = async (req, res, next) => {
    try {
        let parsedProductData;
        try {
            parsedProductData = JSON.parse(req.body.productData);
        } catch (parseError) {
            return res.status(400).json({ message: 'Invalid productData JSON format.' });
        }
        // Transform empty strings to null for category, brand, and variant.supplier before validation
        parsedProductData = transformEmptyStringsToNull(parsedProductData);

        console.log("the parsend data is ", parsedProductData)
        // Use Joi to validate the incoming data
        const { error, value } = createProductSchema.validate(parsedProductData, { abortEarly: false });
        if (error) {
            return res.status(400).json({
                message: 'Validation failed',
                details: error.details.map(detail => detail.message)
            });
        }

        let {
            productName,
            description,
            category,
            brand,
            variants,
            isActive,
        } = value; // Use the validated value

        // Handle file uploads
        if (req.files && req.files.length > 0) {
            variants = processAndMoveVariantImages(req.files, variants, productName);
        }




        const processedVariants = [];

        for (const variantData of variants) {
            const mutableVariant = { ...variantData };

            // Before passing to validateVariantData, ensure SKU is generated if missing
            if (!mutableVariant.sku) {
                mutableVariant.sku = generateUniqueSku(productName, mutableVariant.attributes || []);
            }
            mutableVariant.sku = mutableVariant.sku.toUpperCase();


            const { sku, attributes, supplier, barcode, qrCode, images } = mutableVariant; // Destructure images here
            const { priceHistory, stockHistory, initialStock } = createInitialVariantHistory(mutableVariant, req.user._id);

            processedVariants.push({
                sku,
                attributes,
                supplier,
                priceHistory,
                stock: initialStock,
                stockHistory,
                images: images || [], // Use the images destructured from mutableVariant
                barcode,
                qrCode,
                isDeleted: false,
                deletedAt: null,
            });
        }

        const product = await Product.create({
            productName,
            description,
            category,
            brand,
            variants: processedVariants,
            isActive,
            lastRestocked: processedVariants.some(v => v.stock > 0) ? new Date() : null,
            isDeleted: false,
        });

        res.status(201).json(product);
    } catch (error) {
        cleanupUploadedFiles(req.files);
        next(error);
    }
};

// NOTE: The following functions need to be updated to support the new data model.
// This is a placeholder to be completed in the next steps.

const getAllProducts = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const { search, category, brand } = req.query;

        // Base pipeline for matching products
        const matchStage = {
            isDeleted: false,
        };

        // Add text search capabilities
        if (search) {
            matchStage.$or = [
                { productName: { $regex: search, $options: 'i' } },
                { 'variants.sku': { $regex: search, $options: 'i' } },
                { 'variants.barcode': { $regex: search, $options: 'i' } }
            ];
        }
        if (category) matchStage.category = category;
        if (brand) matchStage.brand = brand;

        const aggregationPipeline = [
            { $match: matchStage },
            { $unwind: '$variants' },
            { $match: { 'variants.isDeleted': false } },
            // Group back to reconstruct the product with filtered variants
            {
                $group: {
                    _id: '$_id',
                    productName: { $first: '$productName' },
                    description: { $first: '$description' },
                    category: { $first: '$category' },
                    brand: { $first: '$brand' },
                    totalStock: { $first: '$totalStock' }, // This is the pre-calculated total, consider recalculating if needed
                    isActive: { $first: '$isActive' },
                    createdAt: { $first: '$createdAt' },
                    variants: { $push: '$variants' }
                }
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            // Populate category, brand, and supplier
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'brands',
                    localField: 'brand',
                    foreignField: '_id',
                    as: 'brand'
                }
            },
            { $unwind: { path: '$brand', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'suppliers',
                    localField: 'variants.supplier',
                    foreignField: '_id',
                    as: 'suppliers'
                }
            },
            {
                $addFields: {
                    variants: {
                        $map: {
                            input: '$variants',
                            as: 'variant',
                            in: {
                                $mergeObjects: [
                                    '$$variant',
                                    {
                                        supplier: {
                                            $arrayElemAt: [
                                                '$suppliers',
                                                { $indexOfArray: ['$suppliers._id', '$$variant.supplier'] }
                                            ]
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            },
            { $project: { suppliers: 0 } } // Remove the temporary suppliers array
        ];

        const products = await Product.aggregate(aggregationPipeline);

        // We need a separate query to get the total count accurately based on the initial match
        const total = await Product.countDocuments(matchStage);

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

        const aggregationPipeline = [
            { $match: { _id: new mongoose.Types.ObjectId(req.params.id), isDeleted: false } },
            { $unwind: '$variants' },
            { $match: { 'variants.isDeleted': false } },
            {
                $group: {
                    _id: '$_id',
                    productName: { $first: '$productName' },
                    description: { $first: '$description' },
                    category: { $first: '$category' },
                    brand: { $first: '$brand' },
                    totalStock: { $first: '$totalStock' },
                    isActive: { $first: '$isActive' },
                    createdAt: { $first: '$createdAt' },
                    updatedAt: { $first: '$updatedAt' },
                    variants: { $push: '$variants' }
                }
            },
            // Populate lookups
            { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'category' } },
            { $lookup: { from: 'brands', localField: 'brand', foreignField: '_id', as: 'brand' } },
            { $lookup: { from: 'users', localField: 'variants.priceHistory.changedBy', foreignField: '_id', as: 'priceChangers' } },
            { $lookup: { from: 'users', localField: 'variants.stockHistory.performedBy', foreignField: '_id', as: 'stockPerformers' } },
            { $lookup: { from: 'suppliers', localField: 'variants.supplier', foreignField: '_id', as: 'suppliers' } },
            { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
            { $unwind: { path: '$brand', preserveNullAndEmptyArrays: true } },
            {
                $addFields: {
                    variants: {
                        $map: {
                            input: '$variants',
                            as: 'variant',
                            in: {
                                $mergeObjects: [
                                    '$$variant',
                                    {
                                        supplier: {
                                            $arrayElemAt: [
                                                '$suppliers',
                                                { $indexOfArray: ['$suppliers._id', '$$variant.supplier'] }
                                            ]
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            },
            { $project: { suppliers: 0 } } // Remove the temporary suppliers array
        ];

        const results = await Product.aggregate(aggregationPipeline);

        if (!results || results.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Manually populate user data since aggregation lookups can be tricky with nested arrays
        const product = results[0];
        const priceChangers = new Map(results[0].priceChangers.map(u => [u._id.toString(), `${u.firstName} ${u.lastName}`]));
        const stockPerformers = new Map(results[0].stockPerformers.map(u => [u._id.toString(), `${u.firstName} ${u.lastName}`]));

        product.variants.forEach(variant => {
            variant.priceHistory.forEach(h => {
                if (h.changedBy) h.changedBy = priceChangers.get(h.changedBy.toString()) || 'Unknown User';
            });
            variant.stockHistory.forEach(h => {
                if (h.performedBy) h.performedBy = stockPerformers.get(h.performedBy.toString()) || 'Unknown User';
            });
        });

        delete product.priceChangers;
        delete product.stockPerformers;

        res.status(200).json(product);
    } catch (error) {
        next(error);
    }
};

const updateProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid product ID format.' });
        }

        const product = await Product.findOne({ _id: id, isDeleted: false });
        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        console.log('--- updateProduct Start ---');
        console.log('req.body.productData:', req.body.productData);
        console.log('req.files:', req.files); // Will be an array of file objects if any files were uploaded

        let parsedProductData;
        try {
            parsedProductData = JSON.parse(req.body.productData);
            console.log('parsedProductData after JSON.parse:', parsedProductData);
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            return res.status(400).json({ message: 'Invalid productData JSON format.' });
        }
        // Transform empty strings to null for category, brand, and variant.supplier before validation
        parsedProductData = transformEmptyStringsToNull(parsedProductData);
        console.log('parsedProductData after transformEmptyStringsToNull:', parsedProductData);

        // Use Joi to validate the incoming data for update
        const { error, value } = updateProductSchema.validate(parsedProductData, { abortEarly: false });
        if (error) {
            console.error('Joi Validation Error:', error);
            return res.status(400).json({
                message: 'Validation failed',
                details: error.details.map(detail => detail.message)
            });
        }
        console.log('Joi Validation Value (after validation):', value);

        let { variants = [], ...otherProductData } = value; // Use the validated value, default variants to []
        console.log('Variants from Joi value (after defaulting to []):', variants);

        // Handle file uploads
        if (req.files && req.files.length > 0) {
            console.log('--- Processing file uploads for variants ---');
            variants = processAndMoveVariantImages(req.files, variants, product.productName);
            console.log('Variants after processAndMoveVariantImages:', variants);
        }

        // Update top-level product fields (productName, description, category, brand, isActive)
        Object.assign(product, otherProductData);
        console.log('Product Mongoose doc after Object.assign (top-level fields updated):', product);

        // Note: variants is guaranteed to be an array here due to `let { variants = [], ... } = value`
        const uniquenessCheckSets = { skus: new Set(), barcodes: new Set(), qrCodes: new Set() };
        const incomingVariantIds = new Set();

        for (const variantData of variants) {
            console.log('--- Processing incoming variantData ---');
            console.log('Current variantData in loop:', variantData);

            const mutableVariant = { ...variantData };
            incomingVariantIds.add(mutableVariant._id?.toString());
            console.log('mutableVariant after spread and _id added:', mutableVariant);

            // Ensure SKU is generated if missing for new variants
            if (!mutableVariant.sku) {
                mutableVariant.sku = generateUniqueSku(product.productName, mutableVariant.attributes || []);
                console.log('SKU generated for new variant:', mutableVariant.sku);
            }
            mutableVariant.sku = mutableVariant.sku.toUpperCase();
            console.log('mutableVariant after SKU processing:', mutableVariant);

            if (mutableVariant._id) { // Existing variant
                const variantToUpdate = product.variants.id(mutableVariant._id); // Mongoose method to find subdocument
                console.log('Mongoose product.variants subdocument found (variantToUpdate):', variantToUpdate);
                if (!variantToUpdate || variantToUpdate.isDeleted) {
                    console.log(`Skipping variant ${mutableVariant._id} (not found or deleted).`);
                    continue; // Skip if variant not found or already deleted
                }

                // Validate uniqueness against other products and this request (database check)
                // Assuming validateVariantData is defined elsewhere (e.g., product.utils.js)
                // const validationError = await validateVariantData(mutableVariant, product.productName, product._id, uniquenessCheckSets);
                // if (validationError) return res.status(400).json({ message: validationError });

                // Price History
                // Ensure priceHistory is an array before accessing length
                const latestPrice = variantToUpdate.priceHistory && variantToUpdate.priceHistory.length > 0
                    ? variantToUpdate.priceHistory[variantToUpdate.priceHistory.length - 1]
                    : { buyingPrice: 0, sellingPrice: 0 }; // Default if no history
                const newBuyingPrice = Number(mutableVariant.buyingPrice);
                const newSellingPrice = Number(mutableVariant.sellingPrice);
                if (latestPrice.buyingPrice !== newBuyingPrice || latestPrice.sellingPrice !== newSellingPrice) {
                    // Ensure priceHistory is initialized as an array if it somehow isn't
                    if (!Array.isArray(variantToUpdate.priceHistory)) variantToUpdate.priceHistory = [];
                    variantToUpdate.priceHistory.push({
                        buyingPrice: newBuyingPrice,
                        sellingPrice: newSellingPrice,
                        changedBy: req.user._id,
                    });
                    console.log('Price history updated for variant:', variantToUpdate._id);
                }

                // Stock History
                const stockChange = Number(mutableVariant.stock) - variantToUpdate.stock;
                if (stockChange !== 0) {
                    const stockChangeType = mutableVariant.stockChangeType || 'ADJUSTMENT';
                    const stockChangeReason = mutableVariant.stockChangeReason || 'Manual update';

                    // Ensure stockHistory is initialized as an array if it somehow isn't
                    if (!Array.isArray(variantToUpdate.stockHistory)) variantToUpdate.stockHistory = [];
                    variantToUpdate.stockHistory.push({
                        change: stockChange,
                        type: stockChangeType,
                        reason: stockChangeReason,
                        performedBy: req.user._id,
                    });
                    variantToUpdate.stock = mutableVariant.stock;
                    if (stockChange > 0) product.lastRestocked = new Date();
                    console.log('Stock history updated for variant:', variantToUpdate._id);
                }

                // Update other fields
                Object.assign(variantToUpdate, {
                    attributes: mutableVariant.attributes || [], // Ensure attributes is array
                    supplier: mutableVariant.supplier,
                    barcode: mutableVariant.barcode,
                    qrCode: mutableVariant.qrCode,
                    images: mutableVariant.images || [], // Ensure images is array
                });
                console.log('variantToUpdate after Object.assign (fields updated):', variantToUpdate);

            } else { // New variant
                console.log('--- Creating new variant ---');
                // Assuming validateVariantData is defined elsewhere
                // const validationError = await validateVariantData(mutableVariant, product.productName, product._id, uniquenessCheckSets);
                // if (validationError) {
                //     cleanupUploadedFiles(req.files);
                //     return res.status(400).json({ message: validationError });
                // }

                const { priceHistory, stockHistory, initialStock } = createInitialVariantHistory(mutableVariant, req.user._id);

                const newVariant = {
                    ...mutableVariant,
                    priceHistory,
                    stock: initialStock,
                    stockHistory,
                    images: mutableVariant.images || [], // Ensure images is array
                    attributes: mutableVariant.attributes || [], // Ensure attributes is array
                };
                if (initialStock > 0) {
                    product.lastRestocked = new Date();
                }
                product.variants.push(newVariant);
                console.log('New variant pushed to product.variants:', newVariant);
            }
        }

        // Soft-delete variants that are no longer in the request
        product.variants.forEach(variant => {
            if (!variant.isDeleted && !incomingVariantIds.has(variant._id?.toString())) { // Check if _id exists
                variant.isDeleted = true;
                variant.deletedAt = new Date();
                console.log(`Variant ${variant._id} soft-deleted.`);
                // Note: We don't record 'deletedBy' at variant level in this schema, but could be added.
            }
        });
        console.log('Product Mongoose doc before save (after variant processing):', product);


        await product.save();
        console.log('Product saved successfully!');
        res.status(200).json(product);

    } catch (error) {
        console.error('Caught error in updateProduct:', error);
        cleanupUploadedFiles(req.files);
        next(error);
    } finally {
        console.log('--- updateProduct End ---');
    }
};

const deleteProduct = async (req, res, next) => {
    // TODO: This function is mostly correct but review to ensure it cascades as expected.
    // The current implementation soft-deletes the whole product, which is good.
    // We might also need a method to soft-delete a single VARIANT.
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid product ID format' });
        }

        const product = await Product.findOneAndUpdate(
            { _id: id, isDeleted: false },
            {
                isDeleted: true,
                deletedAt: new Date(),
                deletedBy: req.user ? req.user._id : null,
                isActive: false,
            },
            { new: true }
        );

        if (!product) {
            return res.status(404).json({ message: 'Product not found or already deleted' });
        }

        res.status(200).json({ message: 'Product and all its variants have been soft-deleted.' });
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