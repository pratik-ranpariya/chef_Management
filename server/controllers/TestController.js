const AWS = require("aws-sdk");
const multer = require("multer");
const moment = require('moment')
const { v4: uuidv4 } = require('uuid');

AWS.config.update({
    signatureVersion: 'v4'
});

const s3 = new AWS.S3();

class TestController {

    static async addToS3(req, res) {
        try {
            if (!req.body) {
                res.status(401).json({
                    message: 'Request body not defined'
                });
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
                    Key: `${uuidv4()}.${fileType}`,
                    Body: req.file.buffer
                };

                s3.upload(params, (error, data) => {
                    if (error) {
                        res.status(500).send(error);
                    }

                    res.status(200).send(data);
                });
            });
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async getSignedURL(req, res) {
        try {
            const signedUrlExpireSeconds = 60 * 10;
            const signedURL = [];
            for (let i = 0; i < req.body.s3_keys.length; i++) {
                const url = s3.getSignedUrl('getObject', {
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: req.body.s3_keys[i],
                    Expires: signedUrlExpireSeconds
                });
                signedURL.push(url);
            }
            res.send(signedURL);
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async getdate(req, res) {
        try {

            var date = new Date();
                  
                var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
                var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                   
                   firstDay = new Date(moment(firstDay).format())
                   lastDay = new Date(moment(lastDay).format('YYYY-MM-DD 23:59:59'))

                   wh['$and'] = [{
                    date: {
                      $gte: firstDay
                    }
                  }, {
                    date: {
                      $lte: lastDay
                    }
                  }]

        } catch (error) {
            res.status(401).send(e.message);
        }
    }
}
module.exports = TestController;