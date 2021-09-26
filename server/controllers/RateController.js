const mongoose = require("mongoose");
const { Food } = require("../models/food");
const { Order } = require("../models/order");
const { Post } = require("../models/posts");
const { Rate } = require("../models/rate");
const { Recipes } = require("../models/recipes");
const { Service } = require("../models/service");

class RateController {

    static async addRate(req, res) {
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

            const rateReview = new Rate({
                item_type: req.body.item_type,
                item_id: req.body.item_id,
                user_id: req.body.user_id,
                rate: req.body.rate,
            });
            await rateReview.save();

            const ratesData = await Rate.find({ item_type: req.body.item_type });

            let rateSum = 0;
            ratesData.map((rateData) => {
                rateSum += rateData.rate;
            });

            const avg = rateSum / ratesData.length;

            if (req.body.item_type === 'post') {
                const data = await Post.findById({ _id: req.body.item_id });
                data.rate = avg;
                await data.save();
            } else if (req.body.item_type === 'recipe') {
                const data = await Recipes.findById({ _id: req.body.item_id });
                data.rate = avg;
                await data.save();
            } else if (req.body.item_type === 'order') {
                const data = await Order.findById({ _id: req.body.item_id });
                data.rate = avg;
                await data.save();
            } else if (req.body.item_type === 'food') {
                const data = await Food.findById({ _id: req.body.item_id });
                data.rate = avg;
                await data.save();
            } else if (req.body.item_type === 'service') {
                const data = await Service.findById({ _id: req.body.item_id });
                data.rate = avg;
                await data.save();
            }

            res.status(200).json({
                message: 'Rate added',
            });

        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }
}
module.exports = RateController;