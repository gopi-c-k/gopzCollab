const Document = require('../../models/document');
const User = require('../../models/user');
const Notification = require('../../models/notification');

const requestToJoinRoom = async (req, res) => {
    const { joinCode } = req.body;
    const userEmail = req.user.email;

    try {
        const document = await Document.findOne({ code: joinCode });
        if (!document) {
            return res.status(404).json({ message: "Room not found" });
        }

        const user = await User.findOne({ email: userEmail });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (document.collaborators.includes(user._id)) {
            return res.status(400).json({ message: "You are already a collaborator in this room." });
        }
        
        if(document.owner.toString() === user._id.toString()) {
            return res.status(400).json({ message: "You cannot request to join your own room." });
        }
        // Create a notification for the room owner
        const newNotification = new Notification({
            user: document.owner,
            type: "COLLAB_REQUEST",
            document: document._id,
            sender: user._id,
            message: `${userEmail} has requested to join the room "${document.title}".`
        });

        await newNotification.save();

        return res.status(200).json({ message: "Request to join room sent successfully!" });
    } catch (error) {
        console.error("Error requesting to join room:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}
module.exports = requestToJoinRoom;