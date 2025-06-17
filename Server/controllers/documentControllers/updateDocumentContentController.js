const Document = require('../../models/document');
const User = require('../../models/user');
const CollabSession = require('../../models/collabSession');

const updateDocumentContent = async (req, res) => {
  const { content, sessionId } = req.body;

  if (!content || !sessionId) {
    return res.status(400).json({ message: 'Missing content or sessionId' });
  }

  try {
    const session = await CollabSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (!session.isLive) {
      return res.status(400).json({ message: 'Session is not valid' });
    }

    const document = await Document.findById(session.docId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (document.activeSession.toString() !== session._id.toString()) {
      return res.status(403).json({ message: 'Not a valid document session' });
    }

    document.content = content;
    await document.save();

    return res.status(200).json({ message: "File content updated successfully" });
  } catch (error) {
    console.error('Error updating document content:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = updateDocumentContent;
