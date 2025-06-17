const express = require('express');
const router = express.Router();
const AuthMiddleware = require('../middleware/AuthMiddleware');
const SessionMiddleware = require('../middleware/SessionMiddleware');
const verifyDocumentOwnership = require('../middleware/DocumentMiddleware');
const createOrJoinDocumentSession = require('../controllers/sessionControllers/createOrJoinDocumentSession');
const endDocumentSession = require('../controllers/sessionControllers/endDocumentSessionController');
router.post(
    '/create-or-join/:documentId',
    AuthMiddleware,
    verifyDocumentOwnership(['owner', 'collaborator']),
    createOrJoinDocumentSession
);
router.post(
    '/end/:sessionId',
    endDocumentSession
);

module.exports = router;