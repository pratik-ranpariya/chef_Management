const { Comment } = require('../models/chefComment');
const { RateReview } = require('../models/rateReview');
const { User } = require("../models/users");

class ChefCommentController {

    static async addChefComment(req, res) {
        try {
            if (!req.body) {
                res.status(401).json({
                    message: 'Request body not defined'
                });
            } else if (!req.body.chef_id || !req.body.commenter_id) {
                res.status(401).json({
                    message: 'Required body params not defined'
                });
            }

            const chefComment = new Comment({
                chef_id: req.body.chef_id,
                commenter_id: req.body.commenter_id,
                comment: req.body.comment,
            });
            await chefComment.save();

            const rateReview = new RateReview({
                chef_id: req.body.chef_id,
                service: req.body.service,
                food: req.body.food,
                personality: req.body.personality,
                presentation: req.body.presentation,
            });
            await rateReview.save();

            res.status(200).json({
                message: 'Comment added'
            });

        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async getAllChefComment(req, res) {
        try {
            const chefs = await Comment.find().sort({ createdAt: -1 });
            const result = await getUserData(chefs);
            res.status(200).json(result);
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async getCommentByID(req, res) {
        try {
            if (!req.params.comment_id) {
                res.status(401).json({
                    message: 'Required comment id'
                });
            }

            const chefs = await Comment.find({ _id: req.params.comment_id });
            const result = await getUserData(chefs);
            res.status(200).json(result);
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async getCommentByChefID(req, res) {
        try {
            if (!req.params.chef_id) {
                res.status(401).json({
                    message: 'Required chef_id'
                });
            }

            const chefs = await Comment.find({ chef_id: req.params.chef_id });
            const result = await getUserData(chefs);

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

            // result.avgRate = {

            // };
            const finalResult = {
                result,
                avgRate: {
                    avgServiceRate: avgServiceRate,
                    avgFoodRate: avgFoodRate,
                    avgPresentationRate: avgPresentationRate,
                    avgPersonalityRate: avgPersonalityRate,
                    avgRate: avgRate
                }
            };

            res.status(200).json(finalResult);
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async deleteChefComment(req, res) {
        try {
            if (!req.params.comment_id) {
                res.status(401).json({
                    message: 'Request params not defined'
                });
            }

            await Comment.remove({ _id: req.params.comment_id });
            res.status(200).json({ message: 'chef comment deleted' });
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async likeChefComment(req, res) {
        try {
            if (!req.body) {
                res.status(401).json({
                    message: 'Request body not defined'
                });
            } else if (!req.body.comment_id) {
                res.status(401).json({
                    message: 'Required body params not defined'
                });
            }

            await Comment.findOneAndUpdate({ _id: req.body.comment_id }, { $inc: { 'likes': 1 } });

            res.status(200).json({ message: 'like comment' });
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async unLikeChefComment(req, res) {
        try {
            if (!req.body) {
                res.status(401).json({
                    message: 'Request body not defined'
                });
            } else if (!req.body.comment_id) {
                res.status(401).json({
                    message: 'Required body params not defined'
                });
            }

            await Comment.findOneAndUpdate({ _id: req.body.comment_id }, { $inc: { 'likes': -1 } });

            res.status(200).json({ message: 'unlike comment' });
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async addChefCommentReply(req, res) {
        try {
            if (!req.body) {
                res.status(401).json({
                    message: 'Request body not defined'
                });
            } else if (!req.body.comment_id || !req.body.replier_id) {
                res.status(401).json({
                    message: 'Required body params not defined'
                });
            }

            const comment = await Comment.findById({ _id: req.body.comment_id });

            if (comment) {
                comment.reply.push({
                    replier_id: req.body.replier_id,
                    message: req.body.message
                });

                await comment.save();

                res.status(200).json({
                    message: 'reply added'
                });
            }

        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }
}

async function getUserData(commentData) {
    const result = [];
    for (let i = 0; i < commentData.length; i++) {
        const tmpData = {};
        tmpData._id = commentData[i]._id;
        tmpData.chef_id = commentData[i].chef_id;
        tmpData.commenter_id = commentData[i].commenter_id;
        tmpData.comment = commentData[i].comment;
        tmpData.likes = commentData[i].likes;
        tmpData.is_like = commentData[i].is_like;
        tmpData.reply = [];
        tmpData.chef_id = commentData[i].chef_id;
        let userData = await User.findById({ _id: commentData[i].commenter_id }).select('-password');

        tmpData.commenter_profile = '';
        tmpData.commenter_name = '';
        if (userData) {
            if ('profile_image' in userData) {
                tmpData.commenter_profile = userData.profile_image;
            }
            tmpData.commenter_name = userData.name;


            for (let j = 0; j < commentData[i].reply.length; j++) {
                let replierData = await User.findById({ _id: commentData[i].reply[j].replier_id }).select('-password');
                tmpData.reply[j] = {};
                tmpData.reply[j].replier_profile = replierData.profile_image;
                tmpData.reply[j].replier_name = replierData.name;
                tmpData.reply[j]._id = commentData[i].reply[j]._id;
                tmpData.reply[j].replier_id = commentData[i].reply[j].replier_id;
                tmpData.reply[j].message = commentData[i].reply[j].message;
            }

            result.push(tmpData);
        }
        tmpData.createdAt = commentData[i].createdAt;
    }
    return result;
};

module.exports = ChefCommentController;
module.exports.getData = getUserData;
