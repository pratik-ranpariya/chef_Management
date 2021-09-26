const mongoose = require("mongoose");
const { PostReports } = require('../models/postReports');
const multer = require("multer");
const PostController = require("./PostController");

class PostReportController {

    static async addPostReport(req, res) {
        try {
            if (!req.body) {
                res.status(401).json({
                    message: 'Request body not defined'
                });
            } else if (!req.body.post_id || !req.body.user_id) {
                res.status(401).json({
                    message: 'Required body params not defined'
                });
            }

            const postReport = new PostReports({
                post_id: req.body.post_id,
                user_id: req.body.user_id,
                title: req.body.title
            });

            await postReport.save();

            res.status(200).json({
                message: 'Report added'
            });

        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async getAllPostReport(req, res) {
        try {
            const posts = await PostReports.find().sort({ createdAt: -1 });
            res.status(200).json(posts);
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async getReportByPostId(req, res) {
        try {
            if (!req.params.post_id) {
                res.status(401).json({
                    message: 'Required comment id'
                });
            }

            const posts = await PostReports.find({ post_id: req.params.post_id });
            res.status(200).json(posts);
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

}
module.exports = PostReportController;