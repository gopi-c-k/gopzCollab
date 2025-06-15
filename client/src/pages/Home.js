import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { Bell, FilePlus, UserPlus } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import Notification from '../components/Notification';
import mammoth from 'mammoth';

const Home = () => {
  const [userName, setUserName] = useState(" ");
  const [profilePic, setProfilePic] = useState('');
  const [createdRooms, setCreatedRooms] = useState([]);
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
  const [notificationsCount, setNotificationsCount] = useState(0);

  // For room details
  const [roomDetailsLoading, setRoomDetailsLoading] = useState(false);
  const [roomDetails, setRoomDetails] = useState(null);

  // For deleting rooms
  const [deleteRoomLoading, setDeleteRoomLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');

  // For notifications
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState('info');
  const [showSnackbar, setShowSnackbar] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch user data from the server
        const response = await axiosInstance('/user/fetch');
        const data = response.data;
        setUserName(data.name);
        setProfilePic(data.profilePic);
        setCreatedRooms(data.createdRooms);
        setJoinedRooms(data.joinedRooms);
        setNotificationsCount(data.notificationsCount);
      } catch (error) {
        navigate('/signin');
        console.error('Error fetching user data:', error);
      }
    }
    fetchUserData();
  }, []);

  const [htmlContent, setHtmlContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateRoom = async () => {
    // Logic to create a room 
    if (!roomTitle) {
      setSnackbarMessage('Please enter a room title.');
      setSnackbarType('error');
      setShowSnackbar(true);
      setTimeout(() => setShowSnackbar(false), 3000);
      return;
    }
    if (!roomType) {
      setSnackbarMessage('Please select a room type.');
      setSnackbarType('error');
      setShowSnackbar(true);
      setTimeout(() => setShowSnackbar(false), 3000);
      return;
    }
    try {
      setLoading(true);
      let content = '';
      if (roomType === 'text' && htmlContent) {
        content = htmlContent;
      }
      const response = await axiosInstance.post('/room/create', {
        title: roomTitle,
        type: roomType,
        content: content
      });

      if (response.status === 200 || response.status === 201) {
        setSnackbarMessage('Room created successfully!');
        setSnackbarType('success');
        setShowSnackbar(true);
        setTimeout(() => setShowSnackbar(false), 3000);
        setShowModal(false);
        setCreateRoomModal(false);
        setRoomTitle('');
        setRoomType('text');

        // Add the new room object instead of just the title
        setCreatedRooms(prev => [...prev, response.data.document]);

      } else {
        console.error("Unexpected response status:", response.status);
        setSnackbarMessage('Failed to create room. Please try again.');
        setSnackbarType('error');
        setShowSnackbar(true);
        setTimeout(() => setShowSnackbar(false), 3000);
      }
    } catch (error) {
      console.error("Error creating room:", error);
      setSnackbarMessage('Failed to create room. Please try again.');
      setSnackbarType('error');
      setShowSnackbar(true);
      setTimeout(() => setShowSnackbar(false), 3000);
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
      const response = await axiosInstance.post('/room/request', {
        joinCode: joinRoomCode
      });
      if (response.status === 200 || response.status === 201) {
        setSnackbarMessage(response.data.message || 'Room joined successfully!');
        setSnackbarType('success');
        setShowSnackbar(true);
        setTimeout(() => setShowSnackbar(false), 3000);
        setShowModal(false);
        setJoinRoomModal(false);
        setJoinRoomCode('');
        setLoading(false);
      }
      if (response.status === 400) {
        setSnackbarMessage(response.data.message || 'Failed to join room. Please check the code and try again.');
        setSnackbarType('error');
        setShowSnackbar(true);
        setTimeout(() => setShowSnackbar(false), 3000);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error joining room:', error);
      setLoading(false);
      alert("Failed to join room. Please check the code and try again.");
    }
  }

  const handleRoomClick = async (room) => {
    // Implement navigation or logic for room click
  };

  const handleDetailsClick = async (room) => {
    setShowRoomDetails(true);
    setRoomDetailsLoading(true);
    try {
      const response = await axiosInstance.get(`/room/details/${room._id}`);
      if (response.status === 200) {
        setRoomDetails(response.data);
        setRoomDetailsLoading(false);
      } else {
        console.error("Failed to fetch room details:", response.status);
      }
    } catch (error) {
      console.error('Error fetching room details:', error);
    }
  };

  const handleDeleteRoom = async (room) => {
    setDeleteRoomLoading(true);
    try {
      const roomId = room._id;
      const response = await axiosInstance.delete(`/room/delete/${roomId}`);
      if (response.status === 200) {
        if (room.owner) {
          setSnackbarMessage('Room deleted successfully!');
          setSnackbarType('success');
          setShowSnackbar(true);
          setTimeout(() => setShowSnackbar(false), 3000);
          setCreatedRooms(createdRooms.filter(r => r._id !== roomId));
        } else {
          setSnackbarMessage('You have left the room successfully!');
          setSnackbarType('success');
          setShowSnackbar(true);
          setTimeout(() => setShowSnackbar(false), 3000);
          setJoinedRooms(joinedRooms.filter(r => r._id !== roomId));
        }
        setShowDeleteModal(false);
        setRoomToDelete(null);
      } else {
        console.error("Failed to delete room:", response.status);
        setSnackbarMessage('Failed to delete/remove room. Please try again.');
        setSnackbarType('error');
        setShowSnackbar(true);
        setTimeout(() => setShowSnackbar(false), 3000);
        setDeleteRoomLoading(false);
      }
    } catch (error) {
      console.error('Error deleting room:', error);
      setSnackbarMessage('Failed to delete/remove room. Please try again.');
      setSnackbarType('error');
      setShowSnackbar(true);
      setTimeout(() => setShowSnackbar(false), 3000);
    } finally {
      setDeleteRoomLoading(false);
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsFileLoading(true);
    setError('');
    setFileName(file.name);

    try {
      const fileType = file.type;
      const fileExtension = file.name.split('.').pop().toLowerCase();
      if (
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileExtension === 'docx'
      ) {
        await extractTextFromDocx(file);
      } else if (fileType === 'text/html' || fileExtension === 'html') {
        await extractTextFromHtml(file);
      } else {
        throw new Error('Unsupported file type. Please upload a DOCX or HTML file.');
      }
      if (!htmlContent) {
        setSnackbarMessage('No text extracted from the file. Please try a different file.');
        setSnackbarType('error');
        setShowSnackbar(true);
        setTimeout(() => setShowSnackbar(false), 3000);
        throw new Error('No text extracted from the file. Please try a different file.');
      }
      setSnackbarMessage('File processed successfully!');
      setSnackbarType('success');
      setShowSnackbar(true);
      setTimeout(() => setShowSnackbar(false), 3000);
    } catch (err) {
      setError(err.message);
      console.error('Error processing file:', err);
    } finally {
      setIsFileLoading(false);
    }
  };

  const extractTextFromDocx = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });

    const htmlText = result.value
      .split('\n\n')
      .filter(para => para.trim())
      .map(para => `<p>${para.replace(/\n/g, ' ').trim()}</p>`)
      .join('');

    setHtmlContent(htmlText);
  };

  const extractTextFromHtml = async (file) => {
    const text = await file.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');

    const images = doc.querySelectorAll('img');
    images.forEach(img => img.remove());
    const bodyContent = doc.body.innerHTML;

    setHtmlContent(bodyContent);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b-2 border-blue-500">
        <img src="/assets/Images/Logo.png" alt="Logo" className="h-10 mb-2" />

        <div className="flex items-center space-x-4 mb-2">
          <button
            onClick={() => navigate('/notification')}
            className="relative bg-yellow-400 text-white p-2 rounded-full">
            <Bell />
            {notificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-xs text-white w-5 h-5 flex items-center justify-center rounded-full">
                {notificationsCount > 99 ? '99+' : notificationsCount}
              </span>
            )}
          </button>

          <button className="bg-blue-600 text-white p-2 rounded-full">
            <img
              src={profilePic || '/assets/Images/defaultProfilePic.png'}
              alt="Profile"
              className="w-6 h-6 rounded-full"
            />
          </button>
        </div>
      </div>

      {/* Welcome */}
      <div className="text-left mb-10">
        <h2 className="text-2xl font-bold text-blue-700">Welcome, {userName}</h2>
      </div>

      {/* Created Rooms */}
      <div className="mb-4 bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Created Rooms</h2>
        <div className="flex flex-wrap gap-6">
          {/* Existing Created Rooms */}
          {createdRooms.map((room, index) => (
            <div
              key={index}
              className="relative w-40 h-40 bg-white rounded-xl shadow-md hover:shadow-lg transition cursor-pointer hover:scale-105 flex flex-col justify-between overflow-hidden"
              onClick={() => handleRoomClick(room)}
              style={{ minWidth: '160px', minHeight: '160px' }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteModal(true);
                  setRoomToDelete(room);
                }}
                className="absolute top-2 right-10 z-10 p-1 rounded-full bg-red-100 hover:bg-red-200"
                title="Delete Room"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDetailsClick(room);
                }}
                className="absolute top-2 right-2 z-10 p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                title="View Details"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
                </svg>
              </button>

              <div className="flex flex-col items-center justify-center text-center px-2 pt-6 pb-2 mt-2">
                <div className="text-gray-800 font-semibold text-base">{room.title}</div>
                <div className="text-gray-500 text-xs mt-1">Tap to explore</div>
              </div>

              <div className="w-full h-16 overflow-hidden border-t">
                <img
                  src={`/assets/Images/${room.type}Icon.png`}
                  alt="Room Icon"
                  className="w-full h-full object-contain p-2"
                />
              </div>
            </div>
          ))}
          {/* Create Room Card - always at the end */}
          <div
            className="relative w-40 h-40 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer hover:scale-105 flex flex-col items-center justify-center"
            style={{
              minWidth: '160px',
              minHeight: '160px',
              background: 'linear-gradient(135deg, #b3c6ff 0%, #e0e7ff 100%)'
            }}
            onClick={() => { setShowModal(true); setShowMainModal(false); setCreateRoomModal(true); setJoinRoomModal(false); }}
          >
            <FilePlus size={40} className="mb-2 text-blue-700" />
            <span className="text-lg font-semibold text-blue-800">Create Room</span>
          </div>
        </div>
      </div>

      {/* Joined Rooms */}
      <div className='bg-white p-4 rounded-lg shadow-md mb-4'>
        <h2 className="text-xl font-semibold mb-4">Joined Rooms</h2>
        <div className="flex flex-wrap gap-6">
          {/* Existing Joined Rooms */}
          {joinedRooms.length > 0 && joinedRooms.map((room, index) => (
            <div
              key={index}
              className="relative w-40 h-40 bg-white rounded-xl shadow-md hover:shadow-lg transition cursor-pointer hover:scale-105 flex flex-col justify-between overflow-hidden"
              onClick={() => handleRoomClick(room)}
              style={{ minWidth: '160px', minHeight: '160px' }}
            >
              {/* Details icon */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDetailsClick(room);
                }}
                className="absolute top-2 right-2 z-10 p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                title="View Details"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
                </svg>
              </button>

              <div className="flex flex-col items-center justify-center text-center px-2 pt-6 pb-2">
                <div className="text-gray-800 font-semibold text-base">{room.title}</div>
                <div className="text-gray-500 text-xs mt-1">Tap to explore</div>
              </div>

              <div className="w-full h-16 overflow-hidden border-t">
                <img
                  src={`/assets/Images/${room.type}Icon.png`}
                  alt="Room Icon"
                  className="w-full h-full object-contain p-2"
                />
              </div>
            </div>
          ))}
          {/* Join Room Card - always at the end */}
          <div
            className="relative w-40 h-40 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer hover:scale-105 flex flex-col items-center justify-center"
            style={{
              minWidth: '160px',
              minHeight: '160px',
              background: 'linear-gradient(135deg, #b2f7ef 0%, #e0f7fa 100%)'
            }}
            onClick={() => { setShowModal(true); setShowMainModal(false); setCreateRoomModal(false); setJoinRoomModal(true); }}
          >
            <UserPlus size={40} className="mb-2 text-green-700" />
            <span className="text-lg font-semibold text-green-800">Join Room</span>
          </div>
        </div>
      </div>

      {/* Modals and Notifications */}
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
                {roomType === 'text' && (<>
                  <p className="text-sm text-gray-600 mb-2">If you want to edit an existing file, upload it:</p>
                  <input
                    type="file"
                    accept=".docx,.html"
                    onChange={handleFileUpload}
                    disabled={isFileLoading}
                    style={{ padding: '10px' }}
                  /></>
                )}
                <button
                  onClick={() => handleCreateRoom()}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-full mb-4"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Room'}
                </button>
                <button
                  onClick={() => { setShowModal(false); setCreateRoomModal(false); setJoinRoomModal(false); setShowMainModal(false); }}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 w-full mb-4"
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            )}

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
                  disabled={loading}
                >
                  {loading ? 'Joining...' : 'Join Room'}
                </button>
                <button
                  onClick={() => { setShowModal(false); setJoinRoomModal(false); setCreateRoomModal(false); setShowMainModal(false); }}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 w-full mb-4"
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            )}
            {/* Optional close (X) button */}
            <button
              className="absolute top-2 right-3 text-gray-600 hover:text-gray-800"
              onClick={() => { setShowModal(false); setJoinRoomModal(false); setCreateRoomModal(false); setShowMainModal(false); }}
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
      )}

      {(showRoomDetails && !roomDetailsLoading && roomDetails) ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
            <h2 className="text-xl font-semibold mb-4 text-blue-600">Room Details</h2>
            <p>Room Title:</p>
            <p className="text-sm text-gray-600 mb-4">{roomDetails.title}</p>
            <p>Room Type:</p>
            <p className="text-sm text-gray-600 mb-4">{roomDetails.type}</p>
            <p>Owner:</p>
            <p className="text-sm text-gray-600 mb-4">{roomDetails.owner}</p>
            <p>Collaborators:</p>
            <p className="text-sm text-gray-600 mb-4">
              {roomDetails.collaborators && roomDetails.collaborators.length
                ? roomDetails.collaborators.join(', ')
                : 'None'}
            </p>
            <p>Created At:</p>
            <p className="text-sm text-gray-600 mb-4">
              {roomDetails.createdAt && new Date(roomDetails.createdAt).toLocaleString()}
            </p>
            <p>Last Updated:</p>
            <p className="text-sm text-gray-600 mb-4">
              {roomDetails.updatedAt && new Date(roomDetails.updatedAt).toLocaleString()}
            </p>
            <button
              className="absolute top-2 right-3 text-gray-600 hover:text-gray-800"
              onClick={() => setShowRoomDetails(false)}
            >
              ×
            </button>
          </div>
        </div>
      ) : (
        showRoomDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600"></div>
          </div>
        )
      )}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
            <h2 className="text-xl font-semibold mb-4 text-red-600">Delete Room</h2>
            <p>Are you sure you want to delete this room?</p>
            <p className="text-sm text-gray-500 mb-2">
              Type <strong>{roomToDelete.title}</strong> to confirm.
            </p>

            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 mt-2"
              placeholder={`Type "${roomToDelete.title}" to confirm`}
              value={deleteConfirmationInput}
              onChange={(e) => setDeleteConfirmationInput(e.target.value)}
            />

            <div className="flex justify-end mt-4 space-x-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmationInput('');
                  setRoomToDelete(null);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteRoom(roomToDelete)}
                disabled={deleteConfirmationInput !== roomToDelete.title || deleteRoomLoading}
                className={`px-4 py-2 rounded text-white ${deleteConfirmationInput === roomToDelete.title && !deleteRoomLoading
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-red-300 cursor-not-allowed'
                  }`}
              >
                {deleteRoomLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSnackbar && (
        <Notification
          message={snackbarMessage}
          type={snackbarType}
        />
      )}

    </div>
  );
};

export default Home;
