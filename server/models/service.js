const mongoose = require("mongoose");

const Service = mongoose.model('Service', new mongoose.Schema({
    chef_id: {
        type: String,
        default: null
    },
    service_content: {
        type: String,
        default: null
    },
    service_type: {
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
    service_days_hour: [{
        day: {
            type: String,
            default: null
        },
        start_time: {
            type: String,
            default: null
        },
        end_time: {
            type: String,
            default: null
        }
    }],
    price: Number,
    comments: {
        type: Number,
        default: 0
    },
    likes: {
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
    },
    rate: {
        type: Number,
        default: 0
    },
    available: {
        pickup: {
            type: Boolean,
            default: false
        },
        delivery: {
            type: Boolean,
            default: false
        },
        fee: {
            type: Number,
            default: 0
        }
    }
}, { timestamps: true }));

exports.Service = Service;