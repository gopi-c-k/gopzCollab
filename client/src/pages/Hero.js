import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { auth, googleProvider } from "../firebase";
import { signInWithPopup } from "firebase/auth";
import axiosInstance from "../api/axiosInstance";
import storeFirebaseToken from "../api/storeToken";

function Hero() {
  const navigate = useNavigate();

  // ✅ Auto Google Sign-In if already logged in
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        await storeFirebaseToken();
        navigate("/home"); // redirect to app dashboard
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      const res = await axiosInstance.post("/user/create");
      if (res.status === 200 || res.status === 201) {
        await storeFirebaseToken();
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Google Sign-In failed:", error.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="w-full flex justify-between items-center px-6 py-4 shadow-md bg-white">
        <div
          className="flex items-center cursor-pointer"
          onClick={() => navigate("/")}
        >
          <img
            src={`${process.env.PUBLIC_URL}/assets/images/Logo.png`}
            alt="Logo"
            className="w-10 h-10 mr-2"
          />
          <h1 className="text-xl font-bold text-blue-600">GopzCollab</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/signin")}
            className="text-blue-600 font-medium hover:underline"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate("/signup")}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
          >
            Sign Up
          </button>
          <button
            onClick={handleGoogleSignIn}
            className="flex items-center border border-gray-300 px-3 py-2 rounded-md hover:bg-gray-100 transition"
          >
            <FcGoogle className="mr-2 text-xl" /> Google
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="flex flex-col flex-grow items-center justify-center text-center px-6">
        {/* Centered Logo */}
        <img
          src={`${process.env.PUBLIC_URL}/assets/images/Logo.png`}
          alt="Logo"
          className="w-40 mb-6"
        />

        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
          🌍 Real-Time Global Collaboration
        </h2>
        <p className="text-gray-600 max-w-xl mb-6">
          Work together instantly with text, canvas, and content sharing —
          powered by Firebase Auth, Yjs, and WebSockets.
        </p>

        {/* 3 Main CTA Buttons */}
        <div className="flex flex-col md:flex-row gap-4">
          <button
            onClick={handleGoogleSignIn}
            className="flex items-center justify-center w-64 bg-white border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-100 transition"
          >
            <FcGoogle className="mr-2 text-xl" /> Continue with Google
          </button>
          <button
            onClick={() => navigate("/signin")}
            className="w-64 bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-900 transition"
          >
            Sign In with Email
          </button>
          <button
            onClick={() => navigate("/signup")}
            className="w-64 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}

export default Hero;
