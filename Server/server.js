const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const verifyToken = require("./middleware/AuthMiddleware");
const cors = require('cors');
const userRoute = require('./routes/userRoute.js');

dotenv.config();
connectDB();

const app = express();
app.use(
  cors({
    origin: "http://localhost:3001", // frontend origin
    credentials: true,
  })
);
app.use(express.json());


// Routes
app.use("/user",userRoute);
app.get('/', (req, res) => {
  res.send('GopzCollab Backend is Running 🚀');
});
app.get("/protected", verifyToken, (req, res) => {
  res.json({ message: `Hello ${req.user.email}, you're verified! ✅` });
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
