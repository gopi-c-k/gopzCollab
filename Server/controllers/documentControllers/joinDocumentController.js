const Document = require('../../models/document');
const User = require('../../models/user');
const Notification = require('../../models/notification');

const joinDocument = async (req, res) => {
    const {documentId,joinerId} = req.body;
    const userEmail = req.user.email;
    try {
        const document = await Document.findById(documentId);
        if (!document) {
            return res.status(404).json({ message: "Document not found" });
        }

        const user = await User.findOne({ email: userEmail });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const joiner = await User.findById(joinerId);
        if (!joiner) {
            return res.status(404).json({ message: "Joiner not found" });
        }
        if (document.collaborators.includes(user._id)) {
            return res.status(400).json({ message: "You are already a collaborator on this document." });
        }

        document.collaborators.push(user._id);
        await document.save();

        const newNotification = new Notification({
            user: joiner._id,
            type: "COLLAB_ADDED",
            document: document._id,
            sender: user._id,
            message: `${userEmail} has joined the document "${document.title}".`
        });

        await newNotification.save();

        return res.status(200).json({ message: "Successfully joined the document!" });
    } catch (error) {
        console.error("Error joining document:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}
module.exports = joinDocument;