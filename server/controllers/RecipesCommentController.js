const { Like } = require('../models/like');
const { Comment } = require('../models/postsComment');
const { Recipes } = require('../models/recipes');
const ChefCommentController = require('./ChefCommentController');

class RecipesCommentController {

    static async addComment(req, res) {
        try {
            if (!req.body) {
                res.status(401).json({
                    message: 'Request body not defined'
                });
            } else if (!req.body.recipe_id || !req.body.commenter_id) {
                res.status(401).json({
                    message: 'Required body params not defined'
                });
            }

            const postComment = new Comment({
                post_id: req.body.recipe_id,
                commenter_id: req.body.commenter_id,
                comment: req.body.comment,
                type: "recipe"
            });

            await Recipes.findOneAndUpdate({ _id: req.body.recipe_id }, { $inc: { 'comments': 1 } });

            await postComment.save();

            res.status(200).json({
                message: 'Comment added'
            });

        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async getAllComment(req, res) {
        try {
            const posts = await Comment.find({ type: "recipe" }).sort({ createdAt: -1 });
            const result = await ChefCommentController.getData(posts);
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

            const posts = await Comment.find({ _id: req.params.comment_id, type: "recipe" });
            const result = await ChefCommentController.getData(posts);
            res.status(200).json(result);
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async getCommentByRecipeID(req, res) {
        try {
            if (!req.params.recipe_id) {
                res.status(401).json({
                    message: 'Required chef_id'
                });
            }

            const posts = await Comment.find({ post_id: req.params.recipe_id, type: "recipe" });

            const post = await Like.find({ user_id: req.params.user_id, item_type: 'recipe_comment' }).select('item_id -_id');
            const postIDS = [];
            post.map((post_id) => {
                postIDS.push(post_id.item_id);
            });

            for (let i = 0; i < posts.length; i++) {
                if (postIDS.includes(posts[i]._id.toString())) {
                    posts[i].is_like = true;
                }
            }

            const result = await ChefCommentController.getData(posts);
            res.status(200).json(result);
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async deleteComment(req, res) {
        try {
            if (!req.params.comment_id) {
                res.status(401).json({
                    message: 'Request params not defined'
                });
            }

            await Comment.remove({ _id: req.params.comment_id });
            res.status(200).json({ message: 'comment deleted' });
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async likeComment(req, res) {
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

            const isLike = await Like.findOne({ item_id: req.body.comment_id, user_id: req.body.user_id, item_type: 'recipe_comment' });
            if (isLike) {
                res.status(403).json({ message: 'like user already liked' });
            } else {
                const like = new Like({
                    item_id: req.body.comment_id,
                    user_id: req.body.user_id,
                    item_type: 'recipe_comment'
                });
                await like.save();
                await Comment.findOneAndUpdate({ _id: req.body.comment_id }, { $inc: { 'likes': 1 } });
            }


            res.status(200).json({ message: 'like comment' });
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async unLikeComment(req, res) {
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

            const isLike = await Like.findOne({ item_id: req.body.comment_id, user_id: req.body.user_id, item_type: 'recipe_comment' });
            if (!isLike) {
                res.status(403).json({ message: 'like user not liked' });
            } else {
                await Like.findOneAndDelete({ item_id: req.body.comment_id, item_type: 'recipe_comment', user_id: req.body.user_id });
                await Comment.findOneAndUpdate({ _id: req.body.comment_id }, { $inc: { 'likes': -1 } });
            }



            res.status(200).json({ message: 'unlike comment' });
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async addCommentReply(req, res) {
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
module.exports = RecipesCommentController;