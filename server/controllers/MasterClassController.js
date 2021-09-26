const { MasterClass } = require('../models/masterClass');
const multer = require("multer");
const { User } = require('../models/users');
const UserController = require("./UserController");
const { v4: uuidv4 } = require('uuid');
const AWS = require("aws-sdk");
const moment = require('moment');
AWS.config.update({
    signatureVersion: 'v4'
});
const s3 = new AWS.S3();

class MasterClassController {

    static async addMasterClass(req, res) {
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

            if(chefData.role_id == 2){

                if(chefData.chef_details.subscription.subscription_type == 'free'){

                    res.status(401).json({
                        message: 'you not have any subcription plan'
                    })

                } else if(chefData.chef_details.subscription.subscription_type == 'basic'){

                    let date = new Date()
                    let firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
                    let lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                    firstDay = moment(firstDay).format()
                    lastDay = moment(lastDay).format('YYYY-MM-DD 23:59:59')
                    var wh = {}
                    wh.chef_id = req.body.chef_id
                    wh['$and'] = [{
                        createdAt: {
                            $gte: firstDay
                        }
                    }, {
                        createdAt: {
                            $lte: lastDay
                        }
                    }]
                    
                    const onlyOneMasterClass = await MasterClass.find(wh)
                    if(onlyOneMasterClass[0] == null){
                        MasterClassController.e_class_post(req, res)
                    } else {
                        res.status(401).json({
                            message: 'you posted one post this month so u cant post'
                        })
                    }

                } else if(chefData.chef_details.subscription.subscription_type == 'vip'){
                    MasterClassController.e_class_post(req, res)
                } else {
                    res.status(401).json({
                        message: 'subcription error'
                    })
                }
                
            } else {
                return res.status(402).json({ message: 'Your Account is not chef Account' });
            }

        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async e_class_post(req, res){
        console.log('function call')
        const masterClass = new MasterClass({
            chef_id: req.body.chef_id,
            title: req.body.title,
            cuisine: req.body.cuisine,
            dietary: req.body.dietary,
            description: req.body.description,
            ingredients: req.body.ingredients,
            start_date: req.body.start_date,
            start_time: req.body.start_time,
            time_zone: req.body.time_zone,
            duration: req.body.duration,
            location: req.body.location,
            ticket_group_number: req.body.ticket_group_number,
            price: req.body.price,
            notification: req.body.notification,
            video_type: req.body.video_type, 
            video_url: req.body.video_url,
            total_ticket: req.body.total_ticket,
            available_ticket: req.body.total_ticket,
        });

        const masterClassData = await masterClass.save();

        res.status(200).json({
            message: 'MasterClass added',
            masterClass_id: masterClassData._id
        });
    }

    static async uploadMasterClassImages(req, res) {
        try {

            if (!req.params.masterClass_id) {
                res.status(402).json({ message: 'Chef id is required' });
            }

            const masterClass = await MasterClass.findById({ _id: req.params.masterClass_id });

            if (masterClass) {
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

                        masterClass.mclass_content = data.key;
                        await masterClass.save();
                        res.status(200).json({ message: 'image uploaded successfully' });
                    });
                });
            }

        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async getAllMasterClass(req, res) {
        try {
            const masterClasses = await MasterClass.find().sort({ createdAt: -1 });
            for (let i = 0; i < masterClasses.length; i++) {

                if (masterClasses[i].mclass_content && masterClasses[i].mclass_content.substring(0, 4) !== 'http') {
                    masterClasses[i].mclass_content = await UserController.getSignedURL(masterClasses[i].mclass_content);
                }
            }
            res.status(200).json(masterClasses);
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async getAllFilterMasterClass(req, res) {
        try {
            req.query.diet_type = JSON.parse(req.query.diet_type);
            let postData = [];
            if (req.query.live === 'true') {
                postData = await MasterClass.find({ start_date: { $gte: new Date(req.query.start_date), $lte: new Date(req.query.end_date) }, price: { $gte: req.query.start_price, $lte: req.query.end_price }, mclass_content: 'live', cuisine: req.query.cuisine_type, $or: req.query.diet_type });

            } else if (req.query.pre_recorded === 'true') {
                postData = await MasterClass.find({ start_date: { $gte: new Date(req.query.start_date), $lte: new Date(req.query.end_date) }, price: { $gte: req.query.start_price, $lte: req.query.end_price }, mclass_content: 'pre-recorded', cuisine: req.query.cuisine_type, $or: req.query.diet_type });

            } else if (req.query.vip === 'true') {
                postData = await MasterClass.find({ start_date: { $gte: new Date(req.query.start_date), $lte: new Date(req.query.end_date) }, price: { $gte: req.query.start_price, $lte: req.query.end_price }, cuisine: req.query.cuisine_type, $or: req.query.diet_type });
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
                postData = await MasterClass.find({ start_date: { $gte: new Date(req.query.start_date), $lte: new Date(req.query.end_date) }, price: { $gte: req.query.start_price, $lte: req.query.end_price }, cuisine: req.query.cuisine_type, $or: req.query.diet_type });

                for (let i = 0; i < postData.length; i++) {
                    const chefData = await User.findById({ _id: postData[i].chef_id }).select('chef_details.rate -_id');

                    if (chefData) {
                        postData[i].chef_rate = chefData.chef_details.rate;
                    }
                }
                postData.sort(sortByProperty("chef_rate"));
            }
            res.status(200).json(postData);
        }
        catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async getMasterClassByID(req, res) {
        try {
            if (!req.params.masterClass_id) {
                res.status(401).json({
                    message: 'Required masterClass id'
                });
            }

            const masterClasses = await MasterClass.findOne({ _id: req.params.masterClass_id });

            if (masterClasses) {

                if (masterClasses.mclass_content && masterClasses.mclass_content.substring(0, 4) !== 'http') {
                    masterClasses.mclass_content = await UserController.getSignedURL(masterClasses.mclass_content);
                }
            }

            res.status(200).json(masterClasses);
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async getMasterClassByChefID(req, res) {
        try {
            if (!req.params.chef_id) {
                res.status(401).json({
                    message: 'Required chef_id'
                });
            }

            const masterClasses = await MasterClass.find({ chef_id: req.params.chef_id });

            for (let i = 0; i < masterClasses.length; i++) {

                if (masterClasses[i].mclass_content && masterClasses[i].mclass_content.substring(0, 4) !== 'http') {
                    masterClasses[i].mclass_content = await UserController.getSignedURL(masterClasses[i].mclass_content);
                }
            }
            res.status(200).json(masterClasses);
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async updateMasterClass(req, res) {
        try {
            if (!req.body) {
                res.status(401).json({
                    message: 'Request body not defined'
                });
            } else if (!req.body.masterClass_id) {
                res.status(401).json({
                    message: 'Required body params not defined'
                });
            }

            const masterClassData = await MasterClass.findById({ _id: req.body.masterClass_id });

            if (!masterClassData) {
                res.status(401).json({ message: 'masterClass not exist' });
            } else {

                masterClassData.chef_id = req.body.chef_id;
                masterClassData.title = req.body.title;
                masterClassData.cuisine = req.body.cuisine;
                masterClassData.dietary = req.body.dietary;
                masterClassData.description = req.body.description;
                masterClassData.ingredients = req.body.ingredients;
                masterClassData.start_date = req.body.start_date;
                masterClassData.start_time = req.body.start_time;
                masterClassData.duration = req.body.duration;
                masterClassData.location = req.body.location;
                masterClassData.ticket_group_number = req.body.ticket_group_number;
                masterClassData.price = req.body.price;
                masterClassData.notification = req.body.notification;

                await masterClassData.save();
                res.status(200).json({ message: 'MasterClass Updated' });
            }
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async deleteMasterClass(req, res) {
        try {
            if (!req.params.masterClass_id) {
                res.status(401).json({
                    message: 'Request params not defined'
                });
            }

            await MasterClass.remove({ _id: req.params.masterClass_id });
            res.status(200).json({ message: 'masterClass deleted' });
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async deleteMasterClassImages(req, res) {
        try {
            if (!req.params.masterClass_id) {
                res.status(402).json({ message: 'MasterClass id is required' });
            }

            const masterClass = await MasterClass.findById({ _id: req.params.masterClass_id });

            if (!masterClass) {
                res.status(402).json({ message: 'MasterClass id is not valid' });
            }
            masterClass.mclass_content = '';
            await masterClass.save();
            // req.body.images.map(async (image) => {
            //     if (masterClass.images.includes(image)) {
            //         const index = masterClass.images.indexOf(image);
            //         if (index > -1) {
            //             masterClass.images.splice(index, 1);
            //         }
            //     }
            //     masterClass.images = masterClass.images;
            //     await masterClass.save();
            // });
            res.status(200).json({ message: 'image deleted' });

        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async likeMasterClass(req, res) {
        try {
            if (!req.body) {
                res.status(401).json({
                    message: 'Request body not defined'
                });
            } else if (!req.body.masterClass_id) {
                res.status(401).json({
                    message: 'Required body params not defined'
                });
            }

            await MasterClass.findOneAndUpdate({ _id: req.body.masterClass_id }, { $inc: { 'likes': 1 } });

            res.status(200).json({ message: 'like masterClass' });
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async unLikeMasterClass(req, res) {
        try {
            if (!req.body) {
                res.status(401).json({
                    message: 'Request body not defined'
                });
            } else if (!req.body.masterClass_id) {
                res.status(401).json({
                    message: 'Required body params not defined'
                });
            }

            await MasterClass.findOneAndUpdate({ _id: req.body.masterClass_id }, { $inc: { 'likes': -1 } });

            res.status(200).json({ message: 'unlike masterClass' });
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async searchMClass(req, res) {
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
            vipChef.map((mClassItem) => {
                vipIds.push(mClassItem._id)
            })
    
            const vipsearch = await MasterClass.find({ location: req.params.city, chef_id: {$in: vipIds} }).sort({updatedAt: -1});
            const nonvipsearch = await MasterClass.find({ location: req.params.city, chef_id: {$nin: vipIds} }).sort({updatedAt: -1});
            
            const search = vipsearch.concat(nonvipsearch)
            res.status(200).json(search);
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }
}


function sortByProperty(property) {
    console.log(property);
    return function (a, b) {
        if (a[property] > b[property])
            return -1;
        else if (a[property] < b[property])
            return 1;

        return 0;
    };
}
module.exports = MasterClassController;