const Notification = require('../../models/notification');
const User = require('../../models/user');

const getNotification = async (req, res) => {
    try {
        const userEmail = req.user.email;
        const user = await User.findOne({ email: userEmail });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const notifications = await Notification.find({ user: user._id })
            .populate('sender', 'name profilePic')
            .populate('document', 'title type')
            .sort({ createdAt: -1 });

        res.status(200).json({
            notifications: notifications.map(notification => ({
                _id: notification._id,
                type: notification.type,
                document: notification.document ? {
                    _id: notification.document._id,
                    title: notification.document.title
                } : null,
                sender: notification.sender ? {
                    _id: notification.sender._id,
                    name: notification.sender.name,
                    profilePic: notification.sender.profilePic
                } : null,
                message: notification.message,
                isRead: notification.isRead,
                createdAt: notification.createdAt
            }))
        });

        // After response is sent, update isRead
        res.on('finish', async () => {
            try {
                await Notification.updateMany(
                    { user: user._id, isRead: false },
                    { $set: { isRead: true } }
                );
            } catch (err) {
                console.error("Error marking notifications as read:", err);
            }
        });

    } catch (error) {
        console.error("Error fetching notifications:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

module.exports = getNotification;
