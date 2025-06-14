const User = require('../../models/user');
const Document = require('../../models/document');
const Notification = require('../../models/notification');

const deleteDocument = async (req, res) => {
    const { documentId } = req.params;
    const userEmail = req.user.email;

    try {
        const document = res.locals.document || await Document.findById(documentId);
        if (!document) {
            return res.status(404).json({ message: "Document not found" });
        }

        const user = req.user;
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }   

        if (res.locals.isOwner) {
            await Document.deleteOne({ _id: documentId });
            return res.status(200).json({ message: "Document deleted successfully!" });
        }
        const newNotification = new Notification({
            user: document.owner,
            type: "COLLAB_REMOVED",
            document: document._id,
            sender: user._id,
            message: `${userEmail} has removed you from the document "${document.title}".`
        });
        await newNotification.save();
        await Document.updateOne(
            { _id: documentId },
            { $pull: { collaborators: user._id } }
        );
        return res.status(200).json({ message: "Document deleted successfully!" });
    } catch (error) {
        console.error("Error deleting document:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

module.exports = deleteDocument;