import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { Bell, FilePlus, UserPlus, Moon, Sun, Search, Plus, Trash2, MessageSquareShare, Info, Clock, X, Activity, LogOut, FileText, Users } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import Notification from '../components/Notification';
import mammoth from 'mammoth';

const Home = () => {
  const [userName, setUserName] = useState(" ");
  const [profilePic, setProfilePic] = useState('');
  const [createdRooms, setCreatedRooms] = useState([]);
  const [showRoomDetails, setShowRoomDetails] = useState(false);
  const [joinedRooms, setJoinedRooms] = useState([]);
  const [recentlyActiveRooms, setRecentlyActiveRooms] = useState([]);
  const [recentlyEditedByYou, setrecentlyEditedByYou] = useState([]);
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
  const [roomEditorLoading, setRoomEditorLoading] = useState(false);

  // For deleting rooms
  const [deleteRoomLoading, setDeleteRoomLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');

  // For notifications
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState('info');
  const [showSnackbar, setShowSnackbar] = useState(false);

  const [darkMode, setDarkMode] = useState(false);
  const [createdSearch, setCreatedSearch] = useState('');
  const [joinedSearch, setJoinedSearch] = useState('');
  const [createdSort, setCreatedSort] = useState('recent');
  const [joinedSort, setJoinedSort] = useState('recent');

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      setRoomEditorLoading(true);
      try {
        const response = await axiosInstance('/user/fetch');
        if (response.status === 200) {
          const data = response.data;
          setUserName(data.name);
          setProfilePic(data.profilePic || `https://ui-avatars.com/api/?name=${data.name}&background=random`);
          setCreatedRooms(data.createdRooms);
          setJoinedRooms(data.joinedRooms);
          setRecentlyActiveRooms(data.recentlyActiveRooms);
          setrecentlyEditedByYou(data.recentlyEditedByYou);
          setNotificationsCount(data.notificationsCount);
          setRoomEditorLoading(false);
        } else {
          setSnackbarMessage('Please try to Sign In again');
          setSnackbarType('error');
          setShowSnackbar(true);
          setTimeout(() => {
            setShowSnackbar(false); setRoomEditorLoading(false);
            navigate('/signin');
          }, 3000);
        }
      } catch (error) {
        setSnackbarMessage('Please try to Sign In again');
        setSnackbarType('error');
        setShowSnackbar(true);
        setTimeout(() => {
          setShowSnackbar(false); setRoomEditorLoading(false);
          navigate('/signin');
        }, 3000);
        console.error('Error fetching user data:', error);
      }
    }
    fetchUserData();
  }, []);

  const [htmlContent, setHtmlContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [error, setError] = useState('');

  const copyNumberToClipboard = async (number) => {
    try {
      await navigator.clipboard.writeText(number.toString());
      setShowSnackbar(true);
      setSnackbarMessage('✅ Room code copied to clipboard!');
      setSnackbarType('success');
    } catch (err) {
      setShowSnackbar(true);
      setSnackbarMessage('❌ Failed to copy room code.');
      setSnackbarType('error');
    } finally {
      setTimeout(() => setShowSnackbar(false), 3000);
    }
  };



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
    if (room.type === 'text') {
      setRoomEditorLoading(true);
      try {
        const res = await axiosInstance.post(`/session/create-or-join/${room._id}`);
        if (res.status === 200) {
          setRoomEditorLoading(false);
          const session = res.data;
          navigate('/editor', {
            state: {
              session
            }
          });
        }
      } catch (error) {
        setRoomEditorLoading(false);
        setSnackbarMessage('Error while joining the room!');
        setSnackbarType('error');
        setShowSnackbar(true);
        setTimeout(() => setShowSnackbar(false), 3000);
      }
    }
    else if (room.type === 'canvas') {
      setRoomEditorLoading(true);
      try {
        const res = await axiosInstance.post(`/session/create-or-join/${room._id}`);
        if (res.status === 200) {
          setRoomEditorLoading(false);
          const session = res.data;
          navigate('/canvas/editor', {
            state: {
              session
            }
          });
        }
      } catch (error) {
        setRoomEditorLoading(false);
        setSnackbarMessage('Error while joining the room!');
        setSnackbarType('error');
        setShowSnackbar(true);
        setTimeout(() => setShowSnackbar(false), 3000);
      }
    }
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
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const extractTextFromHtml = async (file) => {
    const text = await file.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');

    const images = doc.querySelectorAll('img');
    images.forEach(img => img.remove());
    const bodyContent = doc.body.innerHTML;

    setHtmlContent(bodyContent);
  };
  const RoomCard = ({ room, onRoomClick, onDetailsClick, onDeleteClick, isOwner }) => (
    <div
      className="relative w-48 h-52 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden"
      onClick={() => onRoomClick(room)}
    >
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/10 dark:to-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      {/* Card header with subtle pattern */}
      <div className="relative h-24 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 overflow-hidden">
        <div className="absolute inset-0 opacity-20 dark:opacity-30">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <pattern
              id="hexagons"
              width="40"
              height="34.64"
              patternUnits="userSpaceOnUse"
              patternTransform="scale(10)"
            >
              <polygon
                points="20,0 30,8.66 30,25.98 20,34.64 10,25.98 10,8.66"
                fill="currentColor"
                opacity="0.2"
              />
            </pattern>
            <rect width="100%" height="100%" fill="url(#hexagons)" />
          </svg>
        </div>

        {/* Room type indicator */}
        <div className="absolute top-3 left-3 px-2 py-1 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-md text-xs font-medium text-blue-600 dark:text-blue-400 shadow-sm">
          {room.type.charAt(0).toUpperCase() + room.type.slice(1)}
        </div>

        {/* Action buttons */}
        <div className="absolute top-3 right-3 flex space-x-2">
          {isOwner && onDeleteClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteClick(room);
              }}
              className="p-1.5 rounded-full bg-white/90 hover:bg-red-100 dark:bg-gray-800/90 dark:hover:bg-red-900/50 backdrop-blur-sm shadow-sm transition-all duration-200 transform hover:scale-110"
              title="Delete Room"
            >
              <Trash2 size={16} className="text-red-500 dark:text-red-400" />
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDetailsClick(room);
            }}
            className="p-1.5 rounded-full bg-white/90 hover:bg-gray-100 dark:bg-gray-800/90 dark:hover:bg-gray-700 backdrop-blur-sm shadow-sm transition-all duration-200 transform hover:scale-110"
            title="View Details"
          >
            <Info size={16} className="text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </div>

      {/* Card content */}
      <div className="p-4 pt-3">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white truncate">
            {room.title}
          </h3>
        </div>

        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
          <Clock size={14} className="mr-1" />
          <span>
            {new Date(room.updatedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            })}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex -space-x-2">
            <div className="relative z-10 w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <img
                src={room.owner.profilePic || `https://ui-avatars.com/api/?name=${room.owner.name}&background=random`}
                alt="Owner"
                className="w-full h-full object-cover"
              />
            </div>
            {room.collaborators?.slice(0, 3).map((collab, i) => (
              <div
                key={i}
                className={`relative z-${10 - (i + 1)} w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-700 overflow-hidden`}
                style={{ zIndex: 10 - (i + 1) }}
              >
                <img
                  src={collab.profilePic || `https://ui-avatars.com/api/?name=${collab.name}&background=random`}
                  alt="Collaborator"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}

            {room.collaborators?.length > 3 && (
              <div className="relative z-0 w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 bg-gray-100 dark:bg-gray-600 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
                +{room.collaborators.length - 3}
              </div>
            )}
          </div>

          {room.activeSession && (<div className="flex items-center text-xs font-medium px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 rounded-full">
            <Activity size={14} className="mr-1" />
            Active
          </div>)}
        </div>
      </div>
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-400/30 dark:group-hover:border-blue-600/30 rounded-xl pointer-events-none transition-all duration-300"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6 transition-colors duration-200">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b-2 border-blue-500 dark:border-blue-700">
        <img
          src={`${process.env.PUBLIC_URL}/assets/images/Logo.png`}
          alt="Logo"
          className="h-10 mb-2"
        />

        <div className="flex items-center space-x-4 mb-2">
          <button
            onClick={() => navigate('/notification')}
            className="relative bg-yellow-400 dark:bg-yellow-600 text-white p-2 rounded-full">
            <Bell />
            {notificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-xs text-white w-5 h-5 flex items-center justify-center rounded-full">
                {notificationsCount > 99 ? '99+' : notificationsCount}
              </span>
            )}
          </button>

          <button className="bg-blue-600 dark:bg-blue-800 text-white p-2 rounded-full">
            <img
              src={profilePic || `${process.env.PUBLIC_URL}/assets/images/defaultProfilePic.png`}
              alt="Profile"
              className="w-6 h-6 rounded-full"
            />
          </button>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>

      {/* Welcome */}
      <div className="text-left mb-10">
        <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-400">Welcome, {userName}</h2>
      </div>

      {/* Recently Active Rooms */}
      <div className="mb-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold dark:text-white mb-4">Recently Active Rooms</h2>
        <div className="flex flex-wrap gap-6">
          {recentlyActiveRooms.map((room, index) => (
            <RoomCard
              key={index}
              room={room}
              onRoomClick={handleRoomClick}
              onDetailsClick={handleDetailsClick}
              onDeleteClick={(room) => {
                setShowDeleteModal(true);
                setRoomToDelete(room);
              }}
              isOwner={room.owner}
            />
          ))}
        </div>
      </div>

      {/* Recently Edited Rooms */}
      <div className="mb-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold dark:text-white mb-4">Recently Edited By You</h2>
        <div className="flex flex-wrap gap-6">
          {recentlyEditedByYou.map((room, index) => (
            <RoomCard
              key={index}
              room={room}
              onRoomClick={handleRoomClick}
              onDetailsClick={handleDetailsClick}
              onDeleteClick={(room) => {
                setShowDeleteModal(true);
                setRoomToDelete(room);
              }}
              isOwner={room.owner}
            />
          ))}
        </div>
      </div>

      {/* Created Rooms - Table Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Created Rooms Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md transition-all duration-200 hover:shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold dark:text-white">Created Rooms</h2>
            <div className="flex space-x-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  value={createdSearch}
                  onChange={(e) => setCreatedSearch(e.target.value)}
                  className="pl-8 pr-4 py-1.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white w-36 transition-all duration-200 focus:w-44 focus:ring-2 focus:ring-blue-500"
                />
                <Search className="absolute left-2 top-2.5 text-gray-400" size={16} />
              </div>
              <select
                value={createdSort}
                onChange={(e) => setCreatedSort(e.target.value)}
                className="border rounded-lg px-2 py-1.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <option value="recent">Recent</option>
                <option value="title">Name</option>
                <option value="type">Type</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {createdRooms
              .filter(room => room.title.toLowerCase().includes(createdSearch.toLowerCase()))
              .sort((a, b) => {
                if (createdSort === 'title') return a.title.localeCompare(b.title);
                if (createdSort === 'type') return a.type.localeCompare(b.type);
                return new Date(b.updatedAt) - new Date(a.updatedAt);
              })
              .map((room) => (
                <div
                  key={room._id}
                  onClick={() => handleRoomClick(room)} // Added onClick for the whole card
                  className="p-4 border rounded-lg dark:border-gray-700 hover:shadow-md transition-all duration-200 cursor-pointer group hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-800/40 transition-colors duration-200">
                        <FileText className="text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-200" size={20} />
                      </div>
                      <div>
                        <h3 className="font-medium dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                          {room.title}
                        </h3>
                        <div className="flex items-center mt-1 space-x-2">
                          <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors duration-200">
                            {room.type.charAt(0).toUpperCase() + room.type.slice(1)}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-200">
                            {new Date(room.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {room.code && (<button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyNumberToClipboard(room.code);
                        }}
                        className="p-1.5 rounded-full bg-white/90 hover:bg-gray-100 dark:bg-gray-800/90 dark:hover:bg-gray-700 backdrop-blur-sm shadow-sm transition-all duration-200 hover:scale-110 group-hover:shadow-md"
                        title="Copy Room Code"
                      >
                        <MessageSquareShare className="text-gray-600 dark:text-gray-300 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors duration-200" size={18} />
                      </button>)}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDetailsClick(room);
                        }}
                        className="p-1.5 rounded-full bg-white/90 hover:bg-gray-100 dark:bg-gray-800/90 dark:hover:bg-gray-700 backdrop-blur-sm shadow-sm transition-all duration-200 hover:scale-110 group-hover:shadow-md"
                        title="View Details"
                      >
                        <Info className="text-gray-600 dark:text-gray-300 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors duration-200" size={18} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteModal(true);
                          setRoomToDelete(room);
                        }}
                        className="p-1.5 rounded-full bg-white/90 hover:bg-red-100 dark:bg-gray-800/90 dark:hover:bg-red-900/50 backdrop-blur-sm shadow-sm transition-all duration-200 hover:scale-110 group-hover:shadow-md"
                        title="Delete Room"
                      >
                        <Trash2 size={16} className="text-red-500 dark:text-red-400 group-hover:text-red-600 dark:group-hover:text-red-300 transition-colors duration-200" />
                      </button>
                    </div>
                  </div>

                  {room.collaborators?.length > 0 && (
                    <div className="mt-3 flex items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400 mr-2 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-200">
                        Collaborators:
                      </span>
                      <div className="flex -space-x-2">
                        {room.collaborators.slice(0, 3).map((collab) => (
                          <img
                            key={collab._id}
                            src={collab.profilePic || `https://ui-avatars.com/api/?name=${collab.name}&background=random`}
                            alt="Collaborator"
                            className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 group-hover:border-blue-200 dark:group-hover:border-blue-900 transition-all duration-200 hover:z-10 hover:scale-110"
                          />
                        ))}
                        {room.collaborators.length > 3 && (
                          <div className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 bg-gray-100 dark:bg-gray-600 flex items-center justify-center text-xs group-hover:border-blue-200 dark:group-hover:border-blue-900 transition-all duration-200 hover:z-10 hover:scale-110">
                            +{room.collaborators.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* Joined Rooms Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md transition-all duration-200 hover:shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold dark:text-white">Joined Rooms</h2>
            <div className="flex space-x-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  value={joinedSearch}
                  onChange={(e) => setJoinedSearch(e.target.value)}
                  className="pl-8 pr-4 py-1.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white w-36 transition-all duration-200 focus:w-44 focus:ring-2 focus:ring-green-500"
                />
                <Search className="absolute left-2 top-2.5 text-gray-400" size={16} />
              </div>
              <select
                value={joinedSort}
                onChange={(e) => setJoinedSort(e.target.value)}
                className="border rounded-lg px-2 py-1.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <option value="recent">Recent</option>
                <option value="title">Name</option>
                <option value="type">Type</option>
                <option value="owner">Owner</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {joinedRooms
              .filter(room => room.title.toLowerCase().includes(joinedSearch.toLowerCase()))
              .sort((a, b) => {
                if (joinedSort === 'title') return a.title.localeCompare(b.title);
                if (joinedSort === 'type') return a.type.localeCompare(b.type);
                if (joinedSort === 'owner') return a.ownerName.localeCompare(b.ownerName);
                return new Date(b.updatedAt) - new Date(a.updatedAt);
              })
              .map((room) => (
                <div
                  key={room._id}
                  onClick={() => handleRoomClick(room)} // Added onClick for the whole card
                  className="p-4 border rounded-lg dark:border-gray-700 hover:shadow-md transition-all duration-200 cursor-pointer group hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-800/40 transition-colors duration-200">
                        <Users className="text-green-600 dark:text-green-400 group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors duration-200" size={20} />
                      </div>
                      <div>
                        <h3 className="font-medium dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-200">
                          {room.title}
                        </h3>
                        <div className="flex items-center mt-1 space-x-2">
                          <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors duration-200">
                            {room.type.charAt(0).toUpperCase() + room.type.slice(1)}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-200">
                            {new Date(room.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDetailsClick(room);
                        }}
                        className="p-1.5 rounded-full bg-white/90 hover:bg-gray-100 dark:bg-gray-800/90 dark:hover:bg-gray-700 backdrop-blur-sm shadow-sm transition-all duration-200 hover:scale-110 group-hover:shadow-md"
                        title="View Details"
                      >
                        <Info className="text-gray-600 dark:text-gray-300 group-hover:text-green-500 dark:group-hover:text-green-400 transition-colors duration-200" size={18} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteModal(true);
                          setRoomToDelete(room);
                        }}
                        className="p-1.5 rounded-full bg-white/90 hover:bg-orange-100 dark:bg-gray-800/90 dark:hover:bg-orange-900/50 backdrop-blur-sm shadow-sm transition-all duration-200 hover:scale-110 group-hover:shadow-md"
                        title="Leave Room"
                      >
                        <LogOut size={16} className="text-orange-500 dark:text-orange-400 group-hover:text-orange-600 dark:group-hover:text-orange-300 transition-colors duration-200" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400 mr-2 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-200">
                      Owner:
                    </span>
                    <div className="flex items-center">
                      <img
                        src={room.owner.profilePic || `https://ui-avatars.com/api/?name=${room.owner.name}&background=random`}
                        alt="Owner"
                        className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 group-hover:border-green-200 dark:group-hover:border-green-900 transition-all duration-200 hover:z-10 hover:scale-110"
                      />
                      <span className="text-sm group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-200">
                        {room.ownerName}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setShowMainModal(true)}
        className="fixed bottom-10 right-10 bg-blue-600 hover:bg-blue-700 dark:bg-blue-800 dark:hover:bg-blue-900 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
      >
        <Plus size={15} />
      </button>

      {/* Modal for Join/Create Options */}
      {showMainModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-xs relative animate-fade-in-up">
            <h3 className="text-xl font-semibold mb-6 text-center text-gray-800 dark:text-white">
              Choose an action:
            </h3>

            <div className="space-y-4">
              {/* Create Room Option */}
              <button
                onClick={() => {
                  setShowModal(true); setShowMainModal(false); setCreateRoomModal(true); setJoinRoomModal(false);
                }}
                className="flex items-center justify-center w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-lg transition-all duration-200 transform hover:-translate-y-1"
              >
                <FilePlus className="mr-2" size={18} />
                Create Room
              </button>

              {/* Join Room Option */}
              <button
                onClick={() => {
                  setShowModal(true); setShowMainModal(false); setCreateRoomModal(false); setJoinRoomModal(true);
                }}
                className="flex items-center justify-center w-full px-6 py-3 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white rounded-lg transition-all duration-200 transform hover:-translate-y-1"
              >
                <UserPlus className="mr-2" size={18} />
                Join Room
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowMainModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="text-gray-500 dark:text-gray-400" size={20} />
            </button>
          </div>
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md relative">
            <h2 className="text-xl font-semibold mb-4 text-blue-600 dark:text-blue-400">
              {showMainModal ? "Create or Join Room" : createRoomModal ? "Create Room" : "Join Room"}
            </h2>

            {/* Modal content - dark mode styles added */}
            {showMainModal && (
              <div className="space-y-1">
                <button
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded w-full mb-4 transition-colors"
                  onClick={() => {
                    setShowMainModal(false);
                    setCreateRoomModal(true);
                  }}
                >
                  Create Room
                </button>
                <button
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded w-full mb-4 transition-colors"
                  onClick={() => {
                    setShowMainModal(false);
                    setJoinRoomModal(true);
                  }}
                >
                  Join Room
                </button>
              </div>
            )}

            {createRoomModal && (
              <div>
                <input
                  type="text"
                  onChange={(e) => setRoomTitle(e.target.value)}
                  value={roomTitle}
                  placeholder="Enter Room Title"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Select Room Type:</p>
                <select
                  onChange={(e) => setRoomType(e.target.value)}
                  value={roomType}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="text">Text</option>
                  {/* <option value="code">Code</option> */}
                  <option value="canvas">Canvas</option>
                </select>
                {roomType === 'text' && (<>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">If you want to edit an existing file, upload it:</p>
                  <input
                    type="file"
                    accept=".docx,.html"
                    onChange={handleFileUpload}
                    disabled={isFileLoading}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                  /></>
                )}
                <button
                  onClick={() => handleCreateRoom()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded w-full mb-4 transition-colors"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Room'}
                </button>
                <button
                  onClick={() => { setShowModal(false); setCreateRoomModal(false); setJoinRoomModal(false); setShowMainModal(false); }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded w-full mb-4 transition-colors"
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
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />

                <button
                  onClick={() => handleJoinRoom()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded w-full mb-4 transition-colors"
                  disabled={loading}
                >
                  {loading ? 'Joining...' : 'Join Room'}
                </button>
                <button
                  onClick={() => { setShowModal(false); setJoinRoomModal(false); setCreateRoomModal(false); setShowMainModal(false); }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded w-full mb-4 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            )}

            <button
              className="absolute top-2 right-3 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
              onClick={() => { setShowModal(false); setJoinRoomModal(false); setCreateRoomModal(false); setShowMainModal(false); }}
            >
              ×
            </button>

            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/75 dark:bg-gray-700/75">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600 dark:border-blue-400">
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {(showRoomDetails && !roomDetailsLoading && roomDetails) ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md relative">
            <h2 className="text-xl font-semibold mb-4 text-blue-600 dark:text-blue-400">Room Details</h2>
            <p className="text-gray-800 dark:text-gray-200">Room Title:</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{roomDetails.title}</p>
            <p className="text-gray-800 dark:text-gray-200">Room Type:</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{roomDetails.type}</p>
            <p className="text-gray-800 dark:text-gray-200">Owner:</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{roomDetails.owner}</p>
            <p className="text-gray-800 dark:text-gray-200">Collaborators:</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              {roomDetails.collaborators && roomDetails.collaborators.length
                ? roomDetails.collaborators.join(', ')
                : 'None'}
            </p>
            <p className="text-gray-800 dark:text-gray-200">Created At:</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              {roomDetails.createdAt && new Date(roomDetails.createdAt).toLocaleString()}
            </p>
            <p className="text-gray-800 dark:text-gray-200">Last Updated:</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              {roomDetails.updatedAt && new Date(roomDetails.updatedAt).toLocaleString()}
            </p>
            <button
              className="absolute top-2 right-3 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
              onClick={() => setShowRoomDetails(false)}
            >
              ×
            </button>
          </div>
        </div>
      ) : (
        showRoomDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600 dark:border-blue-400"></div>
          </div>
        )
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md relative">
            <h2 className="text-xl font-semibold mb-4 text-red-600 dark:text-red-400">Delete Room</h2>
            <p className="text-gray-800 dark:text-gray-200">Are you sure you want to delete this room?</p>
            <p className="text-sm text-gray-500 dark:text-gray-300 mb-2">
              Type <strong className="text-gray-900 dark:text-white">{roomToDelete.title}</strong> to confirm.
            </p>

            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 mt-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded transition-colors dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteRoom(roomToDelete)}
                disabled={deleteConfirmationInput !== roomToDelete.title || deleteRoomLoading}
                className={`px-4 py-2 rounded text-white transition-colors ${deleteConfirmationInput === roomToDelete.title && !deleteRoomLoading
                  ? 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600'
                  : 'bg-red-300 dark:bg-red-400 cursor-not-allowed'
                  }`}
              >
                {deleteRoomLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {roomEditorLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600 dark:border-blue-400"></div>
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
