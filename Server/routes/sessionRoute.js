const express = require('express');
const router = express.Router();
const AuthMiddleware = require('../middleware/AuthMiddleware');
const SessionMiddleware = require('../middleware/SessionMiddleware');
const verifyDocumentOwnership = require('../middleware/DocumentMiddleware');
const createOrJoinDocumentSession = require('../controllers/sessionControllers/createOrJoinDocumentSession');
const endDocumentSession = require('../controllers/sessionControllers/endDocumentSessionController');
const pingDocumentSession = require('../controllers/sessionControllers/pingDocumentSession');
router.post(
    '/create-or-join/:documentId',
    AuthMiddleware,
    verifyDocumentOwnership(['owner', 'collaborator']),
    createOrJoinDocumentSession
);
router.post(
    '/end/:sessionId',
    AuthMiddleware,
    SessionMiddleware,
    endDocumentSession
);
router.post(
    '/ping/:sessionId',
    AuthMiddleware,
    SessionMiddleware,
    pingDocumentSession
);

module.exports = router;