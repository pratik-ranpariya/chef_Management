const mongoose = require("mongoose");

const PostComment = mongoose.model('PostComment', new mongoose.Schema({
    type: {
        type: String,
        default: null
    },
    post_id: {
        type: String,
        default: null
    },
    commenter_id: {
        type: String,
        default: null
    },
    comment: {
        type: String,
        default: null
    },
    reply: [{
        replier_id: {
            type: String,
            default: null
        },
        message: {
            type: String,
            default: null
        }
    }],
    likes: {
        type: Number,
        default: 0
    },
    is_like: {
        type: Boolean,
        default: false
    }
}, { timestamps: true }));

exports.Comment = PostComment;