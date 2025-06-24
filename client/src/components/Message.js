import React, { useState, useEffect, useRef } from 'react';

const Message = ({ darkMode, yChatArray, username = 'Anonymous' }) => {
  const [messages, setMessages] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const messagesListRef = useRef(null);

  // Theme toggle
  const [isDarkMode, setIsDarkMode] = useState(false);
  useEffect(() => {
    setIsDarkMode(darkMode);
  }, [darkMode]);

  // Listen to Yjs updates
  useEffect(() => {
    if (!yChatArray) return;

    const handleUpdate = (event) => {
      const addedMessages = [];
      event.changes.added.forEach((item) => {
        const content = item.content.getContent();
        addedMessages.push(...content);
      });
      if (addedMessages.length > 0) {
        setMessages((prev) => [...prev, ...addedMessages]);
      }
    };

    yChatArray.observe(handleUpdate);

    // Initial load
    setMessages(yChatArray.toArray());

    return () => {
      yChatArray.unobserve(handleUpdate);
    };
  }, [yChatArray]);

  // Auto scroll
  useEffect(() => {
    if (messagesListRef.current) {
      messagesListRef.current.scrollTop = messagesListRef.current.scrollHeight;
    }
  }, [messages, isExpanded]);

  const handleSendMessage = () => {
    const trimmedMessage = messageInput.trim();
    if (!trimmedMessage || !yChatArray) return;

    const now = new Date();
    const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    yChatArray.push([
      {
        sender: username,
        timestamp,
        content: trimmedMessage,
        type: 'sent', // Optional: you could omit this and determine locally
      },
    ]);

    setMessageInput('');
  };

  const toggleMessageBar = () => {
    setIsExpanded((prev) => !prev);
  };

  // Keyboard toggle
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowUp' && !isExpanded) {
        event.preventDefault();
        toggleMessageBar();
      } else if (event.key === 'Escape' && isExpanded) {
        toggleMessageBar();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  return (
    <div className={`${isDarkMode ? 'dark' : ''}`}>
      <div className={`w-full max-w-md mx-auto mt-8 border rounded-lg shadow-lg bg-white ${isDarkMode ? 'dark:bg-gray-800 dark:border-gray-700' : ''}`}>
        {/* Toggle Header */}
        <button
          className="w-full flex items-center justify-between px-4 py-2 bg-blue-600 text-white font-semibold rounded-t-lg"
          onClick={toggleMessageBar}
        >
          <span>Room Message</span>
          <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>&#9650;</span>
        </button>

        {/* Chat Content */}
        <div className={`transition-all duration-300 ${isExpanded ? 'max-h-[500px]' : 'max-h-0'} overflow-hidden`}>
          <div className="h-64 overflow-y-auto px-4 py-2 space-y-4" ref={messagesListRef}>
            {messages.map((msg, index) => {
              const isOwnMessage = msg.sender === username;
              return (
                <div key={index} className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                  <div className={`text-xs text-gray-500 ${isDarkMode ? 'dark:text-gray-400' : ''} mb-1`}>
                    {`${msg.sender} - ${msg.timestamp}`}
                  </div>
                  <div
                    className={`px-4 py-2 rounded-lg max-w-xs break-words ${
                      isOwnMessage
                        ? 'bg-blue-500 text-white'
                        : `bg-gray-200 text-gray-900 ${isDarkMode ? 'dark:bg-gray-700 dark:text-gray-100' : ''}`
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input Bar */}
          <div className={`flex items-center border-t px-4 py-2 bg-gray-100 ${isDarkMode ? 'dark:bg-gray-700 dark:border-gray-600' : ''}`}>
            <input
              type="text"
              placeholder="Type a message..."
              className={`flex-1 rounded-full px-4 py-2 text-sm text-gray-900 ${isDarkMode ? 'dark:text-white dark:bg-gray-800' : ''} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <button
              onClick={handleSendMessage}
              className={`ml-2 p-2 text-blue-600 ${isDarkMode ? 'dark:text-blue-400 dark:hover:text-blue-300' : 'hover:text-blue-800'} transition-colors`}
              aria-label="Send Message"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Message;
