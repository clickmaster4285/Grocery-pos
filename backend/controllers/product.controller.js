const Product = require('../models/product.model');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { createProductSchema, updateProductSchema } = require('../validation/product.validation');

const generateUniqueSku = (productName, attributes) => {
    const sanitize = (str) => str ? str.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 4) : '';
    const productPart = sanitize(productName);
    const attrsPart = attributes.map(attr => sanitize(attr.value)).join('');
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();

    let sku = `${productPart}-${attrsPart}-${randomSuffix}`;
    return sku.substring(0, 50); // Ensure it doesn't exceed max length
};

const validateVariantData = async (variant, productName, existingProductId, uniquenessCheckSets) => {
    let { sku, barcode, qrCode } = variant;

    // SKU should already be uppercased and validated by Joi, or generated and uppercased before this
    sku = sku.toUpperCase();

    // Check for duplicates within the same request
    if (uniquenessCheckSets.skus.has(sku)) return `Duplicate SKU found in request: ${sku}`;
    uniquenessCheckSets.skus.add(sku);

    if (barcode && uniquenessCheckSets.barcodes.has(barcode)) return `Duplicate barcode found in request: ${barcode}`;
    if (barcode) uniquenessCheckSets.barcodes.add(barcode);

    if (qrCode && uniquenessCheckSets.qrCodes.has(qrCode)) return `Duplicate QR code found in request: ${qrCode}`;
    if (qrCode) uniquenessCheckSets.qrCodes.add(qrCode);

    // Check for duplicates in the database
    const orQuery = [{ 'variants.sku': sku }];
    if (barcode) orQuery.push({ 'variants.barcode': barcode });
    if (qrCode) orQuery.push({ 'variants.qrCode': qrCode });

    const query = { $or: orQuery, isDeleted: false, 'variants.isDeleted': false };
    if (existingProductId) {
        query._id = { $ne: existingProductId };
    }

    const existingProduct = await Product.findOne(query);
    if (existingProduct) {
        const conflictingVariant = existingProduct.variants.find(v =>
            (v.sku === sku && !v.isDeleted) ||
            (barcode && v.barcode === barcode && !v.isDeleted) ||
            (qrCode && v.qrCode === qrCode && !v.isDeleted)
        );
        if (conflictingVariant) {
            if (conflictingVariant.sku === sku) return `SKU '${sku}' already exists.`;
            if (barcode && conflictingVariant.barcode === barcode) return `Barcode '${barcode}' already exists.`;
            if (qrCode && conflictingVariant.qrCode === qrCode) return `QR Code '${qrCode}' already exists.`
        }
    }

    return null;
};

const processAndMoveVariantImages = (files, variants, productName) => {
    // This function can remain largely the same, as it's based on form field names.
    const uploadDir = path.join(__dirname, '../uploads/products');
    const sanitizeFilename = (str) => str ? str.replace(/\s/g, '-') : 'unknown-product';
    const sanitizedProductName = sanitizeFilename(productName);

    const uploadedFileMap = new Map();
    if (files) {
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
    }


    return variants.map((variant, variantIdx) => {
        const updatedImages = (variant.images || []).map((imgUrl, imageIdx) => {
            const mapKey = `${variantIdx}_${imageIdx}`;
            return uploadedFileMap.has(mapKey) ? uploadedFileMap.get(mapKey) : imgUrl;
        });
        return { ...variant, images: updatedImages };
    });
};

