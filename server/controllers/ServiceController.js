const mongoose = require("mongoose");
const { Service } = require('../models/service');
const multer = require("multer");
const { Like } = require("../models/like");
const { Share } = require("../models/share");
const { User } = require('../models/users');
const UserController = require("./UserController");
const { v4: uuidv4 } = require('uuid');
const AWS = require("aws-sdk");
const { CostExplorer } = require("aws-sdk");
AWS.config.update({
    signatureVersion: 'v4'
});
const s3 = new AWS.S3();

class ServiceController {

    static async addService(req, res) {
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

            if (chefData.chef_details.subscription.subscription_type == 'free') {

                res.status(401).json({
                    message: 'you not have any subcription plan'
                })

            } else {

                const service = new Service({
                    chef_id: req.body.chef_id,
                    service_type: req.body.service_type,
                    description: req.body.description,
                    service_days_hour: req.body.service_days_hour,
                    location: req.body.location,
                    price: req.body.price,
                });

                service.available.pickup = req.body.pickup;
                service.available.delivery = req.body.delivery;
                service.available.fee = req.body.fee;

                const serviceData = await service.save();

                res.status(200).json({
                    message: 'Service added',
                    food_id: serviceData._id
                });
            }

        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async uploadServiceImages(req, res) {
        try {

            if (!req.params.service_id) {
                res.status(402).json({ message: 'service_id is required' });
            }

            const service = await Service.findById({ _id: req.params.service_id });

            if (service) {
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

                        service.service_content = data.key;
                        await service.save();
                        res.status(200).json({ message: 'image uploaded successfully' });
                    });
                });
            } else {
                res.status(402).json({ message: 'Wrong service id' });
            }
            // res.sendFile('D:/safe/upload/upload-1613562307199.jpg');

        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async getAllService(req, res) {
        try {
            var perPage = (typeof req.query.perPage != 'undefined') ? parseInt(req.query.perPage) : 10;
            var page = (typeof req.query.page != 'undefined') ? (req.query.page == 0) ? 1 : req.query.page || 1 : 1;
            var skip = (perPage * page) - perPage;

            var start_date = { 
                $gte: (typeof req.query.start_date != 'undefined') ? new Date(req.query.start_date+ ' 00:00:00') : new Date('0001-01-01 00:00:00'), 
                $lte: (typeof req.query.end_date != 'undefined') ? new Date(req.query.end_date+ ' 23:59:59') : new Date()
            }
            console.log(start_date)
            const foods = await Service.find();
            if (req.params.user_id) {
                const post = await Like.find({ user_id: req.params.user_id, item_type: 'service' }).select('item_id -_id').sort({ createdAt: -1 });
                const postIDS = [];
                post.map((post_id) => {
                    postIDS.push(post_id.item_id);
                });

                for (let i = 0; i < foods.length; i++) {
                    if (postIDS.includes(foods[i]._id.toString())) {
                        foods[i].is_like = true;
                    }

                    if (foods[i].service_content && foods[i].service_content.substring(0, 4) !== 'http') {
                        foods[i].service_content = await UserController.getSignedURL(foods[i].service_content);
                    }
                }

                console.log(foods)

                res.status(200).json(foods);
            } else {
                res.status(200).json(foods);
            }
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async getServiceByID(req, res) {
        try {
            if (!req.params.service_id) {
                res.status(401).json({
                    message: 'Required food id'
                });
            }

            const services = await Service.findOne({ _id: req.params.service_id });
            if (services.service_content && services.service_content.substring(0, 4) !== 'http') {
                services.service_content = await UserController.getSignedURL(services.service_content);
            }
            res.status(200).json(services);
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async getServiceByChefID(req, res) {
        try {
            if (!req.params.chef_id) {
                res.status(401).json({
                    message: 'Required chef_id'
                });
            }

            const services = await Service.find({ chef_id: req.params.chef_id });

            if (services) {
                for (let i = 0; i < services.length; i++) {

                    if (services[i].service_content && services[i].service_content.substring(0, 4) !== 'http') {
                        services[i].service_content = await UserController.getSignedURL(services[i].service_content);
                    }
                }
            }

            res.status(200).json(services);
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async updateService(req, res) {
        try {
            if (!req.body) {
                res.status(401).json({
                    message: 'Request body not defined'
                });
            } else if (!req.body.service_id) {
                res.status(401).json({
                    message: 'Required body params not defined'
                });
            }

            const serviceData = await Service.findById({ _id: req.body.service_id });

            if (!serviceData) {
                res.status(401).json({ message: 'post not exist' });
            } else {
                serviceData.chef_id = req.body.chef_id;
                serviceData.service_type = req.body.service_type;
                serviceData.description = req.body.description;
                serviceData.service_days_hour = req.body.service_days_hour;
                serviceData.price = req.body.price;

                await serviceData.save();

                res.status(200).json({ message: 'service updated' });
            }
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async deleteServiceImages(req, res) {
        try {
            if (!req.params.service_id) {
                res.status(402).json({ message: 'Service id is required' });
            }

            const service = await Service.findById({ _id: req.params.service_id });

            if (!service) {
                res.status(402).json({ message: 'service id is not valid' });
            }
            service.service_content = '';
            await service.save();
            // req.body.images.map(async (image) => {
            //     if (service.images.includes(image)) {
            //         const index = service.images.indexOf(image);
            //         if (index > -1) {
            //             service.images.splice(index, 1);
            //         }
            //     }
            //     service.service_content = service.images;
            //     await service.save();
            // });
            res.status(200).json({ message: 'image deleted' });

        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async deleteService(req, res) {
        try {
            if (!req.params.service_id) {
                res.status(401).json({
                    message: 'Request params not defined'
                });
            }

            await Service.remove({ _id: req.params.service_id });
            res.status(200).json({ message: 'service deleted' });
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async shareService(req, res) {
        try {
            if (!req.body) {
                res.status(401).json({
                    message: 'Request body not defined'
                });
            } else if (!req.body.service_id) {
                res.status(401).json({
                    message: 'Required body params not defined'
                });
            }

            await Service.findOneAndUpdate({ _id: req.body.service_id }, { $inc: { 'share': 1 } });
            const share = new Share({
                item_id: req.body.service_id,
                user_id: req.body.user_id,
                item_type: 'service'
            });
            await share.save();

            res.status(200).json({ message: 'shared' });
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async userSharedService(req, res) {
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

            const post = await Share.find({ user_id: req.params.user_id, item_type: 'service' }).select('item_id -_id');
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

    static async like(req, res) {
        try {
            if (!req.body) {
                res.status(401).json({
                    message: 'Request body not defined'
                });
            } else if (!req.body.service_id) {
                res.status(401).json({
                    message: 'Required body params not defined'
                });
            }

            const isLike = await Like.findOne({ item_id: req.body.service_id, user_id: req.body.user_id, item_type: 'service' });

            if (isLike) {
                res.status(403).json({ message: 'like user already liked' });
            } else {
                await Service.findOneAndUpdate({ _id: req.body.service_id }, { $inc: { 'likes': 1 } });

                const like = new Like({
                    item_id: req.body.service_id,
                    user_id: req.body.user_id,
                    item_type: 'service'
                });
                await like.save();

                res.status(200).json({ message: 'like service' });
            }
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async unLike(req, res) {
        try {
            if (!req.body) {
                res.status(401).json({
                    message: 'Request body not defined'
                });
            } else if (!req.body.service_id) {
                res.status(401).json({
                    message: 'Required body params not defined'
                });
            }

            const isLike = await Like.findOne({ item_id: req.body.service_id, user_id: req.body.user_id, item_type: 'service' });

            if (!isLike) {
                res.status(403).json({ message: 'like user not liked' });
            } else {
                await Service.findOneAndUpdate({ _id: req.body.service_id }, { $inc: { 'likes': -1 } });
                await Like.findOneAndDelete({ item_id: req.body.service_id, item_type: 'service', user_id: req.body.user_id });

                res.status(200).json({ message: 'unlike service' });
            }
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }
    static async userLikedService(req, res) {
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

            const post = await Like.find({ user_id: req.params.user_id, item_type: 'service' }).select('item_id -_id');
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

    static async searchService(req, res) {
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
            vipChef.map((serviceItem) => {
                vipIds.push(serviceItem._id)
            })

            const vipsearch = await Service.find({ location: req.params.city, chef_id: {$in: vipIds} }).sort({updatedAt: -1});
            const nonvipsearch = await Service.find({ location: req.params.city, chef_id: {$nin: vipIds} }).sort({updatedAt: -1});
            
            const search = vipsearch.concat(nonvipsearch)
            res.status(200).json(search);
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }
}
module.exports = ServiceController;