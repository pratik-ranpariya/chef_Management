const mongoose = require("mongoose");
const { RateReview } = require('../models/rateReview');
const { User } = require("../models/users");

class RateReviewController {

    static async addRateReview(req, res) {
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

            const rateReview = new RateReview({
                chef_id: req.body.chef_id,

                service: req.body.service,
                food: req.body.food,
                personality: req.body.personality,
                presentation: req.body.presentation,
                review: req.body.review,
            });
            const rateReviewData = await rateReview.save();

            const rateReviews = await RateReview.find({ chef_id: req.body.chef_id });

            let serviceRate = 0, foodRate = 0, presentationRate = 0, personalityRate = 0;

            rateReviews.map((rateReview) => {
                serviceRate = serviceRate + rateReview.service;
                foodRate = foodRate + rateReview.food;
                presentationRate = presentationRate + rateReview.presentation;
                personalityRate = personalityRate + rateReview.personality;
            });

            const totalRate = serviceRate + foodRate + presentationRate + personalityRate;
            const avgRate = totalRate / (rateReviews.length * 4);

            const chefData = await User.findOne({ _id: req.body.chef_id });

            chefData.chef_details.rate = avgRate;
            await chefData.save();

            res.status(200).json({
                message: 'RateReview added',
                rateReview_id: rateReviewData._id
            });

        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async getRateReviewByChefID(req, res) {
        try {
            if (!req.params.chef_id) {
                res.status(401).json({
                    message: 'Required chef_id'
                });
            }
            const rateReviews = await RateReview.find({ chef_id: req.params.chef_id });

            let serviceRate = 0, foodRate = 0, presentationRate = 0, personalityRate = 0;

            rateReviews.map((rateReview) => {
                serviceRate = serviceRate + rateReview.service;
                foodRate = foodRate + rateReview.food;
                presentationRate = presentationRate + rateReview.presentation;
                personalityRate = personalityRate + rateReview.personality;
            });

            const totalRate = serviceRate + foodRate + presentationRate + personalityRate;

            const avgServiceRate = serviceRate / (rateReviews.length * 4);
            const avgFoodRate = foodRate / (rateReviews.length * 4);
            const avgPresentationRate = presentationRate / (rateReviews.length * 4);
            const avgPersonalityRate = personalityRate / (rateReviews.length * 4);
            const avgRate = totalRate / (rateReviews.length * 4);

            res.status(200).json({
                avgServiceRate: avgServiceRate,
                avgFoodRate: avgFoodRate,
                avgPresentationRate: avgPresentationRate,
                avgPersonalityRate: avgPersonalityRate,
                avgRate: avgRate
            });
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }
}
module.exports = RateReviewController;