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
        const updateNotifications = notifications.map(notification => {
            if (!notification.isRead) {
                notification.isRead = true;
                notification.save();
            }
            return notification;
        }
        );
        await Promise.all(updateNotifications);
        return res.status(200).json({
            notifications: notifications.map(notification => ({
                _id: notification._id,
                type: notification.type,
                document: notification.document ? {
                    title: notification.document.title
                } : null,
                sender: notification.sender ? {
                    name: notification.sender.name,
                    profilePic: notification.sender.profilePic
                } : null,
                message: notification.message,
                isRead: notification.isRead,
                createdAt: notification.createdAt
            }))
        }); 
    }
    catch (error) {
        console.error("Error fetching notifications:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}
module.exports = getNotification;