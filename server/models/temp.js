const mongoose = require("mongoose");

const Temp = mongoose.model('Temp', new mongoose.Schema({
    user_name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        default: null
    },
    password: String,
    role_id: Number,
    otp: String
}, { timestamps: true }));

exports.Temp = Temp;