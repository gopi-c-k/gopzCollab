const Document = require('../../models/document');
const User = require('../../models/user');

const createDocument = async (req, res) => {
    try {
        const { title, type } = req.body;
        if (!title || !type) {
            return res.status(400).json({ message: "Title and type are required." });
        }

        if (!['text', 'code', 'canvas'].includes(type)) {
            return res.status(400).json({ message: "Invalid document type." });
        }
        var userContent = '';
        if (type === 'text') {
            const { content } = req.body;
            if (content)
                userContent = content;
        }
        const user = await User.findOne({ email: req.user.email });
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // Create new document
        const newDocument = await Document.create({
            title,
            type,
            owner: user._id,
            collaborators: [],
            content: userContent,
            canvasData: {},
        });

        return res.status(201).json({
            message: "Document created successfully!",
            document: {
                _id: newDocument._id,
                title: newDocument.title,
                type: newDocument.type,
            }
        });
    } catch (error) {
        console.error("Error creating document:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

module.exports = createDocument;
