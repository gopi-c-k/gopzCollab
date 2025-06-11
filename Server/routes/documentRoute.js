const express = require('express');
const router = express.Router();

const createDocument = require('../controllers/documentControllers/createDocumentController');
const AuthMiddleware = require('../middleware/AuthMiddleware');

// Route to create a new document (room)
router.post('/create', AuthMiddleware, createDocument);

module.exports = router;