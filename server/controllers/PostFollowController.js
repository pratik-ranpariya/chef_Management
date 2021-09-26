const { PostFollow } = require("../models/postFollow");
const { Post } = require('../models/posts');
const { User } = require("../models/users");

class PostFollowController {

    static async addPostFollow(req, res) {
        try {
            if (!req.body) {
                res.status(401).json({
                    message: 'Request body not defined'
                });
            } else if (!req.body.chef_id || !req.body.user_id) {
                res.status(401).json({
                    message: 'Required body params not defined'
                });
            }

            const postFollow = new PostFollow({
                user_id: req.body.user_id,
                chef_id: req.body.chef_id
            });

            await postFollow.save();

            res.status(200).json({
                message: 'Follow added'
            });

        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async deletePostFollow(req, res) {
        try {
            if (!req.body) {
                res.status(401).json({
                    message: 'Request body not defined'
                });
            } else if (!req.body.chef_id || !req.body.user_id) {
                res.status(401).json({
                    message: 'Required body params not defined'
                });
            }

            await PostFollow.remove({
                user_id: req.body.user_id,
                chef_id: req.body.chef_id
            });

            res.status(200).json({
                message: 'Unfollowed Chef'
            });

        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async getAllPostFollow(req, res) {
        try {
            const posts = await PostFollow.find().sort({ createdAt: -1 });
            res.status(200).json(posts);
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async getFollowByPostId(req, res) {
        try {
            if (!req.params.post_id) {
                res.status(401).json({
                    message: 'Required id'
                });
            }

            const posts = await PostFollow.find({ post_id: req.params.post_id });
            res.status(200).json(posts);
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }
    static async getFollowByChefId(req, res) {
        try {
            if (!req.params.chef_id) {
                res.status(401).json({
                    message: 'Required id'
                });
            }

            const posts = await PostFollow.find({ chef_id: req.params.chef_id });
            res.status(200).json(posts);
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }
    static async getFollowByUserId(req, res) {
        try {
            if (!req.params.user_id) {
                res.status(401).json({
                    message: 'Required id'
                });
            }

            const chefIds = [];
            const posts = await PostFollow.find({ user_id: req.params.user_id }).select('chef_id');
            posts.map((post) => {
                chefIds.push(post.chef_id);
            });
            console.log(chefIds);
            const chefData = await User.find({ _id: chefIds }).select(['-password', '-chef_details.images']);

            const resultData = [];
            for (let i = 0; i < chefData.length; i++) {
                const followerDetails = await PostFollow.find({ chef_id: chefData[i]._id }).countDocuments();
                let data = {
                    "chef_details": chefData[i].chef_details,
                    "favorite_post": chefData[i].favorite_post,
                    "_id": chefData[i]._id,
                    "email": chefData[i].email,
                    "user_name": chefData[i].user_name,
                    "role_id": chefData[i].role_id,
                    "createdAt": chefData[i].createdAt,
                    "updatedAt": chefData[i].updatedAt,
                    "mobile": chefData[i].mobile,
                    "name": chefData[i].name,
                    "banner_image": chefData[i].profile_image,
                    "profile_image": chefData[i].banner_image,
                    "followerCount": followerDetails
                };

                resultData.push(data);
            }
            res.status(200).json(resultData);
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

}
module.exports = PostFollowController;