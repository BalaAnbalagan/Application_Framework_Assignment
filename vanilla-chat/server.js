/**
 * VANILLA CHAT - STANDALONE SERVER
 *
 * This is a COMPLETE backend with:
 * - HTTP server (Express for serving static files)
 * - WebSocket server (for real-time chat)
 * - User management (usernames, online users)
 * - Typing indicators (real-time)
 *
 * BACKEND FRAMEWORK: Minimal (just Express for static files)
 * This shows what it's like WITHOUT a backend framework!
 *
 * MVC:
 * - MODEL: Users map, messages (in-memory)
 * - CONTROLLER: WebSocket event handlers
 * - VIEW: JSON responses
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = 3001;

// ============================================================================
// MODEL - In-memory data storage
// ============================================================================
const users = new Map(); // clientId -> { ws, username, isTyping }
const messageHistory = []; // Store last 50 messages

// ============================================================================
// HTTP ROUTES (Minimal - no framework features)
// ============================================================================
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================================================
// WEBSOCKET CONTROLLER - Handle real-time communication
// ============================================================================
wss.on('connection', (ws) => {
  let clientId = null;
  let username = null;

  console.log('🔌 New client connected');

  // Handle incoming messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'join':
          handleJoin(ws, message);
          break;

        case 'message':
          handleMessage(message);
          break;

        case 'typing':
          handleTyping(message);
          break;

        case 'stop_typing':
          handleStopTyping(message);
          break;
      }
    } catch (error) {
      console.error('❌ Error parsing message:', error);
    }
  });

  // Handle join
  function handleJoin(ws, message) {
    clientId = generateId();
    username = message.username || 'Anonymous';

    users.set(clientId, {
      ws: ws,
      username: username,
      isTyping: false
    });

    console.log(`✅ ${username} joined (${clientId})`);

    // Send welcome to user
    ws.send(JSON.stringify({
      type: 'welcome',
      clientId: clientId,
      username: username
    }));

    // Send message history
    ws.send(JSON.stringify({
      type: 'history',
      messages: messageHistory
    }));

    // Broadcast user joined
    broadcast({
      type: 'system',
      message: `${username} joined the chat`,
      timestamp: new Date().toISOString()
    });

    // Send updated user list to everyone
    broadcastUserList();
  }

  // Handle chat message
  function handleMessage(message) {
    if (!clientId || !username) return;

    const chatMessage = {
      type: 'message',
      text: message.text,
      sender: username,
      clientId: clientId,
      timestamp: new Date().toISOString()
    };

    // Add to history (keep last 50)
    messageHistory.push(chatMessage);
    if (messageHistory.length > 50) {
      messageHistory.shift();
    }

    console.log(`💬 ${username}: ${message.text}`);

    // Broadcast to all users
    broadcast(chatMessage);

    // Clear typing indicator
    const user = users.get(clientId);
    if (user && user.isTyping) {
      user.isTyping = false;
      broadcastTypingIndicators();
    }
  }

  // Handle typing indicator
  function handleTyping(message) {
    if (!clientId || !username) return;

    const user = users.get(clientId);
    if (user && !user.isTyping) {
      user.isTyping = true;
      broadcastTypingIndicators();
    }
  }

  // Handle stop typing
  function handleStopTyping(message) {
    if (!clientId || !username) return;

    const user = users.get(clientId);
    if (user && user.isTyping) {
      user.isTyping = false;
      broadcastTypingIndicators();
    }
  }

  // Handle disconnection
  ws.on('close', () => {
    if (clientId && username) {
      console.log(`🔴 ${username} disconnected`);

      users.delete(clientId);

      broadcast({
        type: 'system',
        message: `${username} left the chat`,
        timestamp: new Date().toISOString()
      });

      broadcastUserList();
    }
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
});

// ============================================================================
// HELPER FUNCTIONS (Business Logic)
// ============================================================================

function broadcast(message, excludeClientId = null) {
  const messageString = JSON.stringify(message);

  users.forEach((user, clientId) => {
    if (excludeClientId && clientId === excludeClientId) return;

    if (user.ws.readyState === WebSocket.OPEN) {
      user.ws.send(messageString);
    }
  });
}

function broadcastUserList() {
  const userList = Array.from(users.entries()).map(([id, user]) => ({
    clientId: id,
    username: user.username
  }));

  broadcast({
    type: 'user_list',
    users: userList
  });
}

function broadcastTypingIndicators() {
  const typingUsers = Array.from(users.entries())
    .filter(([id, user]) => user.isTyping)
    .map(([id, user]) => user.username);

  broadcast({
    type: 'typing_indicator',
    typingUsers: typingUsers
  });
}

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

// ============================================================================
// START SERVER
// ============================================================================
server.listen(PORT, () => {
  console.log(`\n🟢 Vanilla Chat Server`);
  console.log(`📡 HTTP: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
  console.log(`📝 Framework: NONE (Pure Node.js + Express for static files)`);
  console.log(`✨ Features: Users, Typing Indicators, Message History\n`);
});
