const { User } = require('../models/users');
const CryptoJS = require("crypto-js");
const jwt = require('jsonwebtoken');
const multer = require("multer");
const moment = require("moment");
const AWS = require("aws-sdk");
const nodemailer = require('nodemailer');
const { PostFollow } = require('../models/postFollow');
const sgMail = require('@sendgrid/mail');
const { Temp } = require('../models/temp');
const { v4: uuidv4 } = require('uuid');
const { Post } = require('../models/posts');
const { Recipes } = require('../models/recipes');
const { MasterClass } = require('../models/masterClass');
const { Food } = require('../models/food');
const { Service } = require('../models/service');
const { DataSync } = require('aws-sdk');

AWS.config.update({
    signatureVersion: 'v4'
});

const s3 = new AWS.S3();

class UserController {

    static async userLogin(req, res) {
        try {
            if (!req.body) {
                res.status(401).json({ message: 'Request body not defined' });
            }
            else if (!req.body.user_name || !req.body.password) {
                res.status(401).json({ message: 'Required body params not defined' });
            }

            const userData = await User.findOne({ $or: [{ user_name: req.body.user_name }, { email: req.body.user_name }] });
            if (userData) {
                var bytes = CryptoJS.AES.decrypt(userData.password, process.env.ENC_KEY);
                var originalText = bytes.toString(CryptoJS.enc.Utf8);

                if (originalText !== req.body.password) {
                    res.status(401).json({ message: 'Invalid Email/ID or Password' });
                } else {
                    const token = jwt.sign({ user_name: userData.user_name }, process.env.TOKEN_SECRET_KEY, { expiresIn: '365d' });

                    let profile = false;
                    if (userData.profile_image) {
                        profile = true;
                    }
                    const result = {
                        id: userData._id,
                        user_name: userData.user_name,
                        email: userData.email,
                        auth_token: token,
                        profile: profile,
                        roleID: userData.role_id,
                    };
                    res.status(200).json(result);
                }
            } else {
                res.status(401).json({ message: 'Invalid Email/ID or Password' });
            }
        } catch (e) {
            console.log(e.message);
            res.status(401).json(e);
        }
    }

    static async userFacebookRegistration(req, res) {
        try {
            if (req.body) {
                res.status(401).json({ message: 'Request body not defined' });
            } else if (!req.body.email || !req.body.roleID || !req.body.user_name) {
                res.status(401).json({ message: 'Required body params not defined' });
            } else {

                let userData = await User.findOne({ $and: [{ email: req.body.email, user_name: req.body.user_name }] });

                if (!userData) {
                    const user = new User({
                        email: req.body.email,
                        user_name: req.body.user_name,
                        role_id: req.body.roleID
                    });

                    userData = await user.save();
                }
                const token = jwt.sign({ email: userData.user_name }, process.env.TOKEN_SECRET_KEY, { expiresIn: '365d' });

                const result = {
                    id: userData._id,
                    user_name: userData.user_name,
                    email: userData.email,
                    role_id: req.body.roleID,
                    auth_token: token
                };
                res.status(200).json(result);
            }
        } catch (e) {
            console.log(e.message);
            res.status(401).json(e);
        }
    }

    static async userTempRegistration(req, res) {
        try {
            if (!req.body) {
                res.status(401).json({ message: 'Request body not defined' });
            } else if (req.body.password.length < 8 || req.body.password.length > 32) {
                res.status(401).json({ message: 'Password must be min. 8 char' });
            }
            else if (!req.body.email || !req.body.password || !req.body.roleID || !req.body.user_name) {
                res.status(401).json({ message: 'Required body params not defined' });
            } else {
                //Password Encryption
                const encPassword = CryptoJS.AES.encrypt(req.body.password, process.env.ENC_KEY).toString();

                const userName = await User.findOne({ user_name: req.body.user_name });
                const userEmail = await User.findOne({ email: req.body.email });

                if (userName) {
                    res.status(401).json({ message: 'Email already registered' });
                } else if (userEmail) {
                    res.status(401).json({ message: 'Email already registered' });
                } else {
                    const user = new Temp({
                        email: req.body.email,
                        user_name: req.body.user_name,
                        password: encPassword,
                        role_id: req.body.roleID
                    });
                    const userData = await user.save();

                    const min = 100000, max = 999999;
                    let optData = Math.floor(Math.random() * (max - min + 1) + min);

                    userData.otp = optData;

                    await userData.save();

                    const msg = {
                        to: userData.email, // Change to your recipient
                        from: process.env.SENDER_EMAIL, // Change to your verified sender
                        subject: 'Pin Chef: Account Verification',
                        text: 'Please use OTP for Account Verification',
                        html: '<h3>Hello ' + userData.user_name + '</h3><p>Your One Time OTP is <h4>' + optData + '</h4></p>'
                    };

                    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                    sgMail
                        .send(msg)
                        .then(() => {
                            console.log('Email sent');
                        })
                        .catch((error) => {
                            console.error(error);
                        });

                    const result = {
                        temp_id: userData._id,
                        user_name: userData.user_name
                    };

                    res.status(200).json(result);
                }
            }
        } catch (e) {
            console.log(e.message);
            res.status(401).json(e.message);
        }

    }

