const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    seq: {
        type: Number,
        default: 0
    },
    lastDate: {
        type: String, // YYYYMMDD
        required: true
    }
});

module.exports = mongoose.model('Counter', counterSchema);
