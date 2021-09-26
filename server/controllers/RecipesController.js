const mongoose = require("mongoose");
const { Recipes } = require('../models/recipes');
const multer = require("multer");
const { Like } = require("../models/like");
const { Share } = require("../models/share");
const { User } = require("../models/users");
const UserController = require("./UserController");
const { v4: uuidv4 } = require('uuid');
const AWS = require("aws-sdk");
AWS.config.update({
    signatureVersion: 'v4'
});
const s3 = new AWS.S3();

class RecipesController {

    static async addRecipes(req, res) {
        try {
            if (!req.body) {
                res.status(401).json({
                    message: 'Request body not defined'
                });
            } else if (!req.body.chef_id) {
                res.status(401).json({
                    message: 'Required body params not defined'
                });
            }

            const recipe = new Recipes({
                chef_id: req.body.chef_id,
                food_name: req.body.food_name,
                cuisine_type: req.body.cuisine_type,
                number_of_servings: req.body.number_of_servings,
                prep_time: req.body.prep_time,
                cook_time: req.body.cook_time,
                total_time: req.body.prep_time + req.body.cook_time,
                instructions: req.body.instructions,
                ingredients: req.body.ingredients,
                required_tools: req.body.required_tools,
                difficulty_level: req.body.difficulty_level,
                diet_type: req.body.diet_type
            });

            const recipeData = await recipe.save();

            res.status(200).json({
                message: 'Recipe added',
                recipe_id: recipeData._id
            });

        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async uploadRecipesImages(req, res) {
        try {

            if (!req.params.recipe_id) {
                res.status(402).json({ message: 'Chef id is required' });
            }

            const recipe = await Recipes.findById({ _id: req.params.recipe_id });

            if (recipe) {
                let storage = multer.memoryStorage({
                    destination: function (req, file, callback) {
                        callback(null, '');
                    }
                });
                const upload = multer({
                    storage: storage,

                }).single('upload');
                upload(req, res, async () => {
                    let myFile = req.file.originalname.split(".");
                    const fileType = myFile[myFile.length - 1];
                    const params = {
                        Bucket: process.env.AWS_BUCKET_NAME,
                        Key: `${uuidv4()}.${fileType}`,
                        Body: req.file.buffer
                    };
                    s3.upload(params, async (error, data) => {
                        if (error) {
                            res.status(500).send(error);
                        }

                        recipe.recipe_content = data.key;
                        await recipe.save();
                        res.status(200).json({ message: 'image uploaded successfully' });
                    });
                });
            }

        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async getAllRecipes(req, res) {
        try {
            var perPage = (typeof req.query.perPage != 'undefined') ? parseInt(req.query.perPage) : 10;
            var page = (typeof req.query.page != 'undefined') ? (req.query.page == 0) ? 1 : req.query.page || 1 : 1;
            var skip = (perPage * page) - perPage;

            var start_date = { 
                $gte: (typeof req.query.start_date != 'undefined') ? new Date(req.query.start_date+ ' 00:00:00') : new Date('0001-01-01 00:00:00'), 
                $lte: (typeof req.query.end_date != 'undefined') ? new Date(req.query.end_date+ ' 23:59:59') : new Date()
            }

            const recipes = await Recipes.find({updatedAt: start_date}).sort({ updatedAt: -1 }).skip(skip).limit(perPage);
            if (req.params.user_id) {
                const post = await Like.find({ user_id: req.params.user_id, item_type: 'recipe' }).select('item_id -_id').sort({ createdAt: -1 });
                const postIDS = [];
                post.map((post_id) => {
                    postIDS.push(post_id.item_id);
                });

                for (let i = 0; i < recipes.length; i++) {
                    if (postIDS.includes(recipes[i]._id.toString())) {
                        recipes[i].is_like = true;
                    }

                    if (recipes[i].recipe_content && recipes[i].recipe_content.substring(0, 4) !== 'http') {
                        recipes[i].recipe_content = await UserController.getSignedURL(recipes[i].recipe_content);
                    }
                }
                res.status(200).json(recipes);
            } else {
                res.status(200).json(recipes);
            }

        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async getAllFilterRecipe(req, res) {
        try {
            req.query.diet_type = JSON.parse(req.query.diet_type);
            let postData = null;
            if (req.query.commented === 'true') {
                postData = await Recipes.find({ difficulty_level: req.query.difficulty_level, $or: req.query.diet_type, cuisine_type: req.query.cuisine_type, cook_time: { $gte: req.query.start_cook_min, $lt: req.query.end_cook_min }, number_of_servings: { $gte: req.query.start_nos, $lt: req.query.end_nos } }).sort({ comments: -1 });

            } else if (req.query.liked === 'true') {
                postData = await Recipes.find({ difficulty_level: req.query.difficulty_level, $or: req.query.diet_type, cuisine_type: req.query.cuisine_type, cook_time: { $gte: req.query.start_cook_min, $lt: req.query.end_cook_min }, number_of_servings: { $gte: req.query.start_nos, $lt: req.query.end_nos } }).sort({ likes: -1 });

            } else if (req.query.vip === 'true') {
                postData = await Recipes.find({ difficulty_level: req.query.difficulty_level, $or: req.query.diet_type, cuisine_type: req.query.cuisine_type, cook_time: { $gte: req.query.start_cook_min, $lt: req.query.end_cook_min }, number_of_servings: { $gte: req.query.start_nos, $lt: req.query.end_nos } });
                const sortedResult = [];

                for (let i = 0; i < postData.length; i++) {
                    const chefData = await User.findById({ _id: postData[i].chef_id }).select('chef_details.subscription');

                    if (chefData) {
                        if (chefData.chef_details.subscription.subscription_type === 'vip') {
                            sortedResult.push(postData[i]);
                        }
                    }
                }
                postData = sortedResult;
            } else if (req.query.rated === 'true') {
                postData = await Recipes.find({ difficulty_level: req.query.difficulty_level, $or: req.query.diet_type, cuisine_type: req.query.cuisine_type, cook_time: { $gte: req.query.start_cook_min, $lt: req.query.end_cook_min }, number_of_servings: { $gte: req.query.start_nos, $lt: req.query.end_nos } }).sort({ rate: -1 });
            }

            const post = await Like.find({ user_id: req.query.user_id, item_type: 'recipe' }).select('item_id -_id');
            const postIDS = [];
            post.map((post_id) => {
                postIDS.push(post_id.item_id);
            });

            for (let i = 0; i < postData.length; i++) {
                if (postIDS.includes(postData[i]._id.toString())) {
                    postData[i].is_like = true;
                }
            }
            res.status(200).json(postData);
        }
        catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async getRecipesByID(req, res) {
        try {
            if (!req.params.recipe_id) {
                res.status(401).json({
                    message: 'Required recipe id'
                });
            }

            const recipes = await Recipes.findOne({ _id: req.params.recipe_id });
            if (recipes) {
                if (recipes.recipe_content && recipes.recipe_content.substring(0, 4) !== 'http') {
                    recipes.recipe_content = await UserController.getSignedURL(recipes.recipe_content);
                }
            }

            res.status(200).json(recipes);
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async getRecipesByChefID(req, res) {
        try {
            if (!req.params.chef_id) {
                res.status(401).json({
                    message: 'Required chef_id'
                });
            }

            const recipes = await Recipes.find({ chef_id: req.params.chef_id });

            if (recipes) {
                for (let i = 0; i < recipes.length; i++) {
                    if (recipes[i].recipe_content && recipes[i].recipe_content.substring(0, 4) !== 'http') {
                        recipes[i].recipe_content = await UserController.getSignedURL(recipes[i].recipe_content);
                    }
                }
            }

            res.status(200).json(recipes);
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async updateRecipes(req, res) {
        try {
            if (!req.body) {
                res.status(401).json({
                    message: 'Request body not defined'
                });
            } else if (!req.body.recipe_id) {
                res.status(401).json({
                    message: 'Required body params not defined'
                });
            }

            const recipeData = await Recipes.findById({ _id: req.body.recipe_id });

            if (!recipeData) {
                res.status(401).json({ message: 'recipe not exist' });
            } else {

                recipeData.chef_id = req.body.chef_id;
                recipeData.number_of_servings = req.body.number_of_servings;
                recipeData.prep_time = req.body.prep_time;
                recipeData.cook_time = req.body.cook_time;
                recipeData.instructions = req.body.instructions;
                recipeData.ingredients = req.body.ingredients;
                recipeData.required_tools = req.body.required_tools;
                recipeData.difficulty_level = req.body.difficulty_level;

                await recipeData.save();

                res.status(200).json({
                    message: 'Recipe updated'
                });
            }
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async deleteRecipes(req, res) {
        try {
            if (!req.params.recipe_id) {
                res.status(401).json({
                    message: 'Request params not defined'
                });
            }

            await Recipes.remove({ _id: req.params.recipe_id });
            res.status(200).json({ message: 'recipe deleted' });
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async deleteRecipesImages(req, res) {
        try {
            if (!req.params.recipe_id) {
                res.status(402).json({ message: 'Recipes id is required' });
            }

            const recipe = await Recipes.findById({ _id: req.params.recipe_id });

            if (!recipe) {
                res.status(402).json({ message: 'Recipes id is not valid' });
            }

            recipe.recipe_content = recipe.images;
            await recipe.save();

            // req.body.images.map(async (image) => {
            //     if (recipe.images.includes(image)) {
            //         const index = recipe.images.indexOf(image);
            //         if (index > -1) {
            //             recipe.images.splice(index, 1);
            //         }
            //     }
            //     recipe.recipe_content = recipe.images;
            //     await recipe.save();
            // });
            res.status(200).json({ message: 'image deleted' });

        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async shareRecipe(req, res) {
        try {
            if (!req.body) {
                res.status(401).json({
                    message: 'Request body not defined'
                });
            } else if (!req.body.recipe_id) {
                res.status(401).json({
                    message: 'Required body params not defined'
                });
            }

            await Recipes.findOneAndUpdate({ _id: req.body.recipe_id }, { $inc: { 'share': 1 } });
            const share = new Share({
                item_id: req.body.recipe_id,
                user_id: req.body.user_id,
                item_type: 'recipe'
            });
            await share.save();

            res.status(200).json({ message: 'shared' });
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async userSharedRecipe(req, res) {
        try {
            if (!req.body) {
                res.status(401).json({
                    message: 'Request body not defined'
                });
            } else if (!req.params.user_id) {
                res.status(401).json({
                    message: 'Required body params not defined'
                });
            }

            const post = await Share.find({ user_id: req.params.user_id, item_type: 'recipe' }).select('item_id -_id');
            const postIDS = [];
            post.map((post_id) => {
                postIDS.push(post_id.item_id);
            });

            res.status(200).json(postIDS);
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async likeRecipes(req, res) {
        try {
            if (!req.body) {
                res.status(401).json({
                    message: 'Request body not defined'
                });
            } else if (!req.body.recipe_id) {
                res.status(401).json({
                    message: 'Required body params not defined'
                });
            }

            const isLike = await Like.findOne({ item_id: req.body.recipe_id, user_id: req.body.user_id, item_type: 'recipe' });

            if (isLike) {
                res.status(403).json({ message: 'like user already liked' });
            } else {
                await Recipes.findOneAndUpdate({ _id: req.body.recipe_id }, { $inc: { 'likes': 1 } });
                const like = new Like({
                    item_id: req.body.recipe_id,
                    user_id: req.body.user_id,
                    item_type: 'recipe'
                });
                await like.save();

                res.status(200).json({ message: 'like recipe' });
            }
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async userLikedRecipe(req, res) {
        try {
            if (!req.body) {
                res.status(401).json({
                    message: 'Request body not defined'
                });
            } else if (!req.params.user_id) {
                res.status(401).json({
                    message: 'Required body params not defined'
                });
            }

            const post = await Like.find({ user_id: req.params.user_id, item_type: 'recipe' }).select('item_id -_id');
            const postIDS = [];
            post.map((post_id) => {
                postIDS.push(post_id.item_id);
            });

            res.status(200).json(postIDS);
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async unLikeRecipes(req, res) {
        try {
            if (!req.body) {
                res.status(401).json({
                    message: 'Request body not defined'
                });
            } else if (!req.body.recipe_id) {
                res.status(401).json({
                    message: 'Required body params not defined'
                });
            }

            const isLike = await Like.findOne({ item_id: req.body.recipe_id, user_id: req.body.user_id, item_type: 'recipe' });

            if (!isLike) {
                res.status(403).json({ message: 'like user not liked' });
            } else {
                await Recipes.findOneAndUpdate({ _id: req.body.recipe_id }, { $inc: { 'likes': -1 } });
                await Like.findOneAndDelete({ item_id: req.body.recipe_id, item_type: 'recipe', user_id: req.body.user_id });

                res.status(200).json({ message: 'unlike recipe' });
            }
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async searchRecipe(req, res) {
        try {
            if (!req.body) {
                res.status(401).json({
                    message: 'Request body not defined'
                });
            } else if (!req.params.city) {
                res.status(401).json({
                    message: 'Required body params not defined'
                });
            }

            const vipChef = await User.find({ "chef_details.subscription.subscription_type": "vip" })

            const vipIds = [];
            vipChef.map((recipeItem) => {
                vipIds.push(recipeItem._id)
            })

            const vipsearch = await Recipes.find({ location: req.params.city, chef_id: {$in: vipIds} }).sort({updatedAt: -1});
            const nonvipsearch = await Recipes.find({ location: req.params.city, chef_id: {$nin: vipIds} }).sort({updatedAt: -1});
            
            const search = vipsearch.concat(nonvipsearch)
            res.status(200).json(search);
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }
}
module.exports = RecipesController;