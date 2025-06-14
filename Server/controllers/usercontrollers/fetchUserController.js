const User = require('../../models/user');
const Document = require('../../models/document');
const Notification = require('../../models/notification');

const fetchUser = async (req, res) => {
    try {
        const { email } = req.user;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const createdRooms = await Document.find({ owner: user._id })
            .select('_id title type')
            .lean();

        createdRooms.forEach(room => {
            room.owner = true;
        });

        const joinedRooms = await Document.find({
            collaborators: user._id,
            owner: { $ne: user._id }
        })
            .select('_id title type')
            .lean();

        joinedRooms.forEach(room => {
            room.owner = false;
        });
        const notificationsCount = await Notification.countDocuments({ user: user._id, isRead: false });

        return res.status(200).json({
            name: user.name,
            profilePic: user.profilePic,
            createdRooms,
            joinedRooms,
            notificationsCount
        });

    } catch (error) {
        console.error("Error fetching user:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

module.exports = fetchUser;
