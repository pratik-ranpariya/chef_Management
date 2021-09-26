const mongoose = require("mongoose");

const Recipes = mongoose.model('Recipes', new mongoose.Schema({
    food_name: {
        type: String,
        default: null
    },
    cuisine_type: [String],
    diet_type: {
        type: [String],
        default: null
    },
    chef_id: {
        type: String,
        default: null
    },
    recipe_content: {
        type: String,
        default: null
    },
    number_of_servings: Number,
    prep_time: Number,
    cook_time: Number,
    total_time: Number,
    ingredients: {
        type: String,
        default: null
    },
    instructions: {
        type: String,
        default: null
    },
    required_tools: {
        type: String,
        default: null
    },
    difficulty_level: {
        type: String,
        default: null
    },
    rate: {
        type: Number,
        default: 0
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
    }
}, { timestamps: true }));

exports.Recipes = Recipes;