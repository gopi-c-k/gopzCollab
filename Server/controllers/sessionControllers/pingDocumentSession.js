const CollabSession = require('../../models/collabSession');

const pingDocumentSession = async (req, res) => {

  try {
    const session = res.locals.session || await CollabSession.findById(req.params.sessionId);

    if (!session || !session.isLive) {
      return res.status(404).json({ message: 'Session not found or inactive.' });
    }

    session.lastPing = new Date();
    await session.save();

    return res.status(200).json({
      success: true,
      message: 'Ping updated successfully.',
    });
  } catch (err) {
    console.error('Error in pingSession:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = pingDocumentSession;
