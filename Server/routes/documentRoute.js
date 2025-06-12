const express = require('express');
const router = express.Router();

const createDocument = require('../controllers/documentControllers/createDocumentController');
const deleteDocument = require('../controllers/documentControllers/deleteDocumentController');
const AuthMiddleware = require('../middleware/AuthMiddleware');
const verifyDocumentOwnership = require('../middleware/DocumentMiddleware');

// Route to create a new document (room)
router.post('/create', AuthMiddleware, createDocument);
router.delete('/delete/:documentId', AuthMiddleware, verifyDocumentOwnership(['owner', 'collaborator']), deleteDocument);


module.exports = router;