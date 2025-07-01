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

    // === Get Created Rooms ===
    const createdRooms = await Document.find({ owner: userId })
      .select('_id title type updatedAt owner collaborators lastSession')
      .populate('owner', 'name profilePic')
      .populate('collaborators', 'name profilePic')
      .lean();

    createdRooms.forEach(room => room.ownerStatus = true);

    // === Get Joined Rooms ===
    const joinedRooms = await Document.find({
      collaborators: userId,
      owner: { $ne: userId }
    })
      .select('_id title type updatedAt owner collaborators lastSession')
      .populate('owner', 'name profilePic')
      .populate('collaborators', 'name profilePic')
      .lean();

    joinedRooms.forEach(room => room.ownerStatus = false);

    // === Recently Active Rooms ===
    const recentlyActiveRooms = await Document.find({
      $or: [
        { owner: userId },
        { collaborators: userId }
      ]
    })
      .sort({ updatedAt: -1 })
      .limit(10)
      .select('_id title type updatedAt owner collaborators activeSession')
      .populate('owner', 'name profilePic')
      .populate('collaborators', 'name profilePic')
      .lean();

    // === Recently Edited By You ===
    const allRooms = [...createdRooms, ...joinedRooms];

    // Sort by updatedAt descending
    allRooms.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    // Filter rooms where user was a participant or creator in last session
    const roomsWithLastSessionIds = allRooms
      .filter(doc => doc.lastSession)
      .map(doc => doc.lastSession);

    const relevantSessions = await CollabSession.find({
      _id: { $in: roomsWithLastSessionIds },
      $or: [
        { participants: userId },
        { creator: userId }
      ]
    }).select('_id').lean();

    const relevantSessionIds = relevantSessions.map(session => session._id.toString());

    const recentlyEditedByYou = allRooms
      .filter(doc => doc.lastSession && relevantSessionIds.includes(doc.lastSession.toString()))
      .slice(0, 10) 
      .map(doc => ({
        _id: doc._id,
        title: doc.title,
        type: doc.type,
        owner: doc.owner,
        collaborators: doc.collaborators,
        updatedAt: doc.updatedAt,
        activeSession: doc.activeSession
      }));

    // === Notifications Count ===
    const notificationsCount = await Notification.countDocuments({
      user: userId,
      isRead: false
    });

    // === Response ===
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
