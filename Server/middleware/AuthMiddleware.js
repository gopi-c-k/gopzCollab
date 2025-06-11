// const admin = require("firebase-admin");
const admin = require('./../firebase');

// Firebase Auth Middleware
const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.log("No token provided");
        return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            name: decodedToken.name || "",
            profilePic: decodedToken.picture || "",
            provider: decodedToken.firebase?.sign_in_provider || "unknown"
        };
        next();
    } catch (error) {
        console.log(error);
        return res.status(403).json({ error: "Unauthorized: Invalid token" });
    }
};

module.exports = verifyToken;
