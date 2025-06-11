const Document = require('../../models/document');

const createDocument = async (req, res) => {
    console.log("Creating a new document...");
    try {
        const { title, type } = req.body;
        const ownerId = req.user && req.user._id; // Assumes authentication middleware sets req.user

        // Validate input
        if (!title || !type) {
            return res.status(400).json({ message: "Title and type are required." });
        }

        // Validate type
        if (!['text', 'code', 'canvas'].includes(type)) {
            return res.status(400).json({ message: "Invalid document type." });
        }

        // Create new document
        const newDocument = await Document.create({
            title,
            type,
            owner: ownerId,
            collaborators: [],
            content: '',
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