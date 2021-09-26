const mongoose = require("mongoose");

const Subscriptions = mongoose.model('Subscriptions', new mongoose.Schema({
    name: {
        type: String,
        default: null
    },
    description: [String],
    monthly_pack: {
        amount: Number,
        save_amount: Number,
        active_status: Boolean
    },
    yearly_pack: {
        amount: Number,
        save_amount: Number,
        active_status: Boolean
    }
}, { timestamps: true }));

exports.Subscriptions = Subscriptions;