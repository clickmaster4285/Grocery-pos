const Terminal = require('../models/terminal.model');
const Branch = require('../models/branch.model');
const Counter = require('../models/counter.model');
const TerminalShiftReport = require('../models/terminalShiftReport.model');
const mongoose = require('mongoose');
const { 
    createTerminalSchema, 
    updateTerminalSchema, 
    openSessionSchema, 
    closeSessionSchema 
} = require('../validation/terminal.validation');

// Helper to generate terminal ID: TRM-[BASE36_SERIAL]
const generateTerminalId = async () => {
    const counter = await Counter.findOneAndUpdate(
        { id: 'terminal_id' },
        [
            {
                $set: {
                    seq: { $add: [{ $ifNull: ["$seq", 0] }, 1] }
                }
            }
        ],
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const serial = counter.seq.toString(36).toUpperCase().padStart(3, '0');
    return `TRM-${serial}`;
};

// Create a new terminal
exports.createTerminal = async (req, res, next) => {
    try {
        const { error, value } = createTerminalSchema.validate(req.body, { abortEarly: false });
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                details: error.details.map(detail => detail.message)
            });
        }

        // 1. Determine Branch ID
        let branchId;
        if (req.user.role === 'admin') {
            // Admin must provide branch in body
            branchId = value.branch || req.body.branch;
        } else {
            // Non-admins use their own branch
            branchId = req.user.branch?._id || req.user.branch;
        }

        if (!branchId) {
            return res.status(400).json({ 
                success: false, 
                message: req.user.role === 'admin' ? 'Branch selection is required for admins.' : 'Your account is not assigned to a branch.' 
            });
        }

        // 2. Ensure value.branch is set for Mongoose
        value.branch = branchId;

        // Generate Terminal ID
        const terminalId = await generateTerminalId();

        const terminal = await Terminal.create({
            ...value,
            terminalId
        });

        // Add terminal reference to the branch
        await Branch.findByIdAndUpdate(value.branch, {
            $addToSet: { terminals: terminal._id }
        });

        res.status(201).json({
            success: true,
            message: 'Terminal created successfully',
            data: terminal
        });
    } catch (error) {
        next(error);
    }
};

// Get all terminals for a branch
exports.getAllTerminals = async (req, res, next) => {
    try {
        const { status } = req.query;
        let query = { isActive: true };

        if (status) query.status = status;

        // Use branch filter from middleware (req.query.branch)
        if (req.query.branch) {
            query.branch = req.query.branch;
        }

        const terminals = await Terminal.find(query)
            .populate('branch', 'branch_name')
            .populate('activeSession.userId', 'firstName lastName');

        res.status(200).json({
            success: true,
            count: terminals.length,
            data: terminals
        });
    } catch (error) {
        next(error);
    }
};

// Get terminal by ID
exports.getTerminalById = async (req, res, next) => {
    try {
        const query = { _id: req.params.id, isActive: true };
        
        // Apply branch filter from middleware
        if (req.query.branch) {
            query.branch = req.query.branch;
        }

        const terminal = await Terminal.findOne(query)
            .populate('branch', 'branch_name')
            .populate('activeSession.userId', 'firstName lastName');

        if (!terminal) {
            return res.status(404).json({ success: false, message: 'Terminal not found or access denied' });
        }

        res.status(200).json({ success: true, data: terminal });
    } catch (error) {
        next(error);
    }
};

// Update terminal
exports.updateTerminal = async (req, res, next) => {
    try {
        const { error, value } = updateTerminalSchema.validate(req.body, { abortEarly: false });
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                details: error.details.map(detail => detail.message)
            });
        }

        const query = { _id: req.params.id, isActive: true };
        if (req.query.branch) {
            query.branch = req.query.branch;
        }

        const terminal = await Terminal.findOneAndUpdate(
            query,
            { ...value },
            { new: true, runValidators: true }
        );

        if (!terminal) {
            return res.status(404).json({ success: false, message: 'Terminal not found or access denied' });
        }

        res.status(200).json({
            success: true,
            message: 'Terminal updated successfully',
            data: terminal
        });
    } catch (error) {
        next(error);
    }
};

