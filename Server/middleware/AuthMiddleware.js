// const admin = require("firebase-admin");
const admin = require('./../firebase');

// Firebase Auth Middleware
const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.log(error);
        return res.status(403).json({ error: "Unauthorized: Invalid token Gopi" });
    }
};

module.exports = verifyToken;
