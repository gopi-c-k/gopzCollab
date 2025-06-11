import axios from "axios";
import { auth } from "../firebase"; // adjust the path if needed

// Create Axios instance
const axiosInstance = axios.create({
  baseURL: "http://localhost:5000", // Update for production
  withCredentials: true,
});

axiosInstance.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;

    if (user) {
      try {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;

        // Save token in localStorage with expiry of 18 days
        localStorage.setItem("firebaseToken", JSON.stringify({
          token,
          expiry: Date.now() + 18 * 24 * 60 * 60 * 1000, // 18 days
        }));
        return config;
      } catch (error) {
        console.error("Error getting Firebase token from user:", error);
      }
    }

    // If no auth user, use stored token if valid
    const tokenData = JSON.parse(localStorage.getItem("firebaseToken"));
    if (tokenData && tokenData.expiry > Date.now()) {
      config.headers.Authorization = `Bearer ${tokenData.token}`;
    } else {
      localStorage.removeItem("firebaseToken");
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
