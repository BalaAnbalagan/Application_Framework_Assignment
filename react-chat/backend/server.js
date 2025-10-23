/**
 * REACT CHAT BACKEND - Express.js + Socket.io
 *
 * Backend Framework: Express.js
 * Communication: Socket.io (WebSocket wrapper)
 * 
 * KEY DIFFERENCES FROM VANILLA:
 * - Express provides routing, middleware
 * - Socket.io simplifies WebSocket with auto-reconnect
 * - Better error handling and structure
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ['http://localhost:3002', 'http://localhost:3000'],
    methods: ['GET', 'POST']
  }
});

const PORT = 3002;

// ============================================================================
// EXPRESS MIDDLEWARE - Framework feature!
// ============================================================================
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ============================================================================
// MODEL - In-memory data
// ============================================================================
const users = new Map(); // socketId -> { username, isTyping }
const messageHistory = [];

// ============================================================================
// EXPRESS ROUTES - REST API endpoints
// ============================================================================
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    users: users.size,
    messages: messageHistory.length
  });
});

app.get('/api/stats', (req, res) => {
  res.json({
    onlineUsers: Array.from(users.values()).map(u => u.username),
    totalMessages: messageHistory.length
  });
});

// ============================================================================
// SOCKET.IO EVENTS - Real-time communication
// ============================================================================
io.on('connection', (socket) => {
  console.log(`🔌 New connection: ${socket.id}`);

  // Handle user join
  socket.on('join', (data) => {
    const username = data.username || 'Anonymous';
    
    users.set(socket.id, {
      username: username,
      isTyping: false,
      socketId: socket.id
    });

    console.log(`✅ ${username} joined (${socket.id})`);

    // Send welcome to user
    socket.emit('welcome', {
      socketId: socket.id,
      username: username
    });

    // Send message history
    socket.emit('history', {
      messages: messageHistory
    });

    // Broadcast user joined
    io.emit('system', {
      message: `${username} joined the chat`,
      timestamp: new Date().toISOString()
    });

    // Broadcast updated user list
    broadcastUserList();
  });

  // Handle chat message
  socket.on('message', (data) => {
    const user = users.get(socket.id);
    if (!user) return;

    // ====================================================================
    // PRIVATE MESSAGING FEATURE - React Implementation
    // Socket.io makes this MUCH easier than Vanilla!
    // ====================================================================

    // Check if message starts with @username for direct message
    const dmMatch = data.text.match(/^@\s*(\w+)[,:\s]*(.*)/);
    const isDirectMessage = !!dmMatch;
    const recipientUsername = dmMatch ? dmMatch[1] : null;

    const message = {
      text: data.text,
      sender: user.username,
      socketId: socket.id,
      timestamp: new Date().toISOString(),
      isDirectMessage: isDirectMessage,
      recipient: recipientUsername
    };

    if (isDirectMessage && recipientUsername) {
      // Find recipient by username
      const recipient = Array.from(users.values()).find(
        u => u.username.toLowerCase() === recipientUsername.toLowerCase()
      );

      if (recipient) {
        console.log(`📩 DM from ${user.username} to ${recipientUsername}`);

        // Socket.io magic: send to specific socket!
        socket.to(recipient.socketId).emit('message', message);

        // Send back to sender
        socket.emit('message', message);
      } else {
        // User not found
        socket.emit('error', {
          message: `User @${recipientUsername} not found`
        });
        console.log(`⚠️  ${user.username} tried to DM non-existent user: ${recipientUsername}`);
      }
    } else {
      // Regular broadcast message
      console.log(`💬 ${user.username}: ${data.text}`);

      // Add to history
      messageHistory.push(message);
      if (messageHistory.length > 50) {
        messageHistory.shift();
      }

      // Broadcast to all
      io.emit('message', message);
    }

    // Clear typing indicator
    if (user.isTyping) {
      user.isTyping = false;
      broadcastTypingIndicators();
    }
  });

  // Handle typing
  socket.on('typing', () => {
    const user = users.get(socket.id);
    if (user && !user.isTyping) {
      user.isTyping = true;
      broadcastTypingIndicators();
    }
  });

  // Handle stop typing
  socket.on('stop_typing', () => {
    const user = users.get(socket.id);
    if (user && user.isTyping) {
      user.isTyping = false;
      broadcastTypingIndicators();
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      console.log(`🔴 ${user.username} disconnected`);

      users.delete(socket.id);

      io.emit('system', {
        message: `${user.username} left the chat`,
        timestamp: new Date().toISOString()
      });

      broadcastUserList();
    }
  });
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function broadcastUserList() {
  const userList = Array.from(users.values()).map(user => ({
    username: user.username,
    socketId: user.socketId
  }));

  io.emit('user_list', { users: userList });
}

function broadcastTypingIndicators() {
  const typingUsers = Array.from(users.values())
    .filter(user => user.isTyping)
    .map(user => user.username);

  io.emit('typing_indicator', { typingUsers });
}

// ============================================================================
// START SERVER
// ============================================================================
server.listen(PORT, () => {
  console.log(`\n🟢 React Chat Backend (Express + Socket.io)`);
  console.log(`📡 HTTP: http://localhost:${PORT}`);
  console.log(`🔌 Socket.io: ws://localhost:${PORT}`);
  console.log(`📝 Framework: Express.js (Node.js framework)`);
  console.log(`✨ Features: Middleware, Routes, Socket.io\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  io.emit('system', { message: 'Server shutting down' });
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
