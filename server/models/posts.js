const mongoose = require("mongoose");

const Post = mongoose.model('Post', new mongoose.Schema({
    chef_id: {
        type: String,
        default: null
    },
    post_content: {
        type: String,
        default: null
    },
    description: {
        type: String,
        default: null
    },
    location: {
        type: String,
        default: null
    },
    rate: {
        type: Number,
        default: 0
    },
    likes: {
        type: Number,
        default: 0
    },
    comments: {
        type: Number,
        default: 0
    },
    share: {
        type: Number,
        default: 0
    },
    is_like: {
        type: Boolean,
        default: false
    }
}, { timestamps: true }));

exports.Post = Post;