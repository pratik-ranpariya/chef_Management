const mongoose = require("mongoose");

const User = mongoose.model('User', new mongoose.Schema({
    name: {
        type: String,
        default: null
    },
    user_name: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        default: null
    },
    password: String,
    mobile: {
        type: String,
        default: null
    },
    role_id: Number,
    location: {
        type: String,
        default: null
    },
    profile_image: {
        type: String,
        default: null
    },
    banner_image: {
        type: String,
        default: null
    },
    otp: String,
    favorite_post: [String],
    chef_details: {
        images: [String],
        location: {
            type: String,
            default: null
        },
        date_of_birth: Date,
        gender: {
            type: String,
            default: null
        },
        position: {
            type: String,
            default: null
        },
        restaurant_name: {
            type: String,
            default: null
        },
        languages: [String],
        specialty: [String],
        sort_intro: String,
        background_info: {
            type: String,
            default: null
        },
        address: {
            type: String,
            default: null
        },
        service_hour: [{
            day: {
                type: String,
                default: null
            },
            time: [{
                start_time: {
                    type: String,
                    default: null
                },
                end_time: {
                    type: String,
                    default: null
                }
            }]
        }],
        service: [String],
        min_purchase_amt: Number,
        service_price_range: {
            min: Number,
            max: Number
        },
        service_location: {
            type: String,
            default: null
        },
        payment: [String],
        hourly_rate: {
            type: Number,
            default: 0
        },
        currency: {
            type: String,
            default: null
        },
        subscription: {
            subscription_type: {
                type: String,
                default: null
            },
            start_date: {
                type: Date,
                default: new Date()
            },
            end_date: {
                type: Date,
                default: new Date()
            }
        }
    }
}, { timestamps: true }));

exports.User = User;