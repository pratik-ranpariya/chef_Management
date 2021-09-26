const mongoose = require("mongoose");

const Order = mongoose.model('Order', new mongoose.Schema({
    user_id: {
        type: String,
        default: null
    },
    order_type: {
        type: String,
        default: null
    },
    order_status: {
        type: Number,
        default: 0
    },
    items: [{
        item_id: {
            type: String,
            default: null
        },
        chef_id: {
            type: String,
            default: null
        },
        title: {
            type: String,
            default: null
        },
        qty: Number,
        price: Number,
        amount: Number,
    }],
    total_amount: Number,
    delivery_day: {
        type: String,
        default: null
    },
    delivery_time: {
        type: String,
        default: null
    },
    address: {
        type: String,
        default: null
    },
    extra_notes: {
        type: String,
        default: null
    },
    chef_confirmation: {
        type: Boolean,
        default: false
    },
    payment: {
        payment_type: {
            type: String,
            default: null
        },
        card_type: {
            type: String,
            default: null
        },
        details: Object
    },
    payment_status: {
        type: Boolean,
        default: false
    },
    rate: {
        type: Number,
        default: 0
    },
    e_class_ticket: {
        type: String
    }
}, { timestamps: true }));

exports.Order = Order;