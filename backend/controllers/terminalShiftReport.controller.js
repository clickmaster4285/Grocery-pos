const TerminalShiftReport = require('../models/terminalShiftReport.model');
const mongoose = require('mongoose');

exports.getAllTerminalShiftReports = async (req, res, next) => {
    try {
        const { 
            terminalId, 
            userId, 
            branchId, 
            userName, 
            branchName, 
            startDate, 
            endDate, 
            status, 
            page = 1, 
            limit = 10 
        } = req.query;
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const limitNum = parseInt(limit);

        // Build the aggregation pipeline
        let pipeline = [];

        // 1. Initial Match (Direct fields in TerminalShiftReport)
        let match = {};
        if (status) match.status = status;
        
        // Role-based isolation (ensure users only see reports from their branch unless admin)
        if (req.user.role !== 'admin' && req.user.branch_id) {
            match.branch = new mongoose.Types.ObjectId(req.user.branch_id);
        } else if (branchId) {
            match.branch = new mongoose.Types.ObjectId(branchId);
        }

        if (terminalId) match.terminal = new mongoose.Types.ObjectId(terminalId);
        if (userId) match.user = new mongoose.Types.ObjectId(userId);

        if (startDate || endDate) {
            match.closedAt = {};
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                match.closedAt.$gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                match.closedAt.$lte = end;
            }
        }

        pipeline.push({ $match: match });

        // 2. Lookups for related data
        pipeline.push(
            {
                $lookup: {
                    from: 'terminals',
                    localField: 'terminal',
                    foreignField: '_id',
                    as: 'terminal'
                }
            },
            { $unwind: { path: '$terminal', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'branches',
                    localField: 'branch',
                    foreignField: '_id',
                    as: 'branch'
                }
            },
            { $unwind: { path: '$branch', preserveNullAndEmptyArrays: true } }
        );

        // 3. Post-lookup Filtering (Smart Search by Name)
        let postMatch = {};
        
        if (userName) {
            const tokens = userName.trim().split(/\s+/);
            const regex = new RegExp(tokens.map(t => `(?=.*${t})`).join(''), 'i');
            postMatch.$or = [
                { 'user.firstName': regex },
                { 'user.lastName': regex },
                { 'user.userId': regex },
                { $expr: { $regexMatch: { input: { $concat: ['$user.firstName', ' ', '$user.lastName'] }, regex: regex } } }
            ];
        }

        if (branchName) {
            const tokens = branchName.trim().split(/\s+/);
            const regex = new RegExp(tokens.map(t => `(?=.*${t})`).join(''), 'i');
            postMatch['branch.branch_name'] = regex;
        }

        if (Object.keys(postMatch).length > 0) {
            pipeline.push({ $match: postMatch });
        }

        // 4. Count and Paginate
        const countPipeline = [...pipeline, { $count: 'total' }];
        const dataPipeline = [
            ...pipeline,
            { $sort: { closedAt: -1 } },
            { $skip: skip },
            { $limit: limitNum },
            {
                $project: {
                    'user.password': 0,
                    'user.permissions': 0
                }
            }
        ];

        const [countResult, reports] = await Promise.all([
            TerminalShiftReport.aggregate(countPipeline),
            TerminalShiftReport.aggregate(dataPipeline)
        ]);

        const total = countResult.length > 0 ? countResult[0].total : 0;

        res.status(200).json({
            success: true,
            count: reports.length,
            total,
            pagination: {
                totalPages: Math.ceil(total / limitNum),
                currentPage: parseInt(page),
            },
            data: reports
        });

    } catch (error) {
        next(error);
    }
};

exports.getTerminalShiftReportById = async (req, res, next) => {
    try {
        const report = await TerminalShiftReport.findById(req.params.id)
            .populate('terminal', 'name terminalId')
            .populate('user', 'firstName lastName userId')
            .populate('branch', 'branch_name');

        if (!report) {
            return res.status(404).json({ success: false, message: 'Terminal Shift Report not found' });
        }

        // Role-based isolation for single report fetch
        if (req.user.role !== 'admin' && report.branch.toString() !== req.user.branch_id.toString()) {
            return res.status(403).json({ success: false, message: 'Unauthorized access to this report.' });
        }

        res.status(200).json({ success: true, data: report });

    } catch (error) {
        next(error);
    }
};
