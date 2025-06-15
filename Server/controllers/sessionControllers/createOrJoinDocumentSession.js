const Document = require('../../models/document');
const CollabSession = require('../../models/collabSession');
const Notification = require('../../models/notification');

const COLLAPSE_TIMEOUT = 1 * 60 * 1000;

const createOrJoinDocumentSession = async (req, res) => {
  const { documentId } = req.body;

  try {
    const document =
      req.locals?.document ||
      (await Document.findById(documentId).populate('owner collaborators'));

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    let session = null;

    if (document.activeSession) {
      session = await CollabSession.findById(document.activeSession);
    }

    const now = Date.now();

    if (
      session &&
      session.isLive &&
      now - new Date(session.lastPing).getTime() > COLLAPSE_TIMEOUT
    ) {
      session.isLive = false;

      const notifications = [];

      const allToNotify = new Set([
        document.owner._id.toString(),
        ...document.collaborators.map((c) => c._id.toString()),
      ]);

      allToNotify.forEach((userId) => {
        if (userId !== req.user._id.toString()) {
          notifications.push(
            new Notification({
              user: userId,
              type: 'SESSION_ENDED',
              document: document._id,
              sender: req.user._id,
              message: `The collaboration session for the document "${document.title}" has ended due to inactivity.`,
            })
          );
        }
      });

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }

      await CollabSession.deleteOne({ _id: session._id });
      document.activeSession = undefined;
      await document.save();

      session = null;
    }

    if (!session) {
      session = new CollabSession({
        docId: document._id,
        creator: req.user._id,
        participants: [req.user._id],
      });

      await session.save();

      document.activeSession = session._id;
      await document.save();

      const notifications = [];

      if (document.owner._id.toString() !== req.user._id.toString()) {
        notifications.push(
          new Notification({
            user: document.owner._id,
            type: 'SESSION_STARTED',
            document: document._id,
            sender: req.user._id,
            message: `A new collaboration session has been created for your document "${document.title}" by "${req.user.name}".`,
          })
        );
      }

      document.collaborators.forEach((collaborator) => {
        if (collaborator._id.toString() !== req.user._id.toString()) {
          notifications.push(
            new Notification({
              user: collaborator._id,
              type: 'SESSION_STARTED',
              document: document._id,
              sender: req.user._id,
              message: `A new collaboration session has been created for the document "${document.title}" by "${req.user.name}" you are collaborating on.`,
            })
          );
        }
      });

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    } else {
      if (!session.participants.includes(req.user._id)) {
        session.participants.push(req.user._id);
      }

      session.lastPing = new Date();
      await session.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Session is active',
      session,
    });
  } catch (err) {
    console.error('Error in createOrJoinDocumentSession:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = createOrJoinDocumentSession;
