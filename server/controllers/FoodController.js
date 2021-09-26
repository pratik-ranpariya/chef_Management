const mongoose = require("mongoose");
const { Food } = require('../models/food');
const multer = require("multer");
const { Like } = require("../models/like");
const { Share } = require("../models/share");
const { User } = require('../models/users');
const { v4: uuidv4 } = require('uuid');
const AWS = require("aws-sdk");
const UserController = require("./UserController");
AWS.config.update({
    signatureVersion: 'v4'
});
const s3 = new AWS.S3();

class FoodController {

    static async addFood(req, res) {
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

            const chefData = await User.findById({ _id: req.body.chef_id })

            if(chefData.chef_details.subscription.subscription_type == 'free'){

                res.status(401).json({
                    message: 'you not have any subcription plan'
                })

            } else {
                const food = new Food({
                    chef_id: req.body.chef_id,
                    food_name: req.body.food_name,
                    description: req.body.description,
                    service_days_hour: req.body.service_days_hour,
                    price: req.body.price,
                    cuisine_type: req.body.cuisine_type,
                    diet_type: req.body.diet_type
                });
    
                food.available.pickup = req.body.pickup;
                food.available.shipping = req.body.shipping;
                food.available.delivery = req.body.delivery;
    
                const foodData = await food.save();
    
                res.status(200).json({
                    message: 'Food added',
                    food_id: foodData._id
                });
            }

        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async uploadFoodImages(req, res) {
        try {

            if (!req.params.food_id) {
                res.status(402).json({ message: 'Food id is required' });
            }

            const food = await Food.findById({ _id: req.params.food_id });

            if (food) {
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

                        food.food_content = data.key;
                        await food.save();
                        res.status(200).json({ message: 'image uploaded successfully' });
                    });
                });
            } else {
                res.status(402).json({ message: 'Wrong Food id' });
            }
            // res.sendFile('D:/safe/upload/upload-1613562307199.jpg');

        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async getAllFood(req, res) {
        try {
            var perPage = (typeof req.query.perPage != 'undefined') ? parseInt(req.query.perPage) : 10;
            var page = (typeof req.query.page != 'undefined') ? (req.query.page == 0) ? 1 : req.query.page || 1 : 1;
            var skip = (perPage * page) - perPage;

            var start_date = { 
                $gte: (typeof req.query.start_date != 'undefined') ? new Date(req.query.start_date+ ' 00:00:00') : new Date('0001-01-01 00:00:00'), 
                $lte: (typeof req.query.end_date != 'undefined') ? new Date(req.query.end_date+ ' 23:59:59') : new Date()
            }

            const foods = await Food.find({updatedAt: start_date}).sort({ updatedAt: -1 }).skip(skip).limit(perPage)
            if (req.params.user_id) {
                const post = await Like.find({ user_id: req.params.user_id, item_type: 'food' }).select('item_id -_id').sort({ createdAt: -1 });
                const postIDS = [];
                post.map((post_id) => {
                    postIDS.push(post_id.item_id);
                });

                for (let i = 0; i < foods.length; i++) {
                    if (postIDS.includes(foods[i]._id.toString())) {
                        foods[i].is_like = true;
                    }
                    if (foods[i].food_content && foods[i].food_content.substring(0, 4) !== 'http') {
                        foods[i].food_content = await UserController.getSignedURL(foods[i].food_content);
                    }
                }

                res.status(200).json(foods);
            } else {
                res.status(200).json(foods);
            }
        } catch (e) {
            console.log(e);
            res.status(401).send(e.message);
        }
    }

    static async getFoodByID(req, res) {
        try {
            if (!req.params.food_id) {
                res.status(401).json({
                    message: 'Required food id'
                });
            }

            const foods = await Food.findOne({ _id: req.params.food_id });

            if (foods.food_content && foods.food_content.substring(0, 4) !== 'http') {
                foods.food_content = await UserController.getSignedURL(foods.food_content);
            }
            res.status(200).json(foods);
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async getFoodByChefID(req, res) {
        try {
            if (!req.params.chef_id) {
                res.status(401).json({
                    message: 'Required chef_id'
                });
            }

            const foods = await Food.find({ chef_id: req.params.chef_id });


            for (let i = 0; i < foods.length; i++) {
                if (foods[i].food_content && foods[i].food_content.substring(0, 4) !== 'http') {
                    foods[i].food_content = await UserController.getSignedURL(foods[i].food_content);
                }
            }

            res.status(200).json(foods);
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async updateFood(req, res) {
        try {
            if (!req.body) {
                res.status(401).json({
                    message: 'Request body not defined'
                });
            } else if (!req.body.food_id) {
                res.status(401).json({
                    message: 'Required body params not defined'
                });
            }

            const foodData = await Food.findById({ _id: req.body.food_id });

            if (!foodData) {
                res.status(401).json({ message: 'post not exist' });
            } else {
                foodData.chef_id = req.body.chef_id;
                foodData.food_name = req.body.food_name;
                foodData.description = req.body.description;
                foodData.service_days_hour = req.body.service_days_hour;
                foodData.price = req.body.price;
                foodData.available.pickup = req.body.pickup;
                foodData.available.delivery = req.body.delivery;
                foodData.available.fee = req.body.fee;

                await foodData.save();

                res.status(200).json({ message: 'food updated' });
            }
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async deleteFoodImages(req, res) {
        try {
            if (!req.params.food_id) {
                res.status(402).json({ message: 'Food id is required' });
            }

            const food = await Food.findById({ _id: req.params.food_id });

            if (!food) {
                res.status(402).json({ message: 'food id is not valid' });
            }

            food.food_content = '';
            await food.save();

            // req.body.images.map(async (image) => {
            //     if (food.images.includes(image)) {
            //         const index = food.images.indexOf(image);
            //         if (index > -1) {
            //             food.images.splice(index, 1);
            //         }
            //     }
            //     food.images = food.images;
            //     await food.save();
            // });

            res.status(200).json({ message: 'image deleted' });

        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async deleteFood(req, res) {
        try {
            if (!req.params.food_id) {
                res.status(401).json({
                    message: 'Request params not defined'
                });
            }

            await Food.remove({ _id: req.params.food_id });
            res.status(200).json({ message: 'food deleted' });
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async shareFood(req, res) {
        try {
            if (!req.body) {
                res.status(401).json({
                    message: 'Request body not defined'
                });
            } else if (!req.body.food_id) {
                res.status(401).json({
                    message: 'Required body params not defined'
                });
            }

            await Food.findOneAndUpdate({ _id: req.body.recipe_id }, { $inc: { 'share': 1 } });
            const share = new Share({
                item_id: req.body.food_id,
                user_id: req.body.user_id,
                item_type: 'food'
            });
            await share.save();

            res.status(200).json({ message: 'shared' });
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async userSharedFood(req, res) {
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

            const post = await Share.find({ user_id: req.params.user_id, item_type: 'food' }).select('item_id -_id');
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

    static async likeFood(req, res) {
        try {
            if (!req.body) {
                res.status(401).json({
                    message: 'Request body not defined'
                });
            } else if (!req.body.food_id) {
                res.status(401).json({
                    message: 'Required body params not defined'
                });
            }

            const isLike = await Like.findOne({ item_id: req.body.food_id, user_id: req.body.user_id, item_type: 'food' });

            if (isLike) {
                res.status(403).json({ message: 'like user already liked' });
            } else {
                await Food.findOneAndUpdate({ _id: req.body.food_id }, { $inc: { 'likes': 1 } });
                const like = new Like({
                    item_id: req.body.food_id,
                    user_id: req.body.user_id,
                    item_type: 'food'
                });
                await like.save();

                res.status(200).json({ message: 'like food' });
            }
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async unLikeFood(req, res) {
        try {
            if (!req.body) {
                res.status(401).json({
                    message: 'Request body not defined'
                });
            } else if (!req.body.food_id) {
                res.status(401).json({
                    message: 'Required body params not defined'
                });
            }

            const isLike = await Like.findOne({ item_id: req.body.food_id, user_id: req.body.user_id, item_type: 'food' });

            if (!isLike) {
                res.status(403).json({ message: 'like user not liked' });
            } else {
                await Food.findOneAndUpdate({ _id: req.body.food_id }, { $inc: { 'likes': -1 } });
                await Like.findOneAndDelete({ item_id: req.body.food_id, item_type: 'food', user_id: req.body.user_id });

                res.status(200).json({ message: 'unlike food' });
            }
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async userLikedFood(req, res) {
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

            const post = await Like.find({ user_id: req.params.user_id, item_type: 'food' }).select('item_id -_id');
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

    static async searchFood(req, res) {
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
            vipChef.map((foodItem) => {
                vipIds.push(foodItem._id)
            })

            var start_date = {
                $gte: (typeof req.query.start_date != 'undefined') ? new Date(req.query.start_date+ ' 00:00:00') : new Date('0001-01-01 00:00:00'), 
                $lte: (typeof req.query.end_date != 'undefined') ? new Date(req.query.end_date+ ' 23:59:59') : new Date()
            }

            const vipsearch = await Food.find({updatedAt: start_date, location: req.params.city, chef_id: {$in: vipIds} }).sort({updatedAt: -1})
            const nonvipsearch = await Food.find({updatedAt: start_date, location: req.params.city, chef_id: {$nin: vipIds} }).sort({updatedAt: -1})
            const search = vipsearch.concat(nonvipsearch)

            var perPage = (typeof req.query.perPage != 'undefined') ? parseInt(req.query.perPage) : 10;
            var page = (typeof req.query.page != 'undefined') ? (req.query.page == 0) ? 1 : req.query.page || 1 : 1;
            var startPage = (perPage * page) - perPage;
            var lastPage = perPage * page;

            const FoodSearch = search.slice(startPage, lastPage);
            res.status(200).json(FoodSearch)
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }
}
module.exports = FoodController;