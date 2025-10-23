import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';

function App() {
  const [socket, setSocket] = useState(null);
  const [username, setUsername] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const usernameInputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    usernameInputRef.current?.focus();
  }, []);

  const joinChat = () => {
    if (!username.trim()) return;

    const socketUrl = window.location.protocol === 'https:'
      ? `wss://${window.location.hostname}:3002`
      : 'http://localhost:3002';

    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Connected to Socket.io');
      setIsConnected(true);
      newSocket.emit('join', { username: username.trim() });
    });

    newSocket.on('welcome', (data) => {
      setHasJoined(true);
    });

    newSocket.on('history', (data) => {
      setMessages(data.messages);
    });

    newSocket.on('message', (data) => {
      setMessages(prev => [...prev, { ...data, type: 'message' }]);
    });

    newSocket.on('system', (data) => {
      setMessages(prev => [...prev, { ...data, type: 'system' }]);
    });

    newSocket.on('user_list', (data) => {
      setOnlineUsers(data.users);
    });

    newSocket.on('typing_indicator', (data) => {
      setTypingUsers(data.typingUsers);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(newSocket);
  };

  const sendMessage = () => {
    if (!inputValue.trim() || !socket) return;

    socket.emit('message', { text: inputValue.trim() });
    setInputValue('');

    if (isTyping) {
      socket.emit('stop_typing');
      setIsTyping(false);
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);

    if (!socket || !isConnected) return;

    if (!isTyping) {
      socket.emit('typing');
      setIsTyping(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing');
      setIsTyping(false);
    }, 2000);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ========================================================================
  // @MENTION FEATURE - React Implementation
  // Much cleaner than Vanilla! Uses functional components and JSX
  // ========================================================================

  const parseMentions = (text) => {
    // Extract all @mentions
    const mentionRegex = /@(\w+)/g;
    return text.match(mentionRegex) || [];
  };

  const isMentioned = (text, currentUser) => {
    // Check if current user is mentioned
    const mentionRegex = new RegExp(`@${currentUser}\\b`, 'gi');
    return mentionRegex.test(text);
  };

  const renderMessageText = (text) => {
    // Split text by @mentions and render with highlighting
    const parts = text.split(/(@\w+)/g);

    return parts.map((part, index) => {
      if (part.match(/^@\w+$/)) {
        // This is a mention - highlight it
        return (
          <span key={index} className="mention-highlight">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const renderTypingIndicator = () => {
    const others = typingUsers.filter(u => u !== username);
    if (others.length === 0) return null;

    if (others.length === 1) {
      return `${others[0]} is typing...`;
    } else if (others.length === 2) {
      return `${others[0]} and ${others[1]} are typing...`;
    } else {
      return `${others.length} people are typing...`;
    }
  };

  if (!hasJoined) {
    return (
      <div className="modal">
        <div className="modal-content">
          <h2>⚛️ Welcome to React Chat</h2>
          <p>React.js Framework | Socket.io Protocol</p>
          <input
            ref={usernameInputRef}
            type="text"
            placeholder="Enter your name..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && joinChat()}
            maxLength={20}
          />
          <button onClick={joinChat}>Join Chat</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header>
        <h1>⚛️ React Chat</h1>
        <p className="subtitle">React.js | Express.js + Socket.io</p>
        <div className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </header>

      <div className="chat-layout">
        <aside className="sidebar">
          <h3>Online Users</h3>
          <div className="users-list">
            {onlineUsers.map((user, idx) => (
              <div
                key={idx}
                className={`user-item ${user.username === username ? 'you' : ''}`}
              >
                {user.username === username ? `${user.username} (you)` : user.username}
              </div>
            ))}
          </div>
        </aside>

        <div className="chat-container">
          <div className="messages">
            {messages.map((msg, idx) => {
              // ============================================================
              // PRIVATE MESSAGING - React Implementation
              // Check if this is a DM and whether to show mention badge
              // ============================================================
              const isDM = msg.isDirectMessage && msg.recipient;
              const mentioned = msg.type === 'message' && !isDM && isMentioned(msg.text, username) && msg.sender !== username;

              return msg.type === 'system' ? (
                <div key={idx} className="system-message">
                  {msg.message}
                </div>
              ) : (
                <div
                  key={idx}
                  className={`message ${msg.sender === username ? 'own-message' : ''} ${mentioned ? 'mentioned' : ''} ${isDM ? 'direct-message' : ''}`}
                >
                  <div className="message-header">
                    <span className="message-sender">
                      {msg.sender === username ? 'You' : msg.sender}
                    </span>
                    {isDM && (
                      <span className="dm-badge">
                        {msg.sender === username
                          ? `📩 Private to @${msg.recipient}`
                          : '📩 Private message'}
                      </span>
                    )}
                    {mentioned && (
                      <span className="mention-badge">@ mentioned you</span>
                    )}
                    <span className="message-time">{formatTime(msg.timestamp)}</span>
                  </div>
                  <div className="message-text">
                    {renderMessageText(msg.text)}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {renderTypingIndicator() && (
            <div className="typing-indicator">
              {renderTypingIndicator()}
            </div>
          )}

          <div className="input-container">
            <input
              type="text"
              placeholder="Type a message..."
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              disabled={!isConnected}
            />
            <button onClick={sendMessage} disabled={!isConnected}>
              Send
            </button>
          </div>
        </div>
      </div>

      <footer>
        <p>Backend: Express.js + Socket.io | Open multiple tabs!</p>
      </footer>
    </div>
  );
}

export default App;
