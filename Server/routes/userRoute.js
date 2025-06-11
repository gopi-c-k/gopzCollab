const express = require('express');
const router = express.Router();

const userCreate = require('../controllers/usercontrollers/userCreationController');
const AuthMiddleware = require('../middleware/AuthMiddleware');

router.post('/create',AuthMiddleware,userCreate);

module.exports = router;