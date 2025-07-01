const Document = require('../../models/document');
const CollabSession = require('../../models/collabSession');
const Notification = require('../../models/notification');

const endDocumentSession = async (req, res) => {
  const { sessionId } = req.params;

  try {
    const session = await CollabSession.findById(sessionId);
    if (!session || !session.isLive) {
      return res.status(400).json({ message: 'Session is already inactive or missing.' });
    }
    const document = await Document.findById(session.docId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (!document.activeSession) {
      return res.status(400).json({ message: 'No active session to end.' });
    }
    session.isLive = false;
    await session.save();

    document.activeSession = undefined;
    document.updatedAt = Date.now();
    document.lastSession = session._id;
    await document.save();

    const notifications = [];

    const allUserIds = new Set([
      document.owner._id.toString(),
      ...document.collaborators.map((c) => c._id.toString()),
      ...session.participants.map((p) => p.toString()),
    ]);

    allUserIds.forEach((userId) => {
      notifications.push(
        new Notification({
          user: userId,
          type: 'SESSION_ENDED',
          document: document._id,
          message: `The collaboration session for "${document.title}" has been manually ended.`,
        })
      );
    });

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    return res.status(200).json({
      success: true,
      message: 'Session ended and notifications sent.',
    });
  } catch (err) {
    console.error('Error ending session:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = endDocumentSession;