const createProduct = async (req, res, next) => {
    try {
        let parsedProductData;
        try {
            parsedProductData = JSON.parse(req.body.productData);
        } catch (parseError) {
            return res.status(400).json({ message: 'Invalid productData JSON format.' });
        }

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
            branch_id,
            variants,
            isActive,
        } = value; // Use the validated value

        // Use user's branch if not admin
        const final_branch_id = req.user && req.user.role !== 'admin' ? req.user.branch_id : branch_id;
        if (!final_branch_id) {
            // This case should ideally be caught by Joi if branch_id is required for admins
            return res.status(400).json({ message: 'Branch ID is required.' });
        }
        // Ensure the final_branch_id is set for validation in case it came from req.user
        value.branch_id = final_branch_id;

        // Handle file uploads
        if (req.files && req.files.length > 0) {
            variants = processAndMoveVariantImages(req.files, variants, productName);
        }

        // Check for product with the same name in the same branch
        const existingProductByName = await Product.findOne({
            productName,
            branch_id: final_branch_id,
            isDeleted: false
        });
        if (existingProductByName) {
            return res.status(409).json({ message: `Product with name '${productName}' already exists in this branch.` });
        }

        const processedVariants = [];
        const uniquenessCheckSets = { skus: new Set(), barcodes: new Set(), qrCodes: new Set() };

        for (const variantData of variants) {
            const mutableVariant = { ...variantData };

            // Before passing to validateVariantData, ensure SKU is generated if missing
            if (!mutableVariant.sku) {
                mutableVariant.sku = generateUniqueSku(productName, mutableVariant.attributes || []);
            }
            mutableVariant.sku = mutableVariant.sku.toUpperCase();

            // Validate uniqueness against other products and this request (database check)
            const validationError = await validateVariantData(mutableVariant, productName, null, uniquenessCheckSets);
            if (validationError) {
                // Clean up any uploaded files if validation fails
                if (req.files && req.files.length > 0) {
                    req.files.forEach(file => {
                        try { fs.unlinkSync(file.path) } catch (e) { console.error("Error cleaning up file:", e) }
                    });
                }
                return res.status(400).json({ message: validationError });
            }

            const { sku, attributes, buyingPrice, sellingPrice, stock, images, supplier, barcode, qrCode } = mutableVariant;

            // Create initial price history
            const priceHistory = [{
                buyingPrice: Number(buyingPrice),
                sellingPrice: Number(sellingPrice),
                changedBy: req.user._id,
            }];

            // Create initial stock history if stock is added
            const stockHistory = [];
            const initialStock = Number(stock) || 0;
            if (initialStock > 0) {
                stockHistory.push({
                    change: initialStock,
                    type: 'RESTOCK',
                    reason: 'Initial stock',
                    performedBy: req.user._id,
                });
            }

            processedVariants.push({
                sku,
                attributes,
                supplier,
                priceHistory,
                stock: initialStock,
                stockHistory,
                images: images || [],
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
            branch_id: final_branch_id,
            variants: processedVariants,
            isActive,
            lastRestocked: processedVariants.some(v => v.stock > 0) ? new Date() : null,
            isDeleted: false,
        });

        res.status(201).json(product);
    } catch (error) {
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                try {
                    fs.unlinkSync(file.path)
                } catch (e) {
                    console.error("Error cleaning up file:", e)
                }
            });
        }
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
            // Non-admin users should only see products in their own branch
            ...(req.user.role !== 'admin' && { branch_id: new mongoose.Types.ObjectId(req.user.branch_id) })
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
                    branch_id: { $first: '$branch_id' },
                    totalStock: { $first: '$totalStock' }, // This is the pre-calculated total, consider recalculating if needed
                    isActive: { $first: '$isActive' },
                    createdAt: { $first: '$createdAt' },
                    variants: { $push: '$variants' }
                }
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            // Populate branch, category, brand, and supplier
            {
                $lookup: {
                    from: 'branches',
                    localField: 'branch_id',
                    foreignField: '_id',
                    as: 'branch_id'
                }
            },
            { $unwind: { path: '$branch_id', preserveNullAndEmptyArrays: true } },
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
                    branch_id: { $first: '$branch_id' },
                    totalStock: { $first: '$totalStock' },
                    isActive: { $first: '$isActive' },
                    createdAt: { $first: '$createdAt' },
                    updatedAt: { $first: '$updatedAt' },
                    variants: { $push: '$variants' }
                }
            },
            // Populate lookups
            { $lookup: { from: 'branches', localField: 'branch_id', foreignField: '_id', as: 'branch_id' } },
            { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'category' } },
            { $lookup: { from: 'brands', localField: 'brand', foreignField: '_id', as: 'brand' } },
            { $lookup: { from: 'users', localField: 'variants.priceHistory.changedBy', foreignField: '_id', as: 'priceChangers' } },
            { $lookup: { from: 'users', localField: 'variants.stockHistory.performedBy', foreignField: '_id', as: 'stockPerformers' } },
            { $lookup: { from: 'suppliers', localField: 'variants.supplier', foreignField: '_id', as: 'suppliers' } },
            { $unwind: { path: '$branch_id', preserveNullAndEmptyArrays: true } },
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

        let parsedProductData;
        try {
            parsedProductData = JSON.parse(req.body.productData);
        } catch (parseError) {
            return res.status(400).json({ message: 'Invalid productData JSON format.' });
        }

        // Use Joi to validate the incoming data for update
        const { error, value } = updateProductSchema.validate(parsedProductData, { abortEarly: false });
        if (error) {
            return res.status(400).json({
                message: 'Validation failed',
                details: error.details.map(detail => detail.message)
            });
        }

        let { variants, ...otherProductData } = value; // Use the validated value

        // Handle file uploads
        if (req.files && req.files.length > 0) {
            variants = processAndMoveVariantImages(req.files, variants, product.productName);
        }

        // Update top-level product fields (productName, description, category, brand, isActive)
        Object.assign(product, otherProductData);

        if (variants !== undefined) { // Only update variants if they are provided in the request
            const uniquenessCheckSets = { skus: new Set(), barcodes: new Set(), qrCodes: new Set() };
            const incomingVariantIds = new Set();

            for (const variantData of variants) {
                const mutableVariant = { ...variantData };
                incomingVariantIds.add(mutableVariant._id?.toString());

                // Ensure SKU is generated if missing for new variants
                if (!mutableVariant.sku) {
                    mutableVariant.sku = generateUniqueSku(product.productName, mutableVariant.attributes || []);
                }
                mutableVariant.sku = mutableVariant.sku.toUpperCase();


                if (mutableVariant._id) { // Existing variant
                    const variantToUpdate = product.variants.id(mutableVariant._id);
                    if (!variantToUpdate || variantToUpdate.isDeleted) continue; // Skip if variant not found or already deleted

                    // Validate uniqueness against other products and this request (database check)
                    const validationError = await validateVariantData(mutableVariant, product.productName, product._id, uniquenessCheckSets);
                    if (validationError) return res.status(400).json({ message: validationError });

                    // Price History
                    const latestPrice = variantToUpdate.priceHistory[variantToUpdate.priceHistory.length - 1];
                    const newBuyingPrice = Number(mutableVariant.buyingPrice);
                    const newSellingPrice = Number(mutableVariant.sellingPrice);
                    if (latestPrice.buyingPrice !== newBuyingPrice || latestPrice.sellingPrice !== newSellingPrice) {
                        variantToUpdate.priceHistory.push({
                            buyingPrice: newBuyingPrice,
                            sellingPrice: newSellingPrice,
                            changedBy: req.user._id,
                        });
                    }

                    // Stock History
                    const stockChange = Number(mutableVariant.stock) - variantToUpdate.stock;
                    if (stockChange !== 0) {
                        const stockChangeType = mutableVariant.stockChangeType || 'ADJUSTMENT';
                        const stockChangeReason = mutableVariant.stockChangeReason || 'Manual update';

                        variantToUpdate.stockHistory.push({
                            change: stockChange,
                            type: stockChangeType,
                            reason: stockChangeReason,
                            performedBy: req.user._id,
                        });
                        variantToUpdate.stock = mutableVariant.stock;
                        if (stockChange > 0) product.lastRestocked = new Date();

                        /*
                         * INTEGRATION SUGGESTION for StockTransaction module:
                         * This is an ideal place to create a corresponding 'StockTransaction' document
                         * to ensure all stock movements are logged centrally for reporting.
                         *
                         * Example:
                         * await StockTransaction.create({
                         *   productId: product._id,
                         *   variantId: variantToUpdate._id,
                         *   sku: variantToUpdate.sku,
                         *   branchId: product.branch_id,
                         *   type: stockChangeType,
                         *   change: stockChange,
                         *   reason: stockChangeReason,
                         *   performedBy: req.user._id,
                         * });
                        */
                    }

                    // Update other fields
                    Object.assign(variantToUpdate, {
                        attributes: mutableVariant.attributes,
                        supplier: mutableVariant.supplier,
                        barcode: mutableVariant.barcode,
                        qrCode: mutableVariant.qrCode,
                        images: mutableVariant.images || variantToUpdate.images,
                    });

                } else { // New variant
                    const validationError = await validateVariantData(mutableVariant, product.productName, product._id, uniquenessCheckSets);
                    if (validationError) {
                        // Clean up any uploaded files if validation fails
                        if (req.files && req.files.length > 0) {
                            req.files.forEach(file => {
                                try { fs.unlinkSync(file.path) } catch (e) { console.error("Error cleaning up file:", e) }
                            });
                        }
                        return res.status(400).json({ message: validationError });
                    }

                    const newVariant = {
                        ...mutableVariant,
                        priceHistory: [{
                            buyingPrice: Number(mutableVariant.buyingPrice),
                            sellingPrice: Number(mutableVariant.sellingPrice),
                            changedBy: req.user._id,
                        }],
                        stockHistory: [],
                    };

                    const initialStock = Number(mutableVariant.stock) || 0;
                    if (initialStock > 0) {
                        newVariant.stockHistory.push({
                            change: initialStock,
                            type: 'RESTOCK',
                            reason: 'Initial stock for new variant',
                            performedBy: req.user._id,
                        });
                        product.lastRestocked = new Date();
                    }
                    product.variants.push(newVariant);
                }
            }

            // Soft-delete variants that are no longer in the request
            // This loop identifies variants that were in the DB but not in the incoming `variants` array (and are not already deleted)
            product.variants.forEach(variant => {
                if (!variant.isDeleted && !incomingVariantIds.has(variant._id.toString())) {
                    variant.isDeleted = true;
                    variant.deletedAt = new Date();
                    // Note: We don't record 'deletedBy' at variant level in this schema, but could be added.
                }
            });
        }

        await product.save();
        res.status(200).json(product);

    } catch (error) {
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                try { fs.unlinkSync(file.path) } catch (e) { console.error("Error cleaning up file:", e) }
            });
        }
        next(error);
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