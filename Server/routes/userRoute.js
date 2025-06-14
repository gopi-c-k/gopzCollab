const express = require('express');
const router = express.Router();

const userCreate = require('../controllers/usercontrollers/userCreationController');
const AuthMiddleware = require('../middleware/AuthMiddleware');
const fetchUser = require('../controllers/usercontrollers/fetchUserController');
const getNotification = require('../controllers/notificationControllers/getNotification');


router.get('/notifications', AuthMiddleware,getNotification);


router.post('/create',AuthMiddleware,userCreate);
router.get('/fetch', AuthMiddleware, fetchUser);
module.exports = router;