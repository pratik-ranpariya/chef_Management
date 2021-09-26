const mongoose = require("mongoose");

const Rate = mongoose.model('Rate', new mongoose.Schema({
    item_type: {
        type: String,
        default: null
    },
    item_id: {
        type: String,
        default: null
    },
    user_id: {
        type: String,
        default: null
    },
    rate: {
        type: Number,
        default: 0
    },

}, { timestamps: true }));

exports.Rate = Rate;