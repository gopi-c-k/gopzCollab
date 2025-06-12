const User = require('../models/user');
const Document = require('../models/document');

const verifyDocumentOwnership = (allowedRoles = []) => {
  return async (req, res, next) => {
    const { documentId } = req.params;
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

      const isOwner = document.owner.toString() === user._id.toString();
      const isCollaborator = document.collaborators.some(
        (collabId) => collabId.toString() === user._id.toString()
      );

      res.locals.isOwner = isOwner;
      res.locals.isCollaborator = isCollaborator;
      res.locals.document = document;

      // Access check
      const hasAccess = (
        (allowedRoles.includes('owner') && isOwner) ||
        (allowedRoles.includes('collaborator') && isCollaborator)
      );

      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied: You are not authorized to access this document." });
      }

      next();
    } catch (error) {
      console.error("Error verifying document ownership:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  };
};

module.exports = verifyDocumentOwnership;
