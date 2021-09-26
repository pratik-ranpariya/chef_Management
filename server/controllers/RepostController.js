const mongoose = require("mongoose");
const { Food } = require("../models/food");
const { Post } = require("../models/posts");
const { Recipes } = require("../models/recipes");
const { Service } = require("../models/service");
class RepostController {

    static async repost(req, res) {
        try {
            if (!req.body) {
                res.status(401).json({
                    message: 'Request body not defined'
                });
            } else if (!req.body.user_id || !req.body.item_id) {
                res.status(401).json({
                    message: 'Required body params not defined'
                });
            }

            if (req.body.item_type === 'post') {
                const data = await Post.findById({ _id: req.body.item_id });

                const post = new Post({
                    chef_id: data.chef_id,
                    description: data.description,
                    location: data.location
                });
    
                let postData = await post.save();

                return res.status(200).json({
                    message: 'Post added',
                    post_id: postData._id
                });

            } else if (req.body.item_type === 'recipe') {
                const data = await Recipes.findById({ _id: req.body.item_id });
                
                const recipe = new Recipes({
                    chef_id: data.chef_id,
                    food_name: data.food_name,
                    cuisine_type: data.cuisine_type,
                    number_of_servings: data.number_of_servings,
                    prep_time: data.prep_time,
                    cook_time: data.cook_time,
                    total_time: data.prep_time + data.cook_time,
                    instructions: data.instructions,
                    ingredients: data.ingredients,
                    required_tools: data.required_tools,
                    difficulty_level: data.difficulty_level,
                    diet_type: data.diet_type
                });
    
                const recipeData = await recipe.save();
    
                res.status(200).json({
                    message: 'Recipe added',
                    recipe_id: recipeData._id
                });
            } else if (req.body.item_type === 'food') {
                const data = await Food.findById({ _id: req.body.item_id });

                console.log(data)

                const food = new Food({
                    chef_id: data.chef_id,
                    food_name: data.food_name,
                    description: data.description,
                    service_days_hour: data.service_days_hour,
                    price: data.price,
                    cuisine_type: data.cuisine_type,
                    diet_type: data.diet_type,
                    available: {
                        pickup: data.available.pickup,
                        shipping: data.available.shipping,
                        delivery: data.available.delivery
                    }
                })
    
                const foodData = await food.save();
    
                res.status(200).json({
                    message: 'Food added',
                    food_id: foodData._id
                });
            } else if (req.body.item_type === 'service') {
                const data = await Service.findById({ _id: req.body.item_id });

                const service = new Service({
                    chef_id: data.chef_id,
                    service_type: data.service_type,
                    description: data.description,
                    service_days_hour: data.service_days_hour,
                    price: data.price,
                    available: {
                        pickup: data.available.pickup,
                        shipping: data.available.shipping,
                        delivery: data.available.delivery
                    }
                })
    
                const serviceData = await service.save();
    
                res.status(200).json({
                    message: 'Service added',
                    food_id: serviceData._id
                });
            }

        } catch (e) {
            console.log(e);
            res.status(401).send(e.message);
        }
    }
}
module.exports = RepostController;