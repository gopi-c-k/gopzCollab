const express = require('express');
const router = express.Router();
const AuthMiddleware = require('../middleware/AuthMiddleware');
const SessionMiddleware = require('../middleware/SessionMiddleware');
const verifyDocumentOwnership = require('../middleware/DocumentMiddleware');
const createOrJoinDocumentSession = require('../controllers/sessionControllers/createOrJoinDocumentSession');
const endDocumentSession = require('../controllers/sessionControllers/endDocumentSessionController');
const verifySocket = require('../middleware/SocketMiddleware');
router.post(
    '/create-or-join/:documentId',
    AuthMiddleware,
    verifyDocumentOwnership(['owner', 'collaborator']),
    createOrJoinDocumentSession
);
router.post(
    '/end/:sessionId',
    verifySocket,
    endDocumentSession
);
router.get('/ping/:sessionId',SessionMiddleware, (req, res) => {
  res.status(200).json({ message: 'Pinged Successfully' });
});

module.exports = router;