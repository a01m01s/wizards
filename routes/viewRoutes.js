const express = require('express');
const viewController = require('../controllers/viewsController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.isLoggedIn);

router.get('/', viewController.getMain);
router.get('/posts', viewController.getOverview);
// router.get('/posts/:slug', authController.protect, viewController.getPost);
router.get('/posts/:slug', viewController.getPost);
router.get('/login', viewController.getLoginForm);

module.exports = router;