// Open Terminal Session (Shift Start)
exports.openSession = async (req, res, next) => {
    try {
        const { error, value } = openSessionSchema.validate(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

        const terminal = await Terminal.findOne({ _id: req.params.id, isActive: true });
        if (!terminal) return res.status(404).json({ success: false, message: 'Terminal not found' });

        if (terminal.status !== 'Closed') {
            return res.status(400).json({ success: false, message: `Terminal is currently ${terminal.status}. Close previous session first.` });
        }

        // 1. Security Check: Allowed Terminals
        // If the user has a restricted terminal list, ensure this terminal is on it.
        if (req.user.role !== 'admin' && req.user.allowedTerminals?.length > 0) {
            const isAllowed = req.user.allowedTerminals.some(t => t.toString() === terminal._id.toString());
            if (!isAllowed) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Security Alert: You are not authorized to operate this specific terminal.' 
                });
            }
        }

        // 2. Initialize Session
        terminal.activeSession = {
            userId: req.user._id, // Use _id to ensure it saves correctly
            openedAt: new Date(),
            openingFloat: value.openingFloat,
            currentDrawerBalance: value.openingFloat,
            transactionCount: 0
        };
        terminal.status = 'Available';

        await terminal.save();

        // 3. Security Protocol: Deactivate general system access during session
        if (req.user.role !== 'admin') {
            const User = require('../models/User');
            await User.findByIdAndUpdate(req.user._id, { hasSystemAccess: false });
        }

        res.status(200).json({
            success: true,
            message: 'Session opened successfully. Security protocol engaged.',
            data: terminal
        });
    } catch (error) {
        next(error);
    }
};

// Close Terminal Session (Shift End)
exports.closeSession = async (req, res, next) => {
    try {
        const { error, value } = closeSessionSchema.validate(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

        const terminal = await Terminal.findOne({ _id: req.params.id, isActive: true });
        if (!terminal) return res.status(404).json({ success: false, message: 'Terminal not found' });

        if (terminal.status === 'Closed') {
            return res.status(400).json({ success: false, message: 'Terminal is already closed.' });
        }

        const variance = value.actualCash - terminal.activeSession.currentDrawerBalance;

        // In a real system, we would save this session to a 'TerminalShiftReport' model here.
        // For now, we update the terminal state and clear activeSession.
        
        const closedSessionData = {
            ...terminal.activeSession.toObject(),
            closedAt: new Date(),
            actualCashCount: value.actualCash,
            variance: variance,
            notes: value.notes
        };

        const newShiftReport = await TerminalShiftReport.create({
            terminal: terminal._id,
            user: terminal.activeSession.userId,
            branch: terminal.branch,
            openedAt: terminal.activeSession.openedAt,
            closedAt: new Date(),
            openingFloat: terminal.activeSession.openingFloat,
            closingFloat: value.actualCash,
            expectedFloat: terminal.activeSession.currentDrawerBalance,
            variance: variance,
            totalSalesCount: terminal.activeSession.transactionCount,
            notes: value.notes,
            status: 'Completed',
            // totalSalesAmount will require aggregating sales, which is a larger task.
            // For now, we'll leave it as default or fetch it later.
        });

        const cashierId = terminal.activeSession.userId; // Get cashierId before clearing activeSession

        terminal.activeSession = undefined;
        terminal.status = 'Closed';

        await terminal.save();

        // 4. Restore Security Protocol: Reactivate general system access
        if (cashierId) {
            const User = require('../models/User');
            const cashier = await User.findById(cashierId);
            if (cashier && cashier.role !== 'admin') {
                cashier.hasSystemAccess = true;
                await cashier.save();
            }
        }

        res.status(200).json({
            success: true,
            message: 'Session closed successfully. Security protocol disengaged.',
            data: {
                report: newShiftReport // Return the full report
            }
        });
    } catch (error) {
        next(error);
    }
};

// Soft Delete Terminal
exports.deleteTerminal = async (req, res, next) => {
    try {
        const query = { _id: req.params.id };
        if (req.query.branch) {
            query.branch = req.query.branch;
        }

        const terminal = await Terminal.findOneAndUpdate(query, { isActive: false }, { new: true });
        if (!terminal) return res.status(404).json({ success: false, message: 'Terminal not found or access denied' });

        // Remove reference from branch
        await Branch.findByIdAndUpdate(terminal.branch, {
            $pull: { terminals: terminal._id }
        });

        res.status(200).json({ success: true, message: 'Terminal deleted successfully' });
    } catch (error) {
        next(error);
    }
};
