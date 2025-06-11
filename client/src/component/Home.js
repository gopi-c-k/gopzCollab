import React, { use, useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
//import logo from '../assets/logo.png';

const Home = () => {
  const [userName, setUserName] = useState(" ");
  const [profilePic, setProfilePic] = useState('');
  const [createdRooms, setCreatedRooms] = useState([{
    title: 'Room 1',
    type: 'text'
  }, {
    title: 'Room 2',
    type: 'code'
  }, {
    title: 'Room 3',
    type: 'canvas'
  }]);
  const [showRoomDetails, setShowRoomDetails] = useState(false);
  const [joinedRooms, setJoinedRooms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [createRoomModal, setCreateRoomModal] = useState(false);
  const [joinRoomModal, setJoinRoomModal] = useState(false);
  const [showMainModal, setShowMainModal] = useState(false);
  const [roomTitle, setRoomTitle] = useState('');
  const [roomType, setRoomType] = useState('text');
  const [joinRoomCode, setJoinRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [roomLoading, setRoomLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch user data from the server
        const response = await axiosInstance('/user/fetch');
        const data = response.data;
        setUserName(data.name);
        setProfilePic(data.profilePic);
        //setCreatedRooms(data.createdRooms.map(room => room.title));
        setJoinedRooms(data.joinedRooms.map(room => room.title));
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    }
    fetchUserData();
    console.log("User data fetch is calling");
  }, []);

  const handleCreateRoom = async () => {
    // Logic to create a room 
    if (!roomTitle) {
      alert("Please enter a room title.");
      return;
    }
    if (!roomType) {
      alert("Please select a room type.");
      return;
    }
    try {
      setLoading(true);

      const response = await axiosInstance.post('/room/create', {
        title: roomTitle,
        type: roomType
      });

      if (response.status === 200 || response.status === 201) {
        alert("Room created successfully!");
        setShowModal(false);
        setCreateRoomModal(false);
        setRoomTitle('');
        setRoomType('text');

        // Add the new room object instead of just the title
        setCreatedRooms(prev => [...prev, response.data]);

      } else {
        console.error("Unexpected response status:", response.status);
        alert("Failed to create room. Try again.");
      }
    } catch (error) {
      console.error("Error creating room:", error);
      alert("Something went wrong!");
    } finally {
      setLoading(false);
    }

  };
  const handleJoinRoom = async () => {
    // Logic to join a room 
    if (!joinRoomCode || joinRoomCode.length !== 6) {
      alert("Please enter a valid 6-digit room code.");
      return;
    }
    try {
      setLoading(true);
      const response = await axiosInstance.post('/room/join', {
        code: joinRoomCode
      });
      if (response.status === 200 || response.status === 201) {
        alert("Joined room successfully!");
        setShowModal(false);
        setJoinRoomModal(false);
        setJoinRoomCode('');
        setLoading(false);
        setJoinedRooms([...joinedRooms, response.data.roomTitle]);
      }
    } catch (error) {
      console.error('Error joining room:', error);
      setLoading(false);
      alert("Failed to join room. Please check the code and try again.");
    }
  }
  const handleRoomClick = async (room) => {
    setRoomLoading(true);
    setShowRoomDetails(true);
    console.log("Room clicked:", room);
  };
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <img src="/assets/Images/Logo.png" alt="Logo" className="h-10" />

        <div className="flex items-center space-x-4">
          <button className="bg-yellow-400 text-white p-2 rounded-full">
            <Bell />
          </button>
          <button className="bg-blue-600 text-white p-2 rounded-full">
            <img
              src={profilePic || '/assets/Images/defaultProfilePic.png'}
              alt="Profile"
              className="w-8 h-8 rounded-full"
            />
          </button>

        </div>
      </div>

      {/* Welcome */}
      <div className="text-left mb-10">
        <h2 className="text-2xl font-bold text-blue-700">Welcome, {userName}</h2>
      </div>

      {/* Created Rooms - One Line */}
      <div className="mb-12 bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Created Rooms</h2>
        <div className="flex flex-wrap gap-6">
          {createdRooms.map((room, index) => (
            <div key={index}
              onClick={() => { handleRoomClick(room) }}
              className="w-40 h-40 bg-white rounded-lg shadow-md hover:shadow-lg transition flex flex-col cusrsor-pointer hover:scale-105 justify-between overflow-hidden">
              <img
                src={`/assets/Images/${room.type}Icon.png`}
                alt="Room Icon"
                className="py-2 px-2 w-full h-28 object-cover rounded-t-lg"
              />
              <div className="text-center py-2 px-1 text-sm font-medium text-gray-800 border-t">
                {room.title}
              </div>
            </div>
          ))}

          {/* Create Room */}
          <button onClick={() => { setShowModal(true); setShowMainModal(true); }} className="w-40 h-40 bg-gradient-to-r from-blue-100 to-blue-300 flex flex-col items-center justify-center rounded-lg shadow-md cursor-pointer hover:scale-105 transition-transform">
            <div className="text-4xl text-blue-700 mb-1">+</div>
            <div className="text-blue-800 font-semibold text-center text-sm">Create/Join Room</div>
          </button>
        </div>
      </div>

      {/* Joined Rooms - One Line */}
      <div className='bg-white p-4 rounded-lg shadow-md'>
        <h2 className="text-xl font-semibold mb-4">Joined Rooms</h2>
        <div className="flex flex-wrap gap-6">
          {joinedRooms.length ? joinedRooms.map((room, index) => (
            <div key={index}
              onClick={() => { }}
              className="w-40 h-40 bg-white rounded-lg shadow-md hover:shadow-lg transition flex flex-col cusrsor-pointer justify-between overflow-hidden">
              <img
                src={`/assets/Images/${room.type}Icon.png`}
                alt="Room Icon"
                className="py-2 px-2 w-full h-28 object-cover rounded-t-lg"
              />
              <div className="text-center py-2 px-1 text-sm font-medium text-gray-800 border-t">
                {room.title}
              </div>
            </div>
          )) : (
            <div className="w-full text-center text-gray-500">No joined rooms yet.</div>
          )}
        </div>
      </div>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
            <h2 className="text-xl font-semibold mb-4 text-blue-600">{showMainModal ? "Create or Join Room" : createRoomModal ? "Create Room" : "Join Room"}</h2>

            {/* Modal content goes here */}

            {showMainModal && (
              <div className="space-y-1">
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-full mb-4"
                  onClick={() => {
                    setShowMainModal(false);
                    setCreateRoomModal(true);
                  }}
                >Create Room</button>
                <button
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 w-full mb-4"
                  onClick={() => {
                    setShowMainModal(false);
                    setJoinRoomModal(true);
                  }}
                >Join Room</button>
              </div>)}

            {createRoomModal && (
              <div>
                <input
                  type="text"
                  onChange={(e) => setRoomTitle(e.target.value)}
                  value={roomTitle}
                  placeholder="Enter Room Title"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                />
                <p className="text-sm text-gray-600 mb-2">Select Room Type:</p>
                <select
                  onChange={(e) => setRoomType(e.target.value)}
                  value={roomType}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4">
                  <option value="text">Text</option>
                  <option value="code">Code</option>
                  <option value="canvas">Canvas</option>
                </select>
                <button
                  onClick={() => handleCreateRoom()}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-full mb-4"
                >
                  Create Room
                </button>
                <button
                  onClick={() => { setShowMainModal(true); setCreateRoomModal(false) }}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 w-full mb-4"
                >
                  Cancel
                </button>

              </div>)

            }
            {joinRoomModal && (
              <div>
                <input
                  type="text"
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d{0,6}$/.test(value)) {
                      setJoinRoomCode(value);
                    }
                  }}
                  value={joinRoomCode}
                  placeholder="Enter 6-digit Room Code"
                  maxLength={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                />

                <button
                  onClick={() => handleJoinRoom()}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-full mb-4"
                >
                  Join Room
                </button>
                <button
                  onClick={() => { setShowMainModal(true); setJoinRoomModal(false); }}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 w-full mb-4"
                >
                  Cancel
                </button>

              </div>)

            }
            {/* Optional close (X) button */}
            <button
              className="absolute top-2 right-3 text-gray-600 hover:text-gray-800"
              onClick={() => setShowModal(false)}
            >
              ×
            </button>
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600">
                </div>
              </div>
            )}
          </div>
        </div>
      )
      }
      {showRoomDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
            <h2 className="text-xl font-semibold mb-4 text-blue-600">Room Details</h2>
            <p>Room Title:</p>
            <p className="text-sm text-gray-600 mb-4">Room 1</p>
            <p>Room Type:</p>
            <p className="text-sm text-gray-600 mb-4">Text</p>
            <p>Ownwer:</p>
            <p className="text-sm text-gray-600 mb-4">John Doe</p>
            <p>Collaborators:</p>
            <p className="text-sm text-gray-600 mb-4">Jane Smith, Alice Johnson</p>
            <p>Created At:</p>
            <p className="text-sm text-gray-600 mb-4">2023-10-01 12:00 PM</p>
            <p>Last Updated:</p>
            <p className="text-sm text-gray-600 mb-4">2023-10-02 03:00 PM</p>
            <button
              className="absolute top-2 right-3 text-gray-600 hover:text-gray-800"
              onClick={() => setShowRoomDetails(false)}
            >
              ×
            </button>
          </div>
        </div>
      )}

    </div >
  );
};

export default Home;
