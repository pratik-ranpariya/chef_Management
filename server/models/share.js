const mongoose = require("mongoose");

const Share = mongoose.model('Share', new mongoose.Schema({
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
    }
}, { timestamps: true }));

exports.Share = Share;