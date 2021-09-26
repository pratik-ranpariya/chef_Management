const mongoose = require("mongoose");

const Cart = mongoose.model('Cart', new mongoose.Schema({
    user_id: {
        type: String,
        default: null
    },
    chef_id: {
        type: String,
        default: null
    },
    item_id: {
        type: String,
        default: null
    },
    item_type: {
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
}, { timestamps: true }));

exports.Cart = Cart;