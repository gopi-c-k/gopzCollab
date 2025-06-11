import React from 'react';
import { Bell, UserPlus } from 'lucide-react';
//import logo from '../assets/logo.png';

const Home = () => {
  const username = "John"; // Replace with dynamic user value
  const createdRooms = ['Room A', 'Room B', 'Room C', 'Room D'];
  const joinedRooms = ['Marketing Team', 'Study Buddies', 'Design Squad', 'Dev Team'];

  const squareBoxStyle =
    "w-40 h-40 flex items-center justify-center bg-white rounded-lg shadow-md text-lg font-medium hover:shadow-lg transition";

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <img  src="/assets/Images/Logo.png" alt="Logo" className="h-10" />

        <div className="flex items-center space-x-4">
          <button className="bg-yellow-400 text-white p-2 rounded-full">
            <Bell />
          </button>
          <button className="bg-blue-600 text-white p-2 rounded-full">
            <UserPlus />
          </button>
        </div>
      </div>

      {/* Welcome */}
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-blue-700">Welcome, {username}</h2>
      </div>

      {/* Created Rooms - One Line */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Created Rooms</h2>
        <div className="flex flex-wrap gap-6">
          {createdRooms.map((room, index) => (
            <div key={index} className={squareBoxStyle}>
              {room}
            </div>
          ))}
          {/* Create Room */}
          <div className="w-40 h-40 bg-gradient-to-r from-blue-100 to-blue-300 flex flex-col items-center justify-center rounded-lg shadow-md cursor-pointer hover:scale-105 transition-transform">
            <div className="text-4xl text-blue-700 mb-1">+</div>
            <div className="text-blue-800 font-semibold text-center text-sm">Create/Join Room</div>
          </div>
        </div>
      </div>

      {/* Joined Rooms - One Line */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Joined Rooms</h2>
        <div className="flex flex-wrap gap-6">
          {joinedRooms.map((room, index) => (
            <div key={index} className={squareBoxStyle}>
              {room}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
