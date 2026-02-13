const SaleReturn = require('../models/saleReturn.model');
const Sale = require('../models/sale.model');
const BranchStock = require('../models/branchStock.model');
const Product = require('../models/product.model');
const Counter = require('../models/counter.model');

// Helper to generate Return Number: RTN-YYYYMMDD-[BASE36]
const generateReturnNumber = async () => {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const counter = await Counter.findOneAndUpdate(
        { id: 'sale_return' },
        [{ $set: { 
            seq: { $cond: { if: { $eq: ["$lastDate", dateStr] }, then: { $add: ["$seq", 1] }, else: 1 } },
            lastDate: dateStr 
        }}],
        { upsert: true, new: true }
    );
    const serial = counter.seq.toString(36).toUpperCase().padStart(4, '0');
    return `RTN-${dateStr}-${serial}`;
};

exports.processReturn = async (req, res) => {
    try {
        const { saleId, type, returnedItems, exchangedItems } = req.body;
        const userId = req.user._id;

        // 1. Fetch Original Sale
        const originalSale = await Sale.findById(saleId);
        if (!originalSale) return res.status(404).json({ success: false, message: 'Original sale not found' });

        const returnNumber = await generateReturnNumber();
        let totalRefundValue = 0;
        let totalExchangeValue = 0;

        // 2. Process Returned Items
        for (const item of returnedItems) {
            // Find item in original sale to validate
            const originalItem = originalSale.items.find(
                i => i.product.toString() === item.product && i.variantId.toString() === item.variantId
            );

            if (!originalItem) throw new Error(`Item ${item.productName} was not part of the original sale`);
            if (item.quantity > originalItem.quantity) throw new Error(`Cannot return more than purchased for ${item.productName}`);

            totalRefundValue += (originalItem.unitPrice * item.quantity);

            // Update Stock if condition is GOOD
            if (item.condition === 'GOOD') {
                await BranchStock.findOneAndUpdate(
                    { branch: originalSale.branch, product: item.product, variantId: item.variantId },
                    { $inc: { quantity: item.quantity } },
                    { upsert: true }
                );
            }
        }

        // 3. Process Exchanged Items (if any)
        const processedExchanges = [];
        if (type === 'EXCHANGE' && exchangedItems) {
            for (const item of exchangedItems) {
                const product = await Product.findById(item.product);
                const variant = product.variants.id(item.variantId);
                const price = variant.priceHistory[variant.priceHistory.length - 1].sellingPrice;
                const subtotal = price * item.quantity;

                // Check stock for new items
                const branchStock = await BranchStock.findOne({
                    branch: originalSale.branch,
                    product: item.product,
                    variantId: item.variantId
                });

                if (!branchStock || branchStock.quantity < item.quantity) {
                    throw new Error(`Insufficient stock for exchange item: ${product.productName}`);
                }

                // Deduct stock
                branchStock.quantity -= item.quantity;
                await branchStock.save();

                totalExchangeValue += subtotal;
                processedExchanges.push({
                    product: item.product,
                    variantId: item.variantId,
                    productName: product.productName,
                    sku: variant.sku,
                    quantity: item.quantity,
                    unitPrice: price,
                    subtotal
                });
            }
        }

        // 4. Create Return Record
        const saleReturn = new SaleReturn({
            returnNumber,
            originalSale: saleId,
            branch: originalSale.branch,
            type,
            returnedItems,
            exchangedItems: processedExchanges,
            totalRefundAmount: type === 'RETURN' ? totalRefundValue : 0,
            totalExchangeDifference: type === 'EXCHANGE' ? (totalExchangeValue - totalRefundValue) : 0,
            performedBy: userId
        });

        await saleReturn.save();

        res.status(201).json({ success: true, data: saleReturn });

    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// GET COMPLETE HISTORY OF A BILL
exports.getSaleHistory = async (req, res) => {
    try {
        const { saleId } = req.params;
        
        // Fetch original sale
        const sale = await Sale.findById(saleId)
            .populate('branch', 'branch_name')
            .populate('cashier', 'firstName lastName')
            .populate('items.product', 'productName');

        if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });

        // Fetch all returns/exchanges for this sale
        const history = await SaleReturn.find({ originalSale: saleId })
            .populate('performedBy', 'firstName lastName')
            .sort({ createdAt: 1 });

        res.status(200).json({
            success: true,
            data: {
                originalSale: sale,
                activityLog: history
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
