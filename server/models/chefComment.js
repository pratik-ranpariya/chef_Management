const mongoose = require("mongoose");

const ChefComment = mongoose.model('ChefComment', new mongoose.Schema({
    chef_id: {
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
    }
}, { timestamps: true }));

exports.Comment = ChefComment;