import axios from "axios";
import { auth, googleProvider } from "../firebase";

// Create Axios instance
const axiosInstance = axios.create({
  baseURL: "http://localhost:5000", // update to your backend domain when deployed
  withCredentials: true,
});

// Attach Firebase ID Token to every request
axiosInstance.interceptors.request.use(
  async (config) => {

    // Wait for current user
    const currentUser = auth.currentUser;

    if (currentUser) {
      try {
        const token = await currentUser.getIdToken(); // get Firebase ID token
        config.headers.Authorization = `Bearer ${token}`;
      } catch (err) {
        console.error("Failed to get Firebase token:", err);
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
