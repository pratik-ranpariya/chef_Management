const express = require('express');
const { testPayment } = require('../controllers/CartController');
const CartController = require('../controllers/CartController');
const ChefCommentController = require('../controllers/ChefCommentController');
const FoodController = require('../controllers/FoodController');
const MasterClassController = require('../controllers/MasterClassController');
const PostCommentController = require('../controllers/PostCommentController');
const PostController = require('../controllers/PostController');
const PostFollowController = require('../controllers/PostFollowController');
const PostReportController = require('../controllers/PostReportController');
const RateController = require('../controllers/RateController');
const RateReviewController = require('../controllers/RateReviewController');
const RecipesCommentController = require('../controllers/RecipesCommentController');
const RecipesController = require('../controllers/RecipesController');
const ServiceController = require('../controllers/ServiceController');
const SubscriptionController = require('../controllers/SubscriptionController');
const TestController = require('../controllers/TestController');
const UserController = require('../controllers/UserController');
const RepostController = require('../controllers/RepostController');
const router = express.Router();
const checkAuth = require('../middlewares/auth');

router.route('/').get((req, res) => {
    res.send('test api');
});

/**************Test Process****************/
router.route('/test/upload-s3').post(TestController.addToS3);
router.route('/test/signed-url').post(TestController.getSignedURL);
router.route('/test/getdate').get(TestController.getdate)

/**************User Process****************/
router.route('/auth/user').post(UserController.userTempRegistration);
router.route('/auth/facebook-user').post(UserController.userFacebookRegistration);
router.route('/auth/verify-user').post(UserController.userRegistration);
router.route('/auth/login').post(UserController.userLogin);

router.route('/account/password').patch(UserController.changePassword);
router.route('/account/forgot-password').patch(UserController.userForgetPassword);
router.route('/account/verify-otp').post(UserController.verifyOTP);
router.route('/account/user/:id').delete(checkAuth, UserController.userDelete);

//Chef APIs
router.route('/chef/getAll/:user_id?').get(checkAuth, UserController.getAllChef);
router.route('/chef/getChefById/:id').get(checkAuth, UserController.getChefByID);
router.route('/chef').put(checkAuth, UserController.updateChef);
router.route('/chef/images/:id').post(checkAuth, UserController.uploadChefImages);
router.route('/chef/images/:id').get(checkAuth, UserController.chefImages);
router.route('/chef/images/:id').delete(checkAuth, UserController.deleteChefImages);
router.route('/chef/banner-images/:id').post(checkAuth, UserController.uploadChefBannerImage);

//General APIs
router.route('/profile/:id').post(checkAuth, UserController.uploadChefProfileImage);
// router.route('/profile/:id').post(checkAuth, UserController.generalProfile);
router.route('/users/getAll').get(checkAuth, UserController.getAllUsers);
router.route('/user-favorite').post(checkAuth, UserController.addFavoritePost);
router.route('/resend-otp').patch(UserController.reSendOTP);
router.route('/user-favorite').delete(checkAuth, UserController.deleteFavoritePost);

//Post APIs
router.route('/post').post(checkAuth, PostController.addPost);
//API use for add/update images
router.route('/post-images/:post_id').post(checkAuth, PostController.uploadPostImages);
router.route('/post').put(checkAuth, PostController.updatePost);
router.route('/post/:post_id').delete(checkAuth, PostController.deletePost);
router.route('/post/:user_id?').get(checkAuth, PostController.getAllPost);
router.route('/post-filter').get(checkAuth, PostController.getAllFilterPost);
router.route('/post/id/:post_id').get(checkAuth, PostController.getPostByID);
router.route('/post/chef/:chef_id').get(checkAuth, PostController.getPostByChefID);
router.route('/post-images/:post_id').delete(checkAuth, PostController.deletePostImages);
router.route('/post/share').post(checkAuth, PostController.sharePost);
router.route('/post/share/:user_id').get(checkAuth, PostController.userSharedPost);
router.route('/like').post(checkAuth, PostController.likePost);
router.route('/post/like/:user_id').get(checkAuth, PostController.userLikedPost);
router.route('/unlike').post(checkAuth, PostController.unLikePost);
router.route('/rate').post(checkAuth, RateController.addRate);
router.route('/post/search/:city').get(checkAuth, PostController.searchPost);

//Post Comment
router.route('/post-comment').post(checkAuth, PostCommentController.addPostComment);
router.route('/post-comment').get(checkAuth, PostCommentController.getAllPostComment);
router.route('/post-comment/:comment_id').get(checkAuth, PostCommentController.getCommentByID);
router.route('/post-comment/post/:post_id/:user_id?').get(checkAuth, PostCommentController.getCommentByPostID);
router.route('/post-comment/:comment_id').delete(checkAuth, PostCommentController.deletePostComment);
router.route('/post-comment/like').post(checkAuth, PostCommentController.likePostComment);
router.route('/post-comment/unlike').post(checkAuth, PostCommentController.unLikePostComment);
router.route('/post-comment/reply').post(checkAuth, PostCommentController.addPostCommentReply);

