const verifySocket = async (req, res, next) => {
    const auth = req.headers.authorization;

    if (!auth || !auth.startsWith('Bearer ') || auth !== `Bearer ${process.env.SOCKET_SECRET_KEY}`) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    next()
};

module.exports = verifySocket;