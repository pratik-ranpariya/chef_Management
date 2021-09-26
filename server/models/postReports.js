const mongoose = require("mongoose");

const PostReports = mongoose.model('PostReports', new mongoose.Schema({
    post_id: {
        type: String,
        default: null
    },
    user_id: {
        type: String,
        default: null
    },
    title: {
        type: String,
        default: null
    }
}, { timestamps: true }));

exports.PostReports = PostReports;