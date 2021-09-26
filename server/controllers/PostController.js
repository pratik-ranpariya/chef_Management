const mongoose = require("mongoose");
const { Post } = require('../models/posts');
const multer = require("multer");
const { Comment } = require("../models/postsComment");
const { Like } = require("../models/like");
const { Share } = require("../models/share");
const { User } = require("../models/users");

const { v4: uuidv4 } = require('uuid');
const AWS = require("aws-sdk");
const UserController = require("./UserController");

AWS.config.update({
    signatureVersion: 'v4'
});

const s3 = new AWS.S3();


class PostController {

    static async addPost(req, res) {
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

            const post = new Post({
                chef_id: req.body.chef_id,
                description: req.body.description,
                location: req.body.location
            });

            const postData = await post.save();

            res.status(200).json({
                message: 'Post added',
                post_id: postData._id
            });

        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async uploadPostImages(req, res) {
        try {

            if (!req.params.post_id) {
                res.status(402).json({ message: 'Chef id is required' });
            }

            const post = await Post.findById({ _id: req.params.post_id });

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
                    post.post_content = data.key;
                    await post.save();
                    res.status(200).json({ message: 'image uploaded successfully' });
                });
            });
            // res.sendFile('D:/safe/upload/upload-1613562307199.jpg');

        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async getAllPost(req, res) {
        try {
            var perPage = (typeof req.query.perPage != 'undefined') ? parseInt(req.query.perPage) : 10;
            var page = (typeof req.query.page != 'undefined') ? (req.query.page == 0) ? 1 : req.query.page || 1 : 1;
            var skip = (perPage * page) - perPage;

            var start_date = { 
                $gte: (typeof req.query.start_date != 'undefined') ? new Date(req.query.start_date+ ' 00:00:00') : new Date('0001-01-01 00:00:00'), 
                $lte: (typeof req.query.end_date != 'undefined') ? new Date(req.query.end_date+ ' 23:59:59') : new Date()
            }

            const posts = await Post.find({updatedAt: start_date}).sort({ updatedAt: -1 }).skip(skip).limit(perPage);
            if (req.params.user_id) {
                const post = await Like.find({ user_id: req.params.user_id, item_type: 'post' }).select('item_id -_id').sort({ createdAt: -1 });
                const postIDS = [];
                post.map((post_id) => {
                    postIDS.push(post_id.item_id);
                });

                for (let i = 0; i < posts.length; i++) {
                    if (postIDS.includes(posts[i]._id.toString())) {
                        posts[i].is_like = true;
                    }
                }

                for (let i = 0; i < posts.length; i++) {
                    if (posts[i].post_content && posts[i].post_content.substring(0, 4) !== 'http') {
                        posts[i].post_content = await UserController.getSignedURL(posts[i].post_content);
                    }
                }
                res.status(200).json(posts);
            } else {
                res.status(200).json(posts);
            }
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async getAllFilterPost(req, res) {
        try {
            let postData = null;
            if (req.query.commented === 'true') {
                postData = await Post.find({ "createdAt": { "$gte": new Date(req.query.start_date), "$lt": new Date(req.query.end_date) } }).sort({ comments: -1 });

            } else if (req.query.liked === 'true') {
                postData = await Post.find({ "createdAt": { "$gte": new Date(req.query.start_date), "$lt": new Date(req.query.end_date) } }).sort({ likes: -1 });

            } else if (req.query.vip === 'true') {
                postData = await Post.find({ "createdAt": { "$gte": new Date(req.query.start_date), "$lt": new Date(req.query.end_date) } });
                const sortedResult = [];

                for (let i = 0; i < postData.length; i++) {
                    const chefData = await User.findById({ _id: postData[i].chef_id }).select('chef_details.subscription');

                    if (chefData) {
                        console.log(chefData.chef_details.subscription.subscription_type);
                        if (chefData.chef_details.subscription.subscription_type === 'vip') {
                            sortedResult.push(postData[i]);
                        }
                    }
                }
                postData = sortedResult;
            } else if (req.query.rated === 'true') {
                postData = await Post.find({ "createdAt": { "$gte": new Date(req.query.start_date), "$lt": new Date(req.query.end_date) } }).sort({ rate: -1 });
            }

            const post = await Like.find({ user_id: req.query.user_id, item_type: 'post' }).select('item_id -_id');
            const postIDS = [];
            post.map((post_id) => {
                postIDS.push(post_id.item_id);
            });

            for (let i = 0; i < postData.length; i++) {
                if (postIDS.includes(postData[i]._id.toString())) {
                    postData[i].is_like = true;
                }
            }

            // const posts = await Post.find({ "createdAt": { "$gte": new Date(req.query.start_date), "$lt": new Date(req.query.end_date) } });
            res.status(200).json(postData);
        }
        catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async getPostByID(req, res) {
        try {
            if (!req.params.post_id) {
                res.status(401).json({
                    message: 'Required post id'
                });
            }

            const posts = await Post.findOne({ _id: req.params.post_id });
            if (posts) {
                if (posts.post_content && posts.post_content.substring(0, 4) !== 'http') {
                    posts.post_content = await UserController.getSignedURL(posts.post_content);
                }
            }
            res.status(200).json(posts);
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async getPostByChefID(req, res) {
        try {
            if (!req.params.chef_id) {
                res.status(401).json({
                    message: 'Required chef_id'
                });
            }

            const posts = await Post.find({ chef_id: req.params.chef_id });


            for (let i = 0; i < posts.length; i++) {
                if (posts[i].post_content && posts[i].post_content.substring(0, 4) !== 'http') {
                    posts[i].post_content = await UserController.getSignedURL(posts[i].post_content);
                }
            }

            res.status(200).json(posts);
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async updatePost(req, res) {
        try {
            if (!req.body) {
                res.status(401).json({
                    message: 'Request body not defined'
                });
            } else if (!req.body.post_id) {
                res.status(401).json({
                    message: 'Required body params not defined'
                });
            }

            const postData = await Post.findById({ _id: req.body.post_id });

            if (!postData) {
                res.status(401).json({ message: 'post not exist' });
            } else {
                postData.chef_id = req.body.chef_id;
                postData.description = req.body.description;
                postData.location = req.body.location;

                await postData.save();
                res.status(200).json({ message: 'Post Updated' });
            }
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async deletePost(req, res) {
        try {
            if (!req.params.post_id) {
                res.status(401).json({
                    message: 'Request params not defined'
                });
            }

            await Post.remove({ _id: req.params.post_id });
            res.status(200).json({ message: 'post deleted' });
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async deletePostImages(req, res) {
        try {
            if (!req.params.post_id) {
                res.status(402).json({ message: 'Post id is required' });
            }

            const post = await Post.findById({ _id: req.params.post_id });

            if (!post) {
                res.status(402).json({ message: 'Post id is not valid' });
            }

            req.body.images.map(async (image) => {
                if (post.images.includes(image)) {
                    const index = post.images.indexOf(image);
                    if (index > -1) {
                        post.images.splice(index, 1);
                    }
                }
                post.images = post.images;
                await post.save();
            });
            res.status(200).json({ message: 'image deleted' });

        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async sharePost(req, res) {
        try {
            if (!req.body) {
                res.status(401).json({
                    message: 'Request body not defined'
                });
            } else if (!req.body.post_id) {
                res.status(401).json({
                    message: 'Required body params not defined'
                });
            }

            await Post.findOneAndUpdate({ _id: req.body.post_id }, { $inc: { 'share': 1 } });
            const share = new Share({
                item_id: req.body.post_id,
                user_id: req.body.user_id,
                item_type: 'post'
            });
            await share.save();

            res.status(200).json({ message: 'shared post' });
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async userSharedPost(req, res) {
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

            const post = await Share.find({ user_id: req.params.user_id, item_type: 'post' }).select('item_id -_id');
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

    static async likePost(req, res) {
        try {
            if (!req.body) {
                res.status(401).json({
                    message: 'Request body not defined'
                });
            } else if (!req.body.post_id) {
                res.status(401).json({
                    message: 'Required body params not defined'
                });
            }

            const isLike = await Like.findOne({ item_id: req.body.post_id, user_id: req.body.user_id, item_type: 'post' });

            if (isLike) {
                res.status(403).json({ message: 'like user already liked' });
            } else {
                await Post.findOneAndUpdate({ _id: req.body.post_id }, { $inc: { 'likes': 1 } });
                const like = new Like({
                    item_id: req.body.post_id,
                    user_id: req.body.user_id,
                    item_type: 'post'
                });
                await like.save();

                res.status(200).json({ message: 'like post' });
            }
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async unLikePost(req, res) {
        try {
            if (!req.body) {
                res.status(401).json({
                    message: 'Request body not defined'
                });
            } else if (!req.body.post_id) {
                res.status(401).json({
                    message: 'Required body params not defined'
                });
            }

            const isLike = await Like.findOne({ item_id: req.body.post_id, user_id: req.body.user_id, item_type: 'post' });

            if (!isLike) {
                res.status(403).json({ message: 'like user not liked' });
            } else {
                await Post.findOneAndUpdate({ _id: req.body.post_id }, { $inc: { 'likes': -1 } });
                await Like.findOneAndDelete({ item_id: req.body.post_id, item_type: 'post', user_id: req.body.user_id });
            }

            res.status(200).json({ message: 'unlike post' });
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async userLikedPost(req, res) {
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

            const post = await Like.find({ user_id: req.params.user_id, item_type: 'post' }).select('item_id -_id');
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

    static async searchPost(req, res) {
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
            vipChef.map((postItem) => {
                vipIds.push(postItem._id)
            })

            const vipsearch = await Post.find({ location: req.params.city, chef_id: {$in: vipIds} }).sort({updatedAt: -1});
            const nonvipsearch = await Post.find({ location: req.params.city, chef_id: {$nin: vipIds} }).sort({updatedAt: -1});

            const search = vipsearch.concat(nonvipsearch)
            res.status(200).json(search);
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }
}
function sortByProperty(property) {
    return function (a, b) {
        if (a[property] < b[property])
            return 1;
        else if (a[property] > b[property])
            return -1;

        return 0;
    };
}
module.exports = PostController;