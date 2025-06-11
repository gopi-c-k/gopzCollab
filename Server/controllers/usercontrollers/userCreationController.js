const User = require('../../models/user');

const userCreate = async (req, res) => {
    try {
        const { email, uid, name, provider, profilePic } = req.user;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            // console.log("User Exists");
            return res.status(200).json({ message: "User Already Exists" });
        }

        // Create new user
        const newUser = new User({
            email,
            uid,
            name,
            provider,
            profilePic
        });

        await newUser.save();
        // console.log("User Created");
        return res.status(201).json({ message: "User Created Successfully" });
    } catch (error) {
        console.error("Error creating user:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

module.exports = userCreate;