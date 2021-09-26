const { Cart } = require("../models/cart");
const { Order } = require("../models/order");
const { User } = require("../models/users");

var Publishable_Key = '';
var Secret_Key = '';
const stripe = require('stripe')(Secret_Key);
const { v4: uuidv4 } = require('uuid');
const { MasterClass } = require("../models/masterClass");

//=========*========
const request = require('request');
//=========*========

class CartController {

    static async addCart(req, res) {
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

            const orderDetails = await Order.findOne({ user_id: req.body.user_id, order_type: req.body.order_type, order_status: 0 });

            if (req.body.order_type === 'eclass') {
                await MasterClass.findByIdAndUpdate({ _id: req.body.item_id }, { $inc: { 'request_count': 1 } }, { useFindAndModify: false });
            }

            if (!orderDetails) {
                const order = new Order({
                    user_id: req.body.user_id,
                    order_type: req.body.order_type,
                    items: [{
                        item_id: req.body.item_id,
                        chef_id: req.body.chef_id,
                        title: req.body.title,
                        qty: req.body.qty,
                        price: req.body.price,
                        amount: req.body.qty * req.body.price
                    }],
                });
                order.save();
            } else {
                if (orderDetails.order_type === req.body.order_type) {
                    if (orderDetails.items.length > 0) {
                        let update = false;
                        for (let i = 0; i < orderDetails.items.length; i++) {

                            // Add one chef items at a time in cart
                            if (orderDetails.chef_id === req.body.chef_id) {
                                if (orderDetails.items[i].item_id === req.body.item_id) {
                                    orderDetails.items[i].qty += req.body.qty;
                                    update = true;
                                    break;
                                }
                                if (!update) {
                                    orderDetails.items.push({
                                        item_id: req.body.item_id,
                                        chef_id: req.body.chef_id,
                                        title: req.body.title,
                                        qty: req.body.qty,
                                        price: req.body.price,
                                        amount: req.body.qty * req.body.price
                                    });
                                }
                            } else {
                                res.status(401).json({ message: 'Please add one chef items at a time' });
                            }
                        }
                    } else {
                        orderDetails.items.push({
                            item_id: req.body.item_id,
                            chef_id: req.body.chef_id,
                            title: req.body.title,
                            qty: req.body.qty,
                            price: req.body.price,
                            amount: req.body.qty * req.body.price
                        });
                    }
                    await orderDetails.save();
                } else {
                    const createOrder = new Order({
                        user_id: req.body.user_id,
                        order_type: req.body.order_type,
                        items: [{
                            item_id: req.body.item_id,
                            chef_id: req.body.chef_id,
                            title: req.body.title,
                            qty: req.body.qty,
                            price: req.body.price,
                            amount: req.body.qty * req.body.price
                        }],
                    });
                    await createOrder.save();
                }
            }

            res.status(200).json({
                message: 'Cart added'
            });

        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async updateCartItemByUserID(req, res) {
        try {
            if (!req.body) {
                res.status(401).json({
                    message: 'Request body not defined'
                });
            } else if (!req.body.user_id) {
                res.status(401).json({
                    message: 'Required body params not defined'
                });
            }
            const orderDetails = await Order.findOne({ user_id: req.body.user_id, order_type: req.body.order_type, order_status: 0 });
            if (!orderDetails) {
                res.status(200).json([]);
            }
            const itemData = [];
            req.body.items.map((item) => {
                itemData.push({
                    item_id: item.item_id,
                    chef_id: item.chef_id,
                    title: item.title,
                    qty: item.qty,
                    price: item.price,
                    amount: item.qty * item.price
                });
            });
            orderDetails.items = itemData;
            await orderDetails.save();
            res.status(200).json([]);
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async getAllCartByUserIDItem(req, res) {
        try {
            const orderDetails = await Order.findOne({ user_id: req.params.user_id, order_status: 0, order_type: req.params.type });
            if (!orderDetails) {
                res.status(200).json([]);
            }

            const cartData = {
                "payment": orderDetails.payment,
                "user_id": orderDetails.user_id,
                "order_type": orderDetails.order_type,
                "order_status": orderDetails.order_status,
                "delivery_day": orderDetails.delivery_day,
                "delivery_time": orderDetails.delivery_time,
                "address": orderDetails.address,
                "extra_notes": orderDetails.extra_notes,
                "payment_status": orderDetails.payment_status,
                "rate": orderDetails.rate,
                "_id": orderDetails._id,
                "createdAt": orderDetails.createdAt,
                "updatedAt": orderDetails.updatedAt
            };
            const result = [];
            orderDetails.items.map((item) => {
                const valueObj = cartData;
                valueObj.item_id = item.item_id;
                valueObj.chef_id = item.chef_id;
                valueObj.title = item.title;
                valueObj.qty = item.qty;
                valueObj.price = item.price;
                valueObj.amount = item.amount;

                result.push(valueObj);
            });

            res.status(200).json(result);
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async getAllCartByUserID(req, res) {
        try {
            const orderDetails = await Order.find({ user_id: req.params.user_id, order_status: 0 });
            if (!orderDetails) {
                res.status(200).json([]);
            }
            res.status(200).json(orderDetails);
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async deleteCartByUserID(req, res) {
        try {
            await Order.findByIdAndDelete({ _id: req.params.order_id });
            res.status(200).json([]);
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async addOrder(req, res) {
        try {

            if (!req.body) {
                res.status(401).json({
                    message: 'Request body not defined'
                });
            } else if (!req.body.user_id) {
                res.status(401).json({
                    message: 'Required body params not defined'
                });
            }
            const orderDetails = await Order.findOne({ user_id: req.body.user_id, order_type: req.body.order_type, order_status: 0 });
            if (!orderDetails) {
                res.status(200).json([]);
            }
            let totalAmount = 0;
            orderDetails.items.map((item) => {
                totalAmount += item.amount;
            });
            orderDetails.total_amount = totalAmount;
            orderDetails.delivery_day = req.body.delivery_day;
            orderDetails.delivery_time = req.body.delivery_time;
            orderDetails.address = req.body.address;
            orderDetails.extra_notes = req.body.extra_notes;
            orderDetails.payment = req.body.payment;
            orderDetails.order_status = 1;

            await orderDetails.save();

            res.status(200).json(orderDetails);

            // res.render('Home', {
            //     data: {
            //         key: Publishable_Key,
            //         amount: orderDetails.total_amount * 100,
            //         order_id: orderDetails._id,
            //         user_id: orderDetails.user_id
            //     }
            // });

            // res.status(200).json({ message: 'cart items updated' });
        } catch (e) {
            console.log(e.message);
            res.status(403).send(e.message);
        }
    }

    static async updateOrder(req, res) {
        try {

            if (!req.body) {
                res.status(401).json({
                    message: 'Request body not defined'
                });
            } else if (!req.body._id) {
                res.status(401).json({
                    message: 'Required body params not defined'
                });
            }
            const orderDetails = await Order.findOne({ _id: req.body._id, order_status: 1 });
            if (!orderDetails) {
                res.status(200).json([]);
            }
            let totalAmount = 0;
            orderDetails.items.map((item) => {
                totalAmount += item.amount;
            });

            orderDetails.user_id = req.body.user_id;
            orderDetails.order_type = req.body.order_type;
            orderDetails.items = req.body.items;
            orderDetails.total_amount = totalAmount;
            orderDetails.delivery_day = req.body.delivery_day;
            orderDetails.delivery_time = req.body.delivery_time;
            orderDetails.address = req.body.address;
            orderDetails.extra_notes = req.body.extra_notes;
            orderDetails.payment = req.body.payment;
            orderDetails.order_status = 1;

            await orderDetails.save();

            res.status(200).json({ message: 'order updated', orderDetails });
        } catch (e) {
            console.log(e.message);
            res.status(403).send(e.message);
        }
    }


    static async getOrderByUserID(req, res) {
        try {
            const orderDetails = await Order.find({ user_id: req.params.user_id, order_status: 1, order_type: req.params.type });
            if (!orderDetails) {
                res.status(200).json([]);
            }
            res.status(200).json(orderDetails);
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async getAllTypeOrderByUserID(req, res) {
        try {
            const orderDetails = await Order.find({ user_id: req.params.user_id, order_status: 1 });
            if (!orderDetails) {
                res.status(200).json([]);
            }
            res.status(200).json(orderDetails);
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async getOrderByChefID(req, res) {
        try {
            // const orderDetails = await Order.find({ 'items.chef_id': req.params.chef_id }, { _id: 0, items: { $elemMatch: { chef_id: req.params.chef_id } } }).select(['_id', 'user_id', 'order_type', 'extra_notes', 'address', 'delivery_day', 'delivery_time', 'total_amount']);
            const orderDetails = await Order.find({ 'items.chef_id': req.params.chef_id, order_status: 1, order_type: req.params.type }).sort({ createdAt: -1 });
            if (!orderDetails) {
                res.status(200).json([]);
            }
            const result = [];
            orderDetails.map((order) => {
                const itemList = [];
                order.items.map((item) => {
                    if (req.params.chef_id === item.chef_id) {
                        itemList.push(item);
                    }
                });
                result.push({
                    items: itemList,
                    order_type: order.order_type,
                    order_status: order.order_status,
                    user_id: order.user_id,
                    chef_id: order.chef_id,
                    _id: order._id,
                    payment_status: order.payment_status,
                    createdAt: order.createdAt,
                    updatedAt: order.updatedAt
                });

            });

            res.status(200).json(result);
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async testPayment(req, res) {
        try {
            res.render('Home', {
                data: {
                    key: Publishable_Key,
                    amount: 50 * 100,
                    order_id: req.params.order_id,
                    user_id: req.params.user_id
                }
            });
        } catch (e) {
            console.log(e.message);
            res.status(401).send(e.message);
        }
    }

    static async payment(req, res) {
        try {
            // Moreover you can take more details from user 
            // like Address, Name, etc from form 
            const userData = await User.findById({ _id: req.body.user_id }).select('-password');
            stripe.customers.create({
                email: req.body.stripeEmail,
                source: req.body.stripeToken,
                name: userData.name
                // address: {
                //     line1: 'TC 9/4 Old MES colony',
                //     postal_code: '452331',
                //     city: 'Indore',
                //     state: 'Madhya Pradesh',
                //     country: 'India',
                // }
            }).then((customer) => {
                return stripe.charges.create({
                    amount: req.body.amount,
                    description: 'Pin Chef Products',
                    currency: 'USD',
                    customer: customer.id
                });
            }).then(async (charge) => {
                const orderDetail = await Order.findById({ _id: req.body.order_id });
                orderDetail.payment.details = charge;
                orderDetail.order_status = 2;
                orderDetail.payment_status = true;


                if (orderDetail.order_type === 'eclass') {
                    for (let i = 0; i < orderDetail.items.length; i++) {
                        await MasterClass.findByIdAndUpdate({ _id: orderDetail.items[i].item_id }, { $inc: { 'available_ticket': -1, 'request_count': -1 } }, { useFindAndModify: false });
                    }
                    orderDetail.e_class_ticket = uuidv4();

                }
                await orderDetail.save();
                res.status(200).send("Success");  // If no error occurs 


            }).catch((err) => {
                res.status(401).send(err.message);       // If some error occurs 
            });
        } catch (e) {
            res.status(401).send(e.message);
        }
    }

    // static async createPaypalPayment(req, res) {
    //     try {

            
    //         var CLIENT = process.env.PAYPAL_CLIENT_ID;
    //         var SECRET = process.env.PAYPAL_CLIENT_SECRET;
    //         var PAYPAL_API = 'https://api-m.sandbox.paypal.com';

    //         // 2. Call /v1/payments/payment to set up the payment
    //         request.post(PAYPAL_API + '/v1/payments/payment',
    //             {
    //                 auth:
    //                 {
    //                     user: CLIENT,
    //                     pass: SECRET
    //                 },
    //                 body:
    //                 {
    //                     intent: 'sale',
    //                     payer:
    //                     {
    //                         payment_method: 'paypal'
    //                     },
    //                     transactions: [
    //                         {
    //                             amount:
    //                             {
    //                                 total: 5.99,
    //                                 currency: 'USD'
    //                             }
    //                         }],
    //                     redirect_urls:
    //                     {
    //                         return_url: 'http://mantradiamond.com',
    //                         cancel_url: 'http://jj.com'
    //                     }
    //                 },
    //                 json: true
    //             }, function (err, response) {
    //             if (err) {
    //                 console.error(err);
    //                 return res.sendStatus(500);
    //             }
    //              console.log(response)
    //             // 3. Return the payment ID to the client
    //             res.json(
    //                 {
    //                     id: response.body.id,
    //                     here: 'dsd'

    //                 });
    //         });
    //     } catch (e) {
    //         res.status(401).send(e.message);
    //     }
    // }

}
module.exports = CartController;