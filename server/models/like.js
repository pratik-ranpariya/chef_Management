const mongoose = require("mongoose");

const Like = mongoose.model('Like', new mongoose.Schema({
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

exports.Like = Like;