//Post Report
router.route('/post-report').post(checkAuth, PostReportController.addPostReport);
router.route('/post-report').get(checkAuth, PostReportController.getAllPostReport);
router.route('/post-report/:post_id').get(checkAuth, PostReportController.getReportByPostId);

//Post Follow
router.route('/post-follow').post(checkAuth, PostFollowController.addPostFollow);
router.route('/post-follow').get(checkAuth, PostFollowController.getAllPostFollow);
router.route('/post-follow').delete(checkAuth, PostFollowController.deletePostFollow);
router.route('/post-follow/:post_id').get(checkAuth, PostFollowController.getFollowByPostId);
router.route('/post-follow/user/:user_id').get(checkAuth, PostFollowController.getFollowByUserId);
router.route('/post-follow/chef/:chef_id').get(checkAuth, PostFollowController.getFollowByChefId);

//Food APIs
router.route('/food').post(checkAuth, FoodController.addFood);
router.route('/food').put(checkAuth, FoodController.updateFood);
router.route('/food/:food_id').delete(checkAuth, FoodController.deleteFood);
router.route('/food-images/:food_id').post(checkAuth, FoodController.uploadFoodImages);
router.route('/food-images/:food_id').delete(checkAuth, FoodController.deleteFoodImages);
router.route('/food/:user_id?').get(checkAuth, FoodController.getAllFood);
router.route('/food/id/:food_id').get(checkAuth, FoodController.getFoodByID);
router.route('/food/chef/:chef_id').get(checkAuth, FoodController.getFoodByChefID);
router.route('/food/like').post(checkAuth, FoodController.likeFood);
router.route('/food/like/:user_id').get(checkAuth, FoodController.userLikedFood);
router.route('/food/unlike').post(checkAuth, FoodController.unLikeFood);
router.route('/food/share').post(checkAuth, FoodController.shareFood);
router.route('/food/share/:user_id').get(checkAuth, FoodController.userSharedFood);
router.route('/food/search/:city').get(checkAuth, FoodController.searchFood);

//Service APIs
router.route('/service').post(checkAuth, ServiceController.addService);
router.route('/service').put(checkAuth, ServiceController.updateService);
router.route('/service/:service_id').delete(checkAuth, ServiceController.deleteService);
router.route('/service-images/:service_id').post(checkAuth, ServiceController.uploadServiceImages);
router.route('/service-images/:service_id').delete(checkAuth, ServiceController.deleteServiceImages);
router.route('/service/:user_id?').get(checkAuth, ServiceController.getAllService);
router.route('/service/id/:service_id').get(checkAuth, ServiceController.getServiceByID);
router.route('/service/chef/:chef_id').get(checkAuth, ServiceController.getServiceByChefID);
router.route('/service/like').post(checkAuth, ServiceController.like);
router.route('/service/like/:user_id').get(checkAuth, ServiceController.userLikedService);
router.route('/service/unlike').post(checkAuth, ServiceController.unLike);
router.route('/service/share').post(checkAuth, ServiceController.shareService);
router.route('/service/share/:user_id').get(checkAuth, ServiceController.userSharedService);
router.route('/service/search/:city').get(checkAuth, ServiceController.searchService);

router.route('/recipe').post(checkAuth, RecipesController.addRecipes);
//API use for add/update images
router.route('/recipe-images/:recipe_id').post(checkAuth, RecipesController.uploadRecipesImages);
router.route('/recipe').put(checkAuth, RecipesController.updateRecipes);
router.route('/recipe-filter').get(checkAuth, RecipesController.getAllFilterRecipe);
router.route('/recipe/:recipe_id').delete(checkAuth, RecipesController.deleteRecipes);
router.route('/recipe/:user_id?').get(checkAuth, RecipesController.getAllRecipes);
router.route('/recipe/id/:recipe_id').get(checkAuth, RecipesController.getRecipesByID);
router.route('/recipe/chef/:chef_id').get(checkAuth, RecipesController.getRecipesByChefID);
router.route('/recipe-images/:recipe_id').delete(checkAuth, RecipesController.deleteRecipesImages);
router.route('/recipe-like').post(checkAuth, RecipesController.likeRecipes);
router.route('/recipe/like/:user_id').get(checkAuth, RecipesController.userLikedRecipe);
router.route('/recipe-unlike').post(checkAuth, RecipesController.unLikeRecipes);
router.route('/recipe/share').post(checkAuth, RecipesController.shareRecipe);
router.route('/recipe/share/:user_id').get(checkAuth, RecipesController.userSharedRecipe);
router.route('/recipe/search/:city').get(checkAuth, RecipesController.searchRecipe);

