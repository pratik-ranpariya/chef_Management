const mongoose = require("mongoose");

const PostFollow = mongoose.model('PostFollow', new mongoose.Schema({
    chef_id: {
        type: String,
        default: null
    },
    user_id: {
        type: String,
        default: null
    },
}, { timestamps: true }));

exports.PostFollow = PostFollow;