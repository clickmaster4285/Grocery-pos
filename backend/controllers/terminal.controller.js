const Terminal = require('../models/terminal.model');
const Branch = require('../models/branch.model');
const Counter = require('../models/counter.model');
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

        // Generate Terminal ID if not provided
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
        const { branchId, status } = req.query;
        let query = { isActive: true };

        if (branchId) query.branch = branchId;
        if (status) query.status = status;

        // Role-based isolation
        if (req.user.role !== 'admin' && req.user.branch_id) {
            query.branch = req.user.branch_id;
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
        const terminal = await Terminal.findOne({ _id: req.params.id, isActive: true })
            .populate('branch', 'branch_name')
            .populate('activeSession.userId', 'firstName lastName');

        if (!terminal) {
            return res.status(404).json({ success: false, message: 'Terminal not found' });
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

        const terminal = await Terminal.findOneAndUpdate(
            { _id: req.params.id, isActive: true },
            { ...value },
            { new: true, runValidators: true }
        );

        if (!terminal) {
            return res.status(404).json({ success: false, message: 'Terminal not found' });
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

        terminal.activeSession = {
            userId: req.user.id,
            openedAt: new Date(),
            openingFloat: value.openingFloat,
            currentDrawerBalance: value.openingFloat,
            transactionCount: 0
        };
        terminal.status = 'Available';

        await terminal.save();

        res.status(200).json({
            success: true,
            message: 'Session opened successfully',
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

        terminal.activeSession = undefined;
        terminal.status = 'Closed';

        await terminal.save();

        res.status(200).json({
            success: true,
            message: 'Session closed successfully',
            data: {
                report: closedSessionData
            }
        });
    } catch (error) {
        next(error);
    }
};

// Soft Delete Terminal
exports.deleteTerminal = async (req, res, next) => {
    try {
        const terminal = await Terminal.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
        if (!terminal) return res.status(404).json({ success: false, message: 'Terminal not found' });

        // Remove reference from branch
        await Branch.findByIdAndUpdate(terminal.branch, {
            $pull: { terminals: terminal._id }
        });

        res.status(200).json({ success: true, message: 'Terminal deleted successfully' });
    } catch (error) {
        next(error);
    }
};
