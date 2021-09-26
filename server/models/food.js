const mongoose = require("mongoose");

const Food = mongoose.model('Food', new mongoose.Schema({
    chef_id: {
        type: String,
        default: null
    },
    food_content: {
        type: String,
        default: null
    },
    cuisine_type: {
        type: [String],
        default: null
    },
    diet_type: {
        type: [String],
        default: null
    },
    food_name: {
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
    price: {
        type: Number,
        default: null
    },
    available: {
        pickup: {
            type: Boolean,
            default: false
        },
        delivery: {
            value: {
                type: Boolean,
                default: false
            },
            fee: {
                type: Number,
                default: 0
            }
        },
        shipping: {
            value: {
                type: Boolean,
                default: false
            },
            fee: {
                type: Number,
                default: 0
            }
        }
    },
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
    }
}, { timestamps: true }));

exports.Food = Food;