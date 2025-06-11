const User = require('../../models/user');
const Document = require('../../models/document');

const fetchUser = async (req, res) => {
    console.log("Fetching user data...");
    try {
        const { email } = req.user;

        // 1. Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // 2. Fetch created rooms (user is owner)
        const createdRooms = await Document.find({ owner: user._id })
            .select('_id title type');

        // 3. Fetch joined rooms (user is a collaborator but not the owner)
        const joinedRooms = await Document.find({
            collaborators: user._id,
            owner: { $ne: user._id } // optional, to avoid duplication
        }).select('_id title type');

        // 4. Respond with user data + filtered room data
        return res.status(200).json({
            name: user.name,
            profilePic: user.profilePic,
            createdRooms,
            joinedRooms
        });

    } catch (error) {
        console.error("Error fetching user:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

module.exports = fetchUser;
