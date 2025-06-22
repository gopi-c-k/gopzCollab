const express = require('express');
const router = express.Router();

const createDocument = require('../controllers/documentControllers/createDocumentController');
const deleteDocument = require('../controllers/documentControllers/deleteDocumentController');
const AuthMiddleware = require('../middleware/AuthMiddleware');
const getRoomDetails = require('../controllers/documentControllers/getRoomDetailsController');
const verifyDocumentOwnership = require('../middleware/DocumentMiddleware');
const joinDocument = require('../controllers/documentControllers/joinDocumentController');
const requestToJoinRoom = require('../controllers/documentControllers/requestToJoinRoomController');
const updateDocumentContent = require('../controllers/documentControllers/updateDocumentContentController');
const verifySocket = require('../middleware/SocketMiddleware');



router.post('/join/:documentId', AuthMiddleware,verifyDocumentOwnership(['owner']), joinDocument);
router.post('/request', AuthMiddleware, requestToJoinRoom);
router.post('/create', AuthMiddleware, createDocument);
router.get('/details/:documentId', AuthMiddleware, verifyDocumentOwnership(['owner','collaborator']),getRoomDetails); 
router.delete('/delete/:documentId', AuthMiddleware, verifyDocumentOwnership(['owner', 'collaborator']), deleteDocument);
router.patch('/content/update',verifySocket,updateDocumentContent);


module.exports = router;