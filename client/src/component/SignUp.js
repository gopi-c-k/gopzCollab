import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { auth, googleProvider } from "../firebase";
import {
    sendEmailVerification,
    signInWithPopup,
    createUserWithEmailAndPassword,
    updateProfile 
} from "firebase/auth";

function SignUp({ prefersDarkMode }) {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loggedInUser, setLoggedInUser] = useState(null);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarType, setSnackbarType] = useState("success");
    const [name,setName] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        const passwordPattern =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        const emailPattern =
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*\.\w{2,3}$/;

        if (!emailPattern.test(email)) {
            setSnackbarMessage("Enter Correct Email!");
            setSnackbarType("error");
            return;
        }

        if (!passwordPattern.test(password)) {
            setSnackbarMessage(
                "Password must be at least 8 characters long, include uppercase, lowercase, a number, and a special character."
            );
            setSnackbarType("error");
            return;
        }

        if (password !== confirmPassword) {
            setSnackbarMessage("Passwords do not match!");
            setSnackbarType("error");
            return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
            displayName: name,
        });
        await sendEmailVerification(userCredential.user);
        setSnackbarType("success");
        setSnackbarMessage("Signup successful! ✅ Verification email sent.");
        navigate('/signin');
    };

    const handleGoogleSignIn = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            const token = await user.getIdToken();
            setLoggedInUser(user.email);
            navigate('/home')
            console.log("Token:", token);
        } catch (error) {
            setSnackbarMessage(error.message);
            setSnackbarType("error");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="w-full max-w-5xl bg-white shadow-xl rounded-xl overflow-hidden flex flex-col md:flex-row">
                {/* Left Panel - Orange Gradient */}
                <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-800 to-blue-500 text-white flex-col justify-center items-center p-8">
                    <h2 className="text-3xl font-bold mb-4 text-center">
                        Welcome to the gopzCollab Platform!
                    </h2>
                    <p className="mb-6 text-center max-w-sm">
                        Create an account to unlock all the exciting features of our platform.
                    </p>
                    <h3 className="text-lg font-semibold mb-2">Already have an account?</h3>
                    <p className="mb-4 text-center">Let’s go! Click below.</p>
                    <button
                        onClick={() => navigate("/signin")}
                        className="bg-white text-blue-500 font-semibold px-6 py-2 rounded-md hover:bg-blue-100 transition"
                    >
                        Sign In
                    </button>
                </div>

                {/* Sign-Up Form */}
                <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
                    <div className="flex justify-center mb-4">
                        <img
                            src="/assets/Images/Logo.png"
                            alt="Logo"
                            className="w-48"
                        />
                    </div>
                    <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Create Account</h2>

                    {snackbarMessage && (
                        <div
                            className={`mb-4 text-center px-4 py-2 rounded ${snackbarType === "error"
                                ? "bg-red-100 text-red-600"
                                : "bg-green-100 text-green-600"
                                }`}
                        >
                            {snackbarMessage}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <>
                            <input
                                type="text"
                                placeholder="Name"
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={email}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                            <input
                                type="email"
                                placeholder="Email"
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <input
                                type="password"
                                placeholder="Confirm Password"
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </>

                        <button
                            type="submit"
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-md transition duration-200"
                        >
                            Create Account
                        </button>
                    </form>
                    <>
                        <div className="text-center my-4 text-gray-500">OR</div>
                        <div className="space-y-3">
                            <button
                                onClick={handleGoogleSignIn}
                                className="w-full flex items-center justify-center border border-gray-300 rounded-md py-2 hover:bg-gray-100 transition">
                                <FcGoogle className="mr-2 text-xl" />
                                Sign in with Google
                            </button>
                            <button className="w-full flex items-center justify-center border border-gray-300 rounded-md py-2 hover:bg-gray-100 transition">
                                <FaGithub className="mr-2 text-black" />
                                Sign in with GitHub
                            </button>
                        </div>
                    </>
                </div>
            </div>
        </div>
    );
}

export default SignUp;