    static async userRegistration(req, res) {
        try {
            if (!req.body) {
                res.status(401).json({ message: 'Request body not defined' });
            } else if (!req.body.temp_id || !req.body.otp) {
                res.status(401).json({ message: 'Required body params not defined' });
            } else {

                const userTempData = await Temp.findOne({ $and: [{ _id: req.body.temp_id, otp: req.body.otp }] });

                console.log(userTempData);
                if (!userTempData) {
                    res.status(401).json({ message: 'Enter valid OTP' });
                } else {
                    const user = new User({
                        email: userTempData.email,
                        user_name: userTempData.user_name,
                        password: userTempData.password,
                        role_id: userTempData.role_id
                    });

                    const userData = await user.save();

                    const token = jwt.sign({ email: userData.user_name }, process.env.TOKEN_SECRET_KEY, { expiresIn: '365d' });

                    const result = {
                        id: userData._id,
                        user_name: userData.user_name,
                        email: userData.email,
                        role_id: userData.role_id,
                        auth_token: token
                    };
                    await Temp.findByIdAndRemove({ _id: req.body.temp_id });
                    res.status(200).json(result);
                }
            }
        } catch (e) {
            console.log(e.message);
            res.status(401).json(e);
        }

    }

    static async changePassword(req, res) {
        try {
            if (!req.body) {
                res.status(401).json({
                    message: 'Request body not defined'
                });
            } else if (req.body.new_password.length < 8) {
                res.status(401).json({ message: 'Password must be min. 8 char' });
            } else if (!req.body.user_name || !req.body.new_password) {
                res.status(401).json({
                    message: 'Required body params not defined'
                });
            }
            const userData = await User.findOne({ $or: [{ user_name: req.body.user_name }, { email: req.body.user_name }] });
            if (userData) {

                const encPassword = CryptoJS.AES.encrypt(req.body.new_password, process.env.ENC_KEY).toString();
                await User.updateOne({ $or: [{ user_name: req.body.user_name }, { email: req.body.user_name }] }, {
                    $set: {
                        password: encPassword
                    }
                });
                res.status(200).json({
                    message: 'Password updated'
                });

            } else {
                res.status(401).json({
                    message: 'Invalid username'
                });
            }


        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async userDelete(req, res) {
        try {
            if (!req.params.id) {
                res.status(401).json({
                    message: 'Request params not defined'
                });
            }

            await Service.deleteMany({ chef_id: req.params.id });
            await Food.deleteMany({ chef_id: req.params.id });
            await MasterClass.deleteMany({ chef_id: req.params.id });
            await Recipes.deleteMany({ chef_id: req.params.id });
            await Post.deleteMany({ chef_id: req.params.id });
            await User.findByIdAndRemove({ _id: req.params.id });

            res.status(200).json({
                message: 'User Deleted'
            });
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async reSendOTP(req, res) {
        try {
            if (!req.body) {
                res.status(401).json({
                    message: 'Request body not defined'
                });
            } else if (!req.body.user_name) {
                res.status(401).json({
                    message: 'Required body params not defined'
                });
            }

            const user = await User.findOne({ $or: [{ user_name: req.body.user_name }, { email: req.body.user_name }] });
            const min = 100000, max = 999999;
            let optData = Math.floor(Math.random() * (max - min + 1) + min);
            if (user) {
                const msg = {
                    to: user.email, // Change to your recipient
                    from: process.env.SENDER_EMAIL, // Change to your verified sender
                    subject: 'Pin Chef: OTP',
                    text: 'Please use OTP',
                    html: '<h3>Hello ' + user.user_name + '</h3><p>Your One Time OTP is <h4>' + optData + '</h4></p>'
                };

                sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                sgMail
                    .send(msg)
                    .then(() => {
                        console.log('Email sent');
                    })
                    .catch((error) => {
                        console.error(error);
                    });

                user.otp = optData;
                user.save();

                res.status(200).json({
                    otp: optData,
                    email: user.email,
                    user_name: user.user_name
                });
            } else {
                res.status(401).json({
                    message: 'Enter valid user_name or password'
                });
            }
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async userForgetPassword(req, res) {
        try {
            if (!req.body) {
                res.status(401).json({
                    message: 'Request body not defined'
                });
            } else if (!req.body.user_name) {
                res.status(401).json({
                    message: 'Required body params not defined'
                });
            }

            const user = await User.findOne({ $or: [{ user_name: req.body.user_name }, { email: req.body.user_name }] });
            const min = 100000, max = 999999;
            let optData = Math.floor(Math.random() * (max - min + 1) + min);
            if (user) {
                const msg = {
                    to: user.email, // Change to your recipient
                    from: process.env.SENDER_EMAIL, // Change to your verified sender
                    subject: 'Pin Chef: Reset Password',
                    text: 'Please use OTP for reset password',
                    html: '<h3>Hello ' + user.user_name + '</h3><p>Your One Time OTP is <h4>' + optData + '</h4></p>'
                };

                sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                sgMail
                    .send(msg)
                    .then(() => {
                        console.log('Email sent');
                    })
                    .catch((error) => {
                        console.error(error);
                    });

                user.otp = optData;
                user.save();

                res.status(200).json({
                    otp: optData,
                    email: user.email,
                    user_name: user.user_name
                });
            } else {
                res.status(401).json({
                    message: 'Enter valid user_name or password'
                });
            }
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async verifyOTP(req, res) {
        try {
            if (!req.body) {
                res.status(401).json({
                    message: 'Request body not defined'
                });
            } else if (!req.body.user_name || !req.body.otp) {
                res.status(401).json({
                    message: 'Required body params not defined'
                });
            }

            const user = await User.findOne({ $or: [{ user_name: req.body.user_name }, { email: req.body.user_name }], otp: req.body.otp });
            if (user) {
                res.status(200).json({
                    message: 'OTP is valid'
                });
            } else {
                res.status(401).json({
                    message: 'Invalid OTP'
                });
            }
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async getAllChef(req, res) {
        try {
            const chefData = await User.find({ role_id: 2 }).select(['-password']).sort({ createdAt: -1 });

            const chef = await PostFollow.find({ user_id: req.params.user_id }).select('chef_id -_id');
            const chefIDS = [];
            chef.map((chefId) => {
                chefIDS.push(chefId.chef_id);
            });

            const resultData = [];
            for (let i = 0; i < chefData.length; i++) {
                const followerDetails = await PostFollow.find({ chef_id: chefData[i]._id }).countDocuments();

                const images = [];
                for (let j = 0; j < chefData[i].chef_details.images.length; j++) {
                    if (chefData[i].chef_details.images[j].substring(0, 4) !== 'http') {
                        images.push(await getSignedURL(chefData[i].chef_details.images[j]));
                    }
                }

                chefData[i].chef_details.images = images;

                if (chefData[i].profile_image && chefData[i].profile_image.substring(0, 4) !== 'http') {
                    chefData[i].profile_image = await getSignedURL(chefData[i].profile_image);
                }

                if (chefData[i].banner_image && chefData[i].banner_image.substring(0, 4) !== 'http') {
                    chefData[i].banner_image = await getSignedURL(chefData[i].banner_image);
                }

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
                    "profile_image": chefData[i].profile_image,
                    "banner_image": chefData[i].banner_image,
                    "followerCount": followerDetails
                };

                data['is_follow'] = false;
                if (chefIDS.includes(chefData[i]._id.toString())) {
                    data['is_follow'] = true;
                }
                resultData.push(data);
            }

            res.status(200).json(resultData);

        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async getAllUsers(req, res) {
        try {
            const chef = await User.find({ role_id: 1 }).select(['-password', '-chef_details']).sort({ createdAt: -1 });

            for (let i = 0; i < chef.length; i++) {
                if (chef[i].profile_image && chef[i].profile_image.substring(0, 4) !== 'http') {
                    chef[i].profile_image = await getSignedURL(chef[i].profile_image);
                }

                if (chef[i].banner_image && chef[i].banner_image.substring(0, 4) !== 'http') {
                    chef[i].banner_image = await getSignedURL(chef[i].banner_image);
                }
            }

            res.status(200).json(chef);

        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async getChefByID(req, res) {
        try {
            if (!req.params.id) {
                res.status(401).json({
                    message: 'Request params not defined'
                });
            }
            const chef = await User.findById({ _id: req.params.id }).select('-password');

            const followerDetails = await PostFollow.find({ chef_id: chef._id }).count();

            const images = [];
            for (let i = 0; i < chef.chef_details.images.length; i++) {
                if (chef.chef_details.images[i].substring(0, 4) !== 'http') {
                    images.push(await getSignedURL(chef.chef_details.images[i]));
                }
            }

            chef.chef_details.images = images;

            if (chef.profile_image && chef.profile_image.substring(0, 4) !== 'http') {
                chef.profile_image = await getSignedURL(chef.profile_image);
            }

            if (chef.banner_image && chef.banner_image.substring(0, 4) !== 'http') {
                chef.banner_image = await getSignedURL(chef.banner_image);
            }

            const resultArray = { chef, followerCount: followerDetails };

            res.status(200).send(resultArray);
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async updateChef(req, res) {
        try {
            if (!req.body) {
                res.status(401).json({
                    message: 'Request body not defined'
                });
            } else if (!req.body.id) {
                res.status(401).json({
                    message: 'id is not defined'
                });
            }



            const userRecord = await User.findById({ _id: req.body.id }).select('-password');
            const userName = await User.findOne({ $or: [{ user_name: req.body.user_name }, { email: req.body.user_name }] }).select('-password');

            if (!userRecord) {
                res.status(401).json({ message: 'user not exist' });
            } else {
                userRecord.mobile = req.body.mobile;
                userRecord.name = req.body.name;
                userRecord.chef_details = {
                    date_of_birth: req.body.dob,
                    gender: req.body.gender,
                    position: req.body.position,
                    languages: req.body.languages,
                    specialty: req.body.specialty,
                    sort_intro: req.body.sort_intro,
                    background_info: req.body.background_info,
                    service_hour: req.body.service_hour,
                    service: req.body.service,
                    min_purchase_amt: req.body.min_purchase_amt,
                    service_price_range: {
                        min: req.body.minAmount,
                        max: req.body.maxAmount
                    },
                    service_location: req.body.service_location,
                    address: req.body.address,
                    payment: req.body.payment_type,
                    hourly_rate: req.body.hourly_rate,
                    currency: req.body.currency,
                    restaurant_name: req.body.restaurant_name,
                };
            }

            if (req.body.user_name) {
                if (userName) {
                    res.status(401).json({ message: 'user_name already exist' });
                }
                // userRecord.user_name = req.body.user_name;
            }

            await userRecord.save();
            res.status(200).json({ message: 'chef updated' });



        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async uploadChefImages(req, res) {
        try {

            if (!req.params.id) {
                res.status(402).json({ message: 'Chef id is required' });
            } else {
                const chef = await User.findById({ _id: req.params.id }).select('-password');

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
                        Key: chef._id + `/${uuidv4()}.${fileType}`,
                        Body: req.file.buffer
                    };

                    s3.upload(params, async (error, data) => {
                        if (error) {
                            res.status(500).send(error);
                        }

                        chef.chef_details.images = data.key;
                        await chef.save();
                        res.status(200).json({ message: 'image uploaded successfully' });
                    });
                });

            }


            // res.sendFile('D:/safe/upload/upload-1613562307199.jpg');

        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async uploadChefProfileImage(req, res) {
        try {

            if (!req.params.id) {
                res.status(402).json({ message: 'Chef id is required' });
            }

            const chef = await User.findById({ _id: req.params.id }).select('-password -chef_details');

            if (!chef) {
                res.status(402).json({ message: 'User id is not valid' });
            }

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
                    Key: chef._id + `/${uuidv4()}.${fileType}`,
                    Body: req.file.buffer
                };

                s3.upload(params, async (error, data) => {
                    if (error) {
                        res.status(500).send(error);
                    }

                    chef.profile_image = data.key;
                    chef.name = req.body.name;
                    chef.location = req.body.location;
                    // chef.email = req.body.email;
                    chef.mobile = req.body.mobile;
                    await chef.save();
                    res.status(200).json({ message: 'profile uploaded successfully', public_URL: chef.profile_image });
                });
            });

        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async chefImages(req, res) {
        try {
            if (!req.params.id) {
                res.status(402).json({ message: 'Chef id is required' });
            }

            const chef = await User.findById({ _id: req.params.id }).select('-password');
            const images = [];
            for (let j = 0; j < chef.chef_details.images.length; j++) {
                if (chef.chef_details.images[j].substring(0, 4) !== 'http') {
                    images.push(await getSignedURL(chef.chef_details.images[j]));
                }
            }

            chef.chef_details.images = images;

            if (!chef) {
                res.status(402).json({ message: 'Chef id is not valid' });
            }
            res.status(200).json({ images: chef.chef_details.images });

        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async uploadChefBannerImage(req, res) {
        try {

            if (!req.params.id) {
                res.status(402).json({ message: 'Chef id is required' });
            }

            const chef = await User.findById({ _id: req.params.id }).select('-password');

            if (!chef) {
                res.status(402).json({ message: 'Chef id is not valid' });
            }

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
                    Key: chef._id + `/${uuidv4()}.${fileType}`,
                    Body: req.file.buffer
                };

                s3.upload(params, async (error, data) => {
                    if (error) {
                        res.status(500).send(error);
                    }

                    chef.banner_image = data.key;
                    await chef.save();
                    res.status(200).json({ message: 'banner image uploaded successfully' });
                });
            });
            // res.sendFile('D:/safe/upload/upload-1613562307199.jpg');

        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async deleteChefImages(req, res) {
        try {
            if (!req.params.id) {
                res.status(402).json({ message: 'Chef id is required' });
            }

            const chef = await User.findById({ _id: req.params.id }).select('-password');

            if (!chef) {
                res.status(402).json({ message: 'Chef id is not valid' });
            }

            req.body.images.map(async (image) => {
                if (chef.chef_details.images.includes(image)) {
                    const index = chef.chef_details.images.indexOf(image);
                    if (index > -1) {
                        chef.chef_details.images.splice(index, 1);
                    }
                }
                chef.chef_details.images = chef.chef_details.images;
                await chef.save();
            });
            res.status(200).json({ message: 'image deleted' });

        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async generalProfile(req, res) {
        try {
            if (!req.body) {
                res.status(401).json({
                    message: 'Request body not defined'
                });
            } else if (!req.params.id || !req.body.email || !req.body.name) {
                res.status(401).json({
                    message: 'Required body params not defined'
                });
            }

            const userData = await User.findOne({ _id: req.params.id }).select('-password');
            if (userData) {

                userData.name = req.body.name;
                userData.email = req.body.email;
                userData.mobile = req.body.mobile;


                await userData.save();

                res.status(200).json({
                    message: 'profile updated'
                });

            } else {
                res.status(401).json({
                    message: 'Invalid id'
                });
            }


        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async addFavoritePost(req, res) {
        try {
            if (!req.body) {
                res.status(401).json({
                    message: 'Request body not defined'
                });
            }

            const user = await User.findById({ _id: req.body.user_id }).select('-password');

            if (user) {
                user.favorite_post.push(req.body.post_id);

                await user.save();

                res.status(200).json({
                    message: 'Added Favorite'
                });
            } else {
                res.status(401).json({
                    message: 'User not found'
                });
            }
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async deleteFavoritePost(req, res) {
        try {
            if (!req.body) {
                res.status(401).json({
                    message: 'Request body not defined'
                });
            }

            const user = await User.findById({ _id: req.body.user_id }).select('-password');

            if (user) {

                const index = user.favorite_post.indexOf(req.body.post_id);
                if (index > -1) {
                    user.favorite_post.splice(index, 1);
                }
                await user.save();

                res.status(200).json({
                    message: 'Delete Favorite'
                });
            }
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }
}

async function getSignedURL(key) {
    try {
        const signedUrlExpireSeconds = 60 * 10;

        const url = s3.getSignedUrl('getObject', {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
            Expires: signedUrlExpireSeconds
        });
        return url;

    } catch (e) {
        console.log(e.message);
        return false;
    }
};
module.exports = UserController;
module.exports.getSignedURL = getSignedURL;