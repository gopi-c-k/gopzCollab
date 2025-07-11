const Document = require('../../models/document');
const CollabSession = require('../../models/collabSession');
const Notification = require('../../models/notification');
const User = require('../../models/user')

const createOrJoinDocumentSession = async (req, res) => {
  const { documentId } = req.params;

  try {
    const document = req.locals?.document || await Document.findById(documentId).populate('owner collaborators');
    const user = await User.findOne({email:req.user.email})
    req.locals = req.locals || {};
    req.locals.user = user;

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    let session = null;
    let isNewSession = false;

    // Check if there's an active session
    if (document.activeSession) {
      session = await CollabSession.findById(document.activeSession);
    }

    // Create a new session if not found
    if (!session) {
      session = new CollabSession({
        docId: document._id,
        creator: req.locals.user._id,
        participants: [req.locals.user._id],
      });

      await session.save();

      document.activeSession = session._id;
      await document.save();

      isNewSession = true;

      // Create notifications for owner and collaborators (excluding current user)
      const notifications = [];

      if (document.owner._id.toString() !== req.locals.user._id.toString()) {
        notifications.push(
          new Notification({
            user: document.owner._id,
            type: 'SESSION_STARTED',
            document: document._id,
            sender: req.locals.user._id,
            message: `A new collaboration session has been created for your document "${document.title}" by "${req.locals.user.name}".`,
          })
        );
      }

      document.collaborators.forEach((collaborator) => {
        if (collaborator._id.toString() !== req.locals.user._id.toString()) {
          notifications.push(
            new Notification({
              user: collaborator._id,
              type: 'SESSION_STARTED',
              document: document._id,
              sender: req.locals.user._id,
              message: `A new collaboration session has been created for the document "${document.title}" by "${req.locals.user.name}" you are collaborating on.`,
            })
          );
        }
      });

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    } else {
      // If already part of the session, just rejoin
      if (!session.participants.includes(req.locals.user._id)) {
        session.participants.push(req.locals.user._id);
        await session.save();
      }
    }

    const responsePayload = {
      success: true,
      message: isNewSession ? 'New session created' : 'Joined existing session',
      session_id: session._id,
      name: req.locals.user.name,
      userId: req.locals.user._id,
      isNewSession,
      profilePic: req.locals.user.profilePic
    };

    if (isNewSession) {
      responsePayload.content = document.content;
    }

    return res.status(200).json(responsePayload);
  } catch (err) {
    console.error('Error in createOrJoinDocumentSession:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = createOrJoinDocumentSession;
