const { Subscriptions } = require("../models/subscription");
const { User } = require("../models/users");

class SubscriptionController {

    static async addSubscription(req, res) {
        try {
            if (!req.body) {
                res.status(401).json({
                    message: 'Request body not defined'
                });
            }

            const subscription = new Subscriptions({
                name: req.body.name,
                description: req.body.description,
                monthly_pack: req.body.monthly_pack,
                yearly_pack: req.body.yearly_pack,
            });

            await subscription.save();

            res.status(200).json({
                message: 'Subscription added'
            });

        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async addChefSubscription(req, res) {
        try {
            if (!req.body) {
                res.status(401).json({
                    message: 'Request body not defined'
                });
            }

            const chefData = await User.findById({ _id: req.body.chef_id }).select('-password');

            if (!chefData) {
                res.status(403).json({
                    message: 'Chef is not available'
                });
            } else {
                const startDate = new Date(req.body.start_date);
                startDate.setDate(startDate.getDate() + 1);

                const endDate = new Date(req.body.end_date);
                endDate.setDate(endDate.getDate() + 1);

                const updateData = {
                    subscription_type: req.body.subscription_type,
                    start_date: startDate,
                    end_date: endDate
                };
                chefData.chef_details.subscription = updateData;
                await chefData.save();
                console.log(chefData.chef_details.subscription);
            }

            res.status(200).json({
                message: 'Subscription added'
            });

        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async getAllSubscription(req, res) {
        try {
            const posts = await Subscriptions.find();
            res.status(200).json(posts);
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async getAllSubscriptionByID(req, res) {
        try {
            const posts = await Subscriptions.findById({ _id: req.params.sub_id });
            res.status(200).json(posts);
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async updateSubscriptionByID(req, res) {
        try {
            if (!req.body.sub_id) {
                res.status(401).json({
                    message: 'Subscription ID not defined'
                });
            }
            const posts = await Subscriptions.findById({ _id: req.body.sub_id });
            if (posts) {
                posts.name = req.body.name;
                posts.description = req.body.description;
                posts.monthly_pack = req.body.monthly_pack;
                posts.yearly_pack = req.body.yearly_pack;

                posts.save();
                res.status(200).json({ message: "updated" });
            } else {
                res.status(200).json({ message: "sub_id not found in system" });
            }
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async deleteSubscriptionsByUserID(req, res) {
        try {
            await Subscriptions.findByIdAndDelete({ _id: req.params.sub_id });
            res.status(200).json({ message: 'removed from subscription' });
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

}
module.exports = SubscriptionController;