//Recipe Comment
router.route('/recipe-comment').post(checkAuth, RecipesCommentController.addComment);
router.route('/recipe-comment').get(checkAuth, RecipesCommentController.getAllComment);
router.route('/recipe-comment/:comment_id').get(checkAuth, RecipesCommentController.getCommentByID);
router.route('/recipe-comment/recipe/:recipe_id/:user_id?').get(checkAuth, RecipesCommentController.getCommentByRecipeID);
router.route('/recipe-comment/:comment_id').delete(checkAuth, RecipesCommentController.deleteComment);
router.route('/recipe-comment/like').post(checkAuth, RecipesCommentController.likeComment);
router.route('/recipe-comment/unlike').post(checkAuth, RecipesCommentController.unLikeComment);
router.route('/recipe-comment/reply').post(checkAuth, RecipesCommentController.addCommentReply);

//MasterCard APIs
router.route('/e-class').post(checkAuth, MasterClassController.addMasterClass);
//API use for add/update images
router.route('/e-class-images/:masterClass_id').post(checkAuth, MasterClassController.uploadMasterClassImages);
router.route('/e-class').put(checkAuth, MasterClassController.updateMasterClass);
router.route('/e-class/:masterClass_id').delete(checkAuth, MasterClassController.deleteMasterClass);
router.route('/e-class').get(checkAuth, MasterClassController.getAllMasterClass);
router.route('/e-class-filter').get(checkAuth, MasterClassController.getAllFilterMasterClass);
router.route('/e-class/:masterClass_id').get(checkAuth, MasterClassController.getMasterClassByID);
router.route('/e-class/chef/:chef_id').get(checkAuth, MasterClassController.getMasterClassByChefID);
router.route('/e-class-images/:masterClass_id').delete(checkAuth, MasterClassController.deleteMasterClassImages);
router.route('/e-class/search/:city').get(checkAuth, MasterClassController.searchMClass);

//Rate Review
router.route('/rate-review').post(checkAuth, RateReviewController.addRateReview);
router.route('/rate-review/:chef_id').get(checkAuth, RateReviewController.getRateReviewByChefID);

//Chef Comments
router.route('/chef-comment').post(checkAuth, ChefCommentController.addChefComment);
router.route('/chef-comment').get(checkAuth, ChefCommentController.getAllChefComment);
router.route('/chef-comment/:comment_id').get(checkAuth, ChefCommentController.getCommentByID);
router.route('/chef-comment/chef/:chef_id').get(checkAuth, ChefCommentController.getCommentByChefID);
router.route('/chef-comment/:comment_id').delete(checkAuth, ChefCommentController.deleteChefComment);
router.route('/chef-comment/like').post(checkAuth, ChefCommentController.likeChefComment);
router.route('/chef-comment/unlike').post(checkAuth, ChefCommentController.unLikeChefComment);
router.route('/chef-comment/reply').post(checkAuth, ChefCommentController.addChefCommentReply);

router.route('/cart').post(checkAuth, CartController.addCart);
router.route('/cart').put(checkAuth, CartController.updateCartItemByUserID);
router.route('/cart/:type/:user_id').get(checkAuth, CartController.getAllCartByUserIDItem);
router.route('/cart/:user_id').get(checkAuth, CartController.getAllCartByUserID);
router.route('/cart/:order_id').delete(checkAuth, CartController.deleteCartByUserID);
router.route('/order').post(checkAuth, CartController.addOrder);
router.route('/order').put(checkAuth, CartController.updateOrder);
router.route('/order/:type/:user_id').get(checkAuth, CartController.getOrderByUserID);
router.route('/order/:user_id').get(checkAuth, CartController.getAllTypeOrderByUserID);
router.route('/order/chef/:type/:chef_id').get(checkAuth, CartController.getOrderByChefID);
router.route('/test-payment/:user_id/:order_id').get(CartController.testPayment);
router.route('/payment').post(CartController.payment);
// router.route('/createPaypalPayment').post(CartController.createPaypalPayment)

//Subscription
router.route('/sub').post(checkAuth, SubscriptionController.addSubscription);
router.route('/sub/chef').post(checkAuth, SubscriptionController.addChefSubscription);
router.route('/sub').get(checkAuth, SubscriptionController.getAllSubscription);
router.route('/sub/:sub_id').get(checkAuth, SubscriptionController.getAllSubscriptionByID);
router.route('/sub').put(checkAuth, SubscriptionController.updateSubscriptionByID);
router.route('/sub/:sub_id').delete(checkAuth, SubscriptionController.deleteSubscriptionsByUserID);

//repost posts, recipes, foods, services
router.route('/repost').post(checkAuth, RepostController.repost);

module.exports = router;

