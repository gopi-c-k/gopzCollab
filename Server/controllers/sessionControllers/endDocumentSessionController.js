const Document = require('../../models/document');
const CollabSession = require('../../models/collabSession');
const Notification = require('../../models/notification');

const endDocumentSession = async (req, res) => {
  const { documentId } = req.body;

  try {
    const document = await Document.findById(documentId).populate('owner collaborators');
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (!document.activeSession) {
      return res.status(400).json({ message: 'No active session to end.' });
    }

    const session = res.locals.session || await CollabSession.findById(document.activeSession);
    if (!session || !session.isLive) {
      return res.status(400).json({ message: 'Session is already inactive or missing.' });
    }

    session.isLive = false;
    await session.save();
    await CollabSession.deleteOne({ _id: session._id });

    document.activeSession = undefined;
    await document.save();

    const notifications = [];

    const allUserIds = new Set([
      document.owner._id.toString(),
      ...document.collaborators.map((c) => c._id.toString()),
      ...session.participants.map((p) => p.toString()),
    ]);

    allUserIds.forEach((userId) => {
      if (userId !== req.user._id.toString()) {
        notifications.push(
          new Notification({
            user: userId,
            type: 'SESSION_ENDED',
            document: document._id,
            sender: req.user._id,
            message: `The collaboration session for "${document.title}" has been manually ended.`,
          })
        );
      }
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
