import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User,
    UserPlus,
    CheckCircle2,
    UserX,
    Edit3,
    PlayCircle,
    Ban,
    ArrowLeft,
    Bell
} from 'lucide-react';
import axiosInstance from '../api/axiosInstance';

function Notification() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const res = await axiosInstance.get('/user/notifications');
                console.log(res);
                setNotifications(res.data.notifications);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchNotifications();
    }, []);

    const getIconByType = (type) => {
        switch (type) {
            case 'COLLAB_REQUEST':
                return <UserPlus className="text-yellow-500" />;
            case 'COLLAB_ACCEPTED':
                return <CheckCircle2 className="text-green-500" />;
            case 'COLLAB_REMOVED':
                return <UserX className="text-red-500" />;
            case 'DOC_EDITED':
                return <Edit3 className="text-blue-500" />;
            case 'SESSION_STARTED':
                return <PlayCircle className="text-indigo-500" />;
            case 'SESSION_ENDED':
                return <Ban className="text-gray-500" />;
            default:
                return <Bell />;
        }
    };

    const typeMessage = (type) => {
        switch (type) {
            case 'COLLAB_REQUEST':
                return 'sent you a collaboration request';
            case 'COLLAB_ACCEPTED':
                return 'accepted your collaboration request';
            case 'COLLAB_REMOVED':
                return 'removed you from a document';
            case 'DOC_EDITED':
                return 'edited a document';
            case 'SESSION_STARTED':
                return 'started a session';
            case 'SESSION_ENDED':
                return 'ended a session';
            default:
                return 'sent you a notification';
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b-2 border-blue-500">
                <div className="flex items-center mb-2 space-x-4">
                    <button onClick={() => navigate('/home')} className="text-blue-600 hover:text-blue-800">
                        <ArrowLeft />
                    </button>
                    <img src="/assets/Images/Logo.png" alt="Logo" className="h-10" />
                </div>
                <div className="flex items-center space-x-4 mb-2">
                    <button className="relative bg-yellow-400 text-white p-2 rounded-full">
                        <Bell />
                    </button>
                    <button className="bg-blue-600 text-white p-2 rounded-full">
                        <User className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-blue-700 mb-6">Your Notifications</h2>

            {/* Notifications */}
            {loading ? (
                <div className="text-center text-blue-600">Loading notifications...</div>
            ) : notifications.length === 0 ? (
                <div className="text-center text-gray-500">No notifications yet.</div>
            ) : (
                <div className="space-y-4">
                    {notifications.map((notif) => (
                        <div
                            key={notif._id}
                            className={`bg-white p-4 rounded-lg ${!notif.isRead && `border-l-4 border-blue-500`} shadow-md flex space-x-4 hover:shadow-lg transition`}
                        >
                            <div className="mt-1">{getIconByType(notif.type)}</div>

                            <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                    {notif.sender?.profilePic ? (
                                        <img
                                            src={notif.sender.profilePic}
                                            alt={notif.sender.name}
                                            className="w-8 h-8 rounded-full object-cover"
                                        />
                                    ) : (
                                        <User className="w-8 h-8 text-gray-400" />
                                    )}
                                    <span className="font-semibold text-gray-800">
                                        {notif.sender?.name || 'Someone'} {typeMessage(notif.type)}
                                    </span>
                                </div>
                                {notif.document && (
                                    <div className="text-sm text-blue-600 mt-1">Document: {notif.document.title}</div>
                                )}
                                <div className="text-xs text-gray-500 mt-1">
                                    {new Date(notif.createdAt).toLocaleString()}
                                </div>
                                {notif.message && <div className="text-sm text-gray-600 mt-1">{notif.message}</div>}
                            </div>
                            {notif.type === 'COLLAB_REQUEST' && notif.isRead && (
                                <div className="flex gap-2">
                                    <button className="px-3 py-1 text-sm bg-green-500 h-8 text-white rounded hover:bg-green-600">
                                        Accept
                                    </button>
                                    <button className="px-3 py-1 text-sm bg-red-500 h-8 text-white rounded hover:bg-red-600">
                                        Decline
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Notification;
