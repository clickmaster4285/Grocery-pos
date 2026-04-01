
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../../models/User');
const Counter = require('../../models/counter.model');

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;
        if (!mongoURI) throw new Error('MONGODB_URI is not defined in .env');
        await mongoose.connect(mongoURI);
        console.log('🍃 MongoDB Connected');
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        process.exit(1);
    }
};

const getAdminUser = async () => {
    const admin = await User.findOne({ role: 'admin', isDeleted: false });
    if (!admin) {
        console.error('❌ Admin user not found. Please run the server first to bootstrap the admin account.');
        process.exit(1);
    }
    return admin;
};

const generateBase36Code = async (id, prefix) => {
    const counter = await Counter.findOneAndUpdate(
        { id: id },
        [
            {
                $set: {
                    seq: { $add: [{ $ifNull: ["$seq", 0] }, 1] },
                    lastDate: new Date().toISOString().slice(0, 10).replace(/-/g, '')
                }
            }
        ],
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const serial = counter.seq.toString(36).toUpperCase().padStart(3, '0');
    return `${prefix}-${serial}`;
};

const randomString = (length) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

const pickRandom = (array) => array[Math.floor(Math.random() * array.length)];

module.exports = {
    connectDB,
    getAdminUser,
    generateBase36Code,
    randomString,
    pickRandom
};
