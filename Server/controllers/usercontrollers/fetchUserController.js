const User = require('../../models/user');
const Document = require('../../models/document');
const Notification = require('../../models/notification');
const CollabSession = require('../../models/collabSession');

const fetchUser = async (req, res) => {
  try {
    const { email } = req.user;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userId = user._id;

    const createdRooms = await Document.find({ owner: userId })
      .select('_id title type updatedAt')
      .lean();

    createdRooms.forEach(room => {
      room.owner = true;
    });

    const joinedRooms = await Document.find({
      collaborators: userId,
      owner: { $ne: userId }
    })
      .select('_id title type updatedAt')
      .lean();

    joinedRooms.forEach(room => {
      room.owner = false;
    });


    const recentlyActiveRooms = await Document.find({
      $or: [
        { owner: userId },
        { collaborators: userId }
      ]
    })
      .sort({ updatedAt: -1 })
      .limit(10)
      .select('_id title type updatedAt')
      .lean();


    const docsWithLastSession = await Document.find({
      lastSession: { $exists: true },
      $or: [
        { owner: userId },
        { collaborators: userId }
      ]
    })
      .select('_id title type lastSession')
      .lean();

    const sessionIds = docsWithLastSession.map(doc => doc.lastSession);

    const sessions = await CollabSession.find({
      _id: { $in: sessionIds },
      participants: userId
    }).select('_id').lean();

    const userEditedSessionIds = sessions.map(s => s._id.toString());

    const recentlyEditedByYou = docsWithLastSession.filter(doc =>
      userEditedSessionIds.includes(doc.lastSession.toString())
    ).map(doc => ({
      _id: doc._id,
      title: doc.title,
      type: doc.type
    }));

    const notificationsCount = await Notification.countDocuments({
      user: userId,
      isRead: false
    });


    return res.status(200).json({
      name: user.name,
      profilePic: user.profilePic,
      createdRooms,
      joinedRooms,
      recentlyActiveRooms,
      recentlyEditedByYou,
      notificationsCount
    });

  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = fetchUser;
