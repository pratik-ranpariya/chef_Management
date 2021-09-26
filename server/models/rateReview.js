const mongoose = require("mongoose");

const RateReview = mongoose.model('RateReview', new mongoose.Schema({
    chef_id: {
        type: String,
        default: null
    },
    user: {
        type: String,
        default: null
    },
    service: {
        type: Number,
        default: 0
    },
    food: {
        type: Number,
        default: 0
    },
    personality: {
        type: Number,
        default: 0
    },
    presentation: {
        type: Number,
        default: 0
    },
    review: {
        type: String,
        default: null
    }
}, { timestamps: true }));

exports.RateReview = RateReview;