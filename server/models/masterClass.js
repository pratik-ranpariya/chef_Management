const mongoose = require("mongoose");

const MasterClass = mongoose.model('MasterClass', new mongoose.Schema({
    chef_id: {
        type: String,
        default: null
    },
    title: {
        type: String,
        default: null
    },
    cuisine: {
        type: String,
        default: null
    },
    dietary: {
        type: String,
        default: null
    },
    description: {
        type: String,
        default: null
    },
    ingredients: {
        type: String,
        default: null
    },
    start_date: {
        type: Date,
        default: null
    },
    start_time: {
        type: String,
        default: null
    },
    time_zone: {
        type: String,
        default: null
    },
    duration: {
        type: String,
        default: null
    },
    location: {
        type: String,
        default: null
    },
    ticket_group_number: {
        type: String,
        default: null
    },
    price: {
        type: String,
        default: null
    },
    available_ticket: {
        type: Number,
        default: 0
    },
    total_ticket: {
        type: Number,
        default: 0
    },
    request_count: {
        type: Number,
        default: 0
    },
    notification: Boolean,
    mclass_content: {
        type: String,
        default: null
    },
    video_type: {
        type: String,
        default: null
    },
    video_url: {
        type: String,
        default: null
    },
    chef_rate: {
        type: Number,
        default: 0
    }
}, { timestamps: true }));

exports.MasterClass = MasterClass;