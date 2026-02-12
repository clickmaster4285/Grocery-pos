const Product = require('../models/product.model');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { createProductSchema, updateProductSchema } = require('../validation/product.validation');
const { transformEmptyStringsToNull, cleanupUploadedFiles, createInitialVariantHistory, checkVariantUniqueness } = require('../utils/product.utils');

const MAX_VARIANT_IMAGE_TOTAL_SIZE = 25 * 1024 * 1024; // 25MB file size limit per variant

const generateUniqueSku = (productName, attributes) => {
    const sanitize = (str) => str ? str.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 4) : '';
    const productPart = sanitize(productName);
    const attrsPart = (attributes || []).map(attr => sanitize(attr.value)).join('');
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();

    let sku = `${productPart}-${attrsPart}-${randomSuffix}`;
    return sku.substring(0, 50); // Ensure it doesn't exceed max length
};


const _validateVariantUniqueness = async (field, value, productId, variantId, reqFiles) => {
    if (!value) return; // No need to check uniqueness for empty values

    const isUnique = await checkVariantUniqueness(field, value, productId, variantId);
    if (!isUnique) {
        cleanupUploadedFiles(reqFiles);
        throw new Error(`${field.toUpperCase()} '${value}' already exists.`);
    }
};

const _processVariantData = async (variantData, productName, productId, variantId, reqFiles, userId) => {
    const mutableVariant = { ...variantData };

    if (mutableVariant.sku instanceof Promise) mutableVariant.sku = await mutableVariant.sku;
    if (mutableVariant.barcode instanceof Promise) mutableVariant.barcode = await mutableVariant.barcode;
    if (mutableVariant.qrCode instanceof Promise) mutableVariant.qrCode = await mutableVariant.qrCode;

    if (!mutableVariant.sku) {
        mutableVariant.sku = generateUniqueSku(productName, mutableVariant.attributes || []);
    }
    mutableVariant.sku = (mutableVariant.sku || '').toUpperCase();

    await _validateVariantUniqueness('sku', mutableVariant.sku, productId, variantId, reqFiles);
    if (mutableVariant.barcode) {
        await _validateVariantUniqueness('barcode', mutableVariant.barcode, productId, variantId, reqFiles);
    }
    if (mutableVariant.qrCode) {
        await _validateVariantUniqueness('qrCode', mutableVariant.qrCode, productId, variantId, reqFiles);
    }

    const { priceHistory, stockHistory, initialStock } = createInitialVariantHistory(mutableVariant, userId);

    return {
        ...mutableVariant,
        priceHistory,
        stock: initialStock,
        stockHistory,
        images: mutableVariant.images || [],
        attributes: mutableVariant.attributes || [],
    };
};

