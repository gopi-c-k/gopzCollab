const CollabSession = require('../models/collabSession');
const Document = require('../models/document');
const User = require('../models/user');

const verifySession = async (req, res, next) => {
  const { sessionId } = req.params;

  try {
    const session = await CollabSession.findById(sessionId).populate('participants docId');
    const user = await User.findOne({ email: req.user.email })
    req.locals = req.locals || {};
    req.locals.user = user;
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    if (!session.isLive) {
      return res.status(400).json({ message: 'Session is not live' });
    }
    if (!session.participants.some(p => p._id.toString() === req.locals.user._id.toString())) {
      return res.status(403).json({ message: 'You are not a participant in this session' });
    }
    const document = await Document.findById(session.docId).populate('owner collaborators');
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    if (!document.activeSession || document.activeSession.toString() !== session._id.toString()) {
      return res.status(400).json({ message: 'This session is not the active session for the document' });
    }
    if (!document.collaborators.some(c => c._id.toString() === req.locals.user._id.toString()) &&
      document.owner._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You do not have permission to access this session' });
    }
    res.locals.session = session;
    next();
  }
  catch (error) {
    console.error('Error verifying session:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
module.exports = verifySession;