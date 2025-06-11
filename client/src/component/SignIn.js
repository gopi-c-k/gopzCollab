import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import storeFirebaseToken from "../api/storeToken";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import axiosInstance from "../api/axiosInstance";
import { auth, googleProvider } from "../firebase";
import {
  signInWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import axios from "axios";


function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const emailPattern = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailPattern.test(email)) {
      setErrorMessage("Enter a valid email.");
      return;
    }

    if (!email || !password) {
      setErrorMessage("Enter both email and password.");
      return;
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        await sendEmailVerification(user);
        setErrorMessage("Email not verified. A new verification link was sent.");
        await signOut(auth);
      } else {
        const token = await user.getIdToken();
        setLoggedInUser(user.email);
        const res = await axiosInstance.post("/user/create");
        if (res.status === 200 || res.status === 201) {
          await storeFirebaseToken();
          navigate("/home");
        }

      }

    } catch (error) {
      setErrorMessage(error.message);
    }
  };
  const handleGoogleSignIn = async () => {
    setErrorMessage("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const token = await user.getIdToken();
      setLoggedInUser(user.email);
      const res = await axios.post("/user/create");
      if (res.status === 200 || res.status === 201) {
        await storeFirebaseToken();
        navigate("/home");
      }
    } catch (error) {
      setErrorMessage(error.message);
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-md overflow-hidden flex flex-col md:flex-row">
        {/* Sign-in Form */}
        <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
          <div className="flex justify-center mb-6">
            <img
              src="/assets/Images/Logo.png"
              alt="Logo"
              className="w-44"
            />
          </div>
          <h2 className="text-2xl font-bold text-center mb-4 text-gray-800">Sign In</h2>
          {errorMessage && <p className="text-red-500 text-center mb-4">{errorMessage}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="text-sm text-gray-500 hover:text-blue-500"
            >
              {showPassword ? "Hide Password" : "Show Password"}
            </button>
            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-md transition duration-200"
            >
              Sign In
            </button>
          </form>

          <div className="text-center my-4 text-gray-500">OR</div>

          <div className="space-y-3">
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center border border-gray-300 rounded-md py-2 hover:bg-gray-100 transition"
            >
              <FcGoogle className="mr-2" /> Sign in with Google
            </button>
            <button className="w-full flex items-center justify-center border border-gray-300 rounded-md py-2 hover:bg-gray-100 transition">
              <FaGithub className="mr-2" /> Sign in with GitHub
            </button>
          </div>

          <div className="text-center mt-6 text-sm">
            Don’t have an account?{" "}
            <span
              onClick={() => navigate("/signup")}
              className="text-blue-600 font-medium cursor-pointer hover:underline"
            >
              Create One
            </span>
          </div>
        </div>

        {/* Right Panel */}
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-800 to-blue-500 text-white flex-col justify-center items-center p-10">
          <h2 className="text-3xl font-bold mb-4">Welcome Back!</h2>
          <p className="mb-6 text-center max-w-md">
            Sign in to access your dashboard and explore exciting features.
          </p>
          <h3 className="text-xl font-semibold mb-2">New Here?</h3>
          <p className="mb-4 text-center max-w-md">
            Create an account and start your journey today.
          </p>
          <button
            onClick={() => navigate("/signup")}
            className="bg-white text-blue-500 font-semibold px-6 py-2 rounded-md hover:bg-blue-100 transition"
          >
            Create Account
          </button>
        </div>
      </div>
    </div>

  );
}

export default SignIn;