const processAndMoveVariantImages = (files, variants, productName) => {
    const uploadDir = path.join(__dirname, '../uploads/products');
    fs.mkdirSync(uploadDir, { recursive: true });
    const sanitizeFilename = (str) => str ? str.replace(/\s/g, '-') : 'unknown-product';
    const sanitizedProductName = sanitizeFilename(productName);

    const uploadedFilesByVariant = {};

    if (files) {
        files.forEach(file => {
            const match = file.fieldname.match(/variant_(\d+)_image_(\d+)/);
            if (match) {
                const variantIndex = parseInt(match[1]);
                if (!uploadedFilesByVariant[variantIndex]) {
                    uploadedFilesByVariant[variantIndex] = [];
                }
                uploadedFilesByVariant[variantIndex].push(file);
            }
        });
    }

    for (const variantIndex in uploadedFilesByVariant) {
        let totalSizeForVariant = 0;
        uploadedFilesByVariant[variantIndex].forEach(file => {
            totalSizeForVariant += file.size;
        });

        if (totalSizeForVariant > MAX_VARIANT_IMAGE_TOTAL_SIZE) {
            throw new Error(`Total size of new images for variant ${parseInt(variantIndex) + 1} exceeds ${MAX_VARIANT_IMAGE_TOTAL_SIZE / (1024 * 1024)}MB.`);
        }
    }

    const processedVariants = variants.map((variant, variantIdx) => {
        const existingImages = variant.images || [];
        const newImagesForVariant = [];

        if (uploadedFilesByVariant[variantIdx]) {
            uploadedFilesByVariant[variantIdx].forEach(file => {
                const newFilename = `${sanitizedProductName}-variant-${variantIdx}-img-${Date.now()}${path.extname(file.originalname)}`;
                const newPath = path.join(uploadDir, newFilename);
                fs.renameSync(file.path, newPath);
                newImagesForVariant.push(`/uploads/products/${newFilename}`);
            });
        }
        const updatedVariant = { ...variant, images: [...existingImages, ...newImagesForVariant] };
        return updatedVariant;
    });
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
        parsedProductData = transformEmptyStringsToNull(parsedProductData);

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
        } = value;

        if (req.files && req.files.length > 0) {
            variants = processAndMoveVariantImages(req.files, variants, productName);
        }

        const processedVariants = [];
        for (const variantData of variants) {
            const processedVariant = await _processVariantData(variantData, productName, null, null, req.files, req.user._id);
            processedVariants.push(processedVariant);
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

const getAllProducts = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const { search, category, brand } = req.query;

        const matchStage = {
            isDeleted: false,
        };

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
                    variants: { $push: '$variants' }
                }
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
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
            { $project: { suppliers: 0 } }
        ];

        const products = await Product.aggregate(aggregationPipeline);

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
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid product ID format' });
        }

        // Fetch the raw product document without any aggregation
        const product = await Product.findById(id)
            .populate('category')
            .populate('brand')
            .populate({
                path: 'variants.supplier',
                select: 'name'
            })
            .populate({
                path: 'variants.stockHistory.performedBy',
                select: 'firstName lastName'
            })
            .populate({
                path: 'variants.priceHistory.changedBy',
                select: 'firstName lastName'
            });

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
        parsedProductData = transformEmptyStringsToNull(parsedProductData);

        // Recursively remove null properties from variants and other top-level optional fields
        if (parsedProductData.variants && Array.isArray(parsedProductData.variants)) {
            parsedProductData.variants = parsedProductData.variants.map(variant => {
                const newVariant = { ...variant };
                for (const key in newVariant) {
                    if (newVariant[key] === null) {
                        delete newVariant[key];
                    }
                }
                return newVariant;
            });
        }
        // Also remove nulls from top-level fields that are optional
        for (const key in parsedProductData) {
            if (parsedProductData[key] === null) {
                delete parsedProductData[key];
            }
        }

        const { error, value } = updateProductSchema.validate(parsedProductData, { abortEarly: false });
        if (error) {
            return res.status(400).json({
                message: 'Validation failed',
                details: error.details.map(detail => detail.message)
            });
        }

        let { variants = [], ...otherProductData } = value;

        if (req.files && req.files.length > 0) {
            variants = processAndMoveVariantImages(req.files, variants, product.productName);
        }

        Object.assign(product, otherProductData);

        const incomingVariantIds = new Set();

        for (const variantData of variants) {
            const currentVariantId = variantData._id?.toString();
            incomingVariantIds.add(currentVariantId);

            if (currentVariantId) { // Existing variant
                const variantToUpdate = product.variants.id(currentVariantId);
                if (!variantToUpdate || variantToUpdate.isDeleted) {
                    continue;
                }

                // For existing variants, 'processedVariant' is essentially the validated 'variantData' from the request.
                // _processVariantData is not needed here as it's for initial variant setup (SKU generation, initial history).
                const processedVariant = { ...variantData }; // Clone to avoid direct modification of 'value' from Joi

                // Ensure SKU is generated if empty and then validate uniqueness
                if (!processedVariant.sku) {
                    processedVariant.sku = generateUniqueSku(product.productName, processedVariant.attributes || []);
                }
                processedVariant.sku = (processedVariant.sku || '').toUpperCase();
                await _validateVariantUniqueness('sku', processedVariant.sku, product._id, currentVariantId, req.files);

                // Validate barcode and qrCode uniqueness
                if (processedVariant.barcode) {
                    await _validateVariantUniqueness('barcode', processedVariant.barcode, product._id, currentVariantId, req.files);
                }
                if (processedVariant.qrCode) {
                    await _validateVariantUniqueness('qrCode', processedVariant.qrCode, product._id, currentVariantId, req.files);
                }

                // Price History
                const latestPrice = variantToUpdate.priceHistory && variantToUpdate.priceHistory.length > 0
                    ? variantToUpdate.priceHistory[variantToUpdate.priceHistory.length - 1]
                    : { buyingPrice: 0, sellingPrice: 0 };
                const newBuyingPrice = Number(processedVariant.buyingPrice);
                const newSellingPrice = Number(processedVariant.sellingPrice);
                if (latestPrice.buyingPrice !== newBuyingPrice || latestPrice.sellingPrice !== newSellingPrice) {
                    if (!Array.isArray(variantToUpdate.priceHistory)) variantToUpdate.priceHistory = [];
                    variantToUpdate.priceHistory.push({
                        buyingPrice: newBuyingPrice,
                        sellingPrice: newSellingPrice,
                        changedBy: req.user._id,
                    });
                }

                // Stock History - Handle explicit adjustments from frontend
                const { stockChangeAmount, stockChangeType, stockChangeReason } = variantData; // Use variantData, not processedVariant as _processVariantData is not called here

                if (typeof stockChangeAmount === 'number' && stockChangeType) {
                    const explicitChange = stockChangeAmount;
                    const explicitType = stockChangeType;
                    const explicitReason = stockChangeReason || 'Manual adjustment via form';

                    const newCalculatedStock = variantToUpdate.stock + explicitChange;

                    if (!Array.isArray(variantToUpdate.stockHistory)) variantToUpdate.stockHistory = [];
                    variantToUpdate.stockHistory.push({
                        change: explicitChange,
                        type: explicitType,
                        reason: explicitReason,
                        performedBy: req.user._id,
                    });
                    variantToUpdate.stock = newCalculatedStock; // Update stock with the calculated new value
                    if (explicitChange > 0) product.lastRestocked = new Date();
                }

                // Update other fields
                Object.assign(variantToUpdate, {
                    sku: processedVariant.sku,
                    attributes: processedVariant.attributes || [],
                    supplier: processedVariant.supplier,
                    barcode: processedVariant.barcode,
                    qrCode: processedVariant.qrCode,
                    images: processedVariant.images || [],
                    isDeleted: processedVariant.isDeleted,
                    deletedAt: processedVariant.isDeleted ? variantToUpdate.deletedAt : null,
                });

            } else { // New variant
                const processedVariant = await _processVariantData(variantData, product.productName, product._id, null, req.files, req.user._id);

                if (processedVariant.stock > 0) {
                    product.lastRestocked = new Date();
                }
                product.variants.push(processedVariant);
            }
        }

        product.variants.forEach(variant => {
            if (!variant.isDeleted && !incomingVariantIds.has(variant._id?.toString())) {
                variant.isDeleted = true;
                variant.deletedAt = new Date();
            }
        });

        await product.save();
        res.status(200).json(product);

    } catch (error) {
        cleanupUploadedFiles(req.files);
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