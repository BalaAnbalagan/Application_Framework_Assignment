/**
 * VANILLA CHAT - COMPLETE FRONTEND
 *
 * Features:
 * - Username entry modal
 * - Real-time chat with WebSocket
 * - Online users list
 * - Typing indicators
 * - Message history
 *
 * Backend: Plain Node.js + Raw WebSocket (server.js)
 * Protocol: WebSocket (ws://)
 */

// ============================================================================
// GLOBAL STATE - Manual state management (Framework would handle this)
// ============================================================================
let websocket = null;
let username = null;
let isConnected = false;
let typingTimeout = null;
let isTyping = false;
let onlineUsers = []; // Store online users for autocomplete

// ============================================================================
// DOM REFERENCES - Manual element selection (Framework would handle this)
// ============================================================================
const usernameModal = document.getElementById('username-modal');
const usernameInput = document.getElementById('username-input');
const joinButton = document.getElementById('join-button');
const chatApp = document.getElementById('chat-app');
const connectionStatus = document.getElementById('connection-status');
const usersList = document.getElementById('users-list');
const messagesContainer = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const typingIndicator = document.getElementById('typing-indicator');
const typingText = document.getElementById('typing-text');

// ============================================================================
// INITIALIZATION - Username Modal
// ============================================================================

// Focus username input on load
usernameInput.focus();

// Join button click
joinButton.addEventListener('click', () => {
    const name = usernameInput.value.trim();
    if (name) {
        username = name;
        joinChat();
    }
});

// Enter key in username input
usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const name = usernameInput.value.trim();
        if (name) {
            username = name;
            joinChat();
        }
    }
});

// ============================================================================
// JOIN CHAT - Connect to WebSocket
// ============================================================================
function joinChat() {
    // Hide modal, show chat
    usernameModal.style.display = 'none';
    chatApp.style.display = 'flex';

    // Connect to WebSocket server on same host
    const wsUrl = window.location.protocol === 'https:'
        ? `wss://${window.location.host}`
        : 'ws://localhost:3001';

    websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
        console.log('✅ Connected to WebSocket server');
        isConnected = true;
        updateConnectionStatus(true);

        // Send join message
        websocket.send(JSON.stringify({
            type: 'join',
            username: username
        }));
    };

    websocket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            handleMessage(data);
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    };

    websocket.onclose = () => {
        console.log('🔴 Disconnected from server');
        isConnected = false;
        updateConnectionStatus(false);
        addSystemMessage('Disconnected from server. Refresh to reconnect.');
        messageInput.disabled = true;
        sendButton.disabled = true;
    };

    websocket.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        addSystemMessage('Connection error occurred');
    };
}

// ============================================================================
// MESSAGE HANDLERS
// ============================================================================
function handleMessage(data) {
    switch (data.type) {
        case 'welcome':
            // Server confirmed our join
            enableInput();
            break;

        case 'history':
            // Load message history
            data.messages.forEach(msg => displayChatMessage(msg));
            break;

        case 'message':
            // New chat message
            displayChatMessage(data);
            break;

        case 'system':
            // System message
            addSystemMessage(data.message);
            break;

        case 'user_list':
            // Update online users
            updateUsersList(data.users);
            break;

        case 'typing_indicator':
            // Update typing indicator
            updateTypingIndicator(data.typingUsers);
            break;
    }
}

// ============================================================================
// UI UPDATE FUNCTIONS
// ============================================================================

function updateConnectionStatus(connected) {
    if (connected) {
        connectionStatus.textContent = 'Connected';
        connectionStatus.className = 'status connected';
    } else {
        connectionStatus.textContent = 'Disconnected';
        connectionStatus.className = 'status disconnected';
    }
}

function enableInput() {
    messageInput.disabled = false;
    sendButton.disabled = false;
    messageInput.focus();
}

function updateUsersList(users) {
    // Store users globally for autocomplete
    onlineUsers = users;

    // Clear current list
    usersList.innerHTML = '';

    // Add each user
    users.forEach(user => {
        const userDiv = document.createElement('div');
        userDiv.className = 'user-item';

        // Add indicator if it's you
        if (user.username === username) {
            userDiv.classList.add('you');
            userDiv.textContent = `${user.username} (you)`;
        } else {
            userDiv.textContent = user.username;
        }

        usersList.appendChild(userDiv);
    });
}

function updateTypingIndicator(typingUsers) {
    // Filter out current user
    const others = typingUsers.filter(u => u !== username);

    if (others.length === 0) {
        typingIndicator.style.display = 'none';
    } else if (others.length === 1) {
        typingText.textContent = `${others[0]} is typing...`;
        typingIndicator.style.display = 'block';
    } else if (others.length === 2) {
        typingText.textContent = `${others[0]} and ${others[1]} are typing...`;
        typingIndicator.style.display = 'block';
    } else {
        typingText.textContent = `${others.length} people are typing...`;
        typingIndicator.style.display = 'block';
    }
}

// ============================================================================
// MESSAGE DISPLAY - Manual DOM Manipulation (Framework would handle this)
// ============================================================================

function addSystemMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'system-message';
    messageDiv.textContent = text;
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

function displayChatMessage(data) {
    // ========================================================================
    // @MENTION FEATURE + PRIVATE MESSAGES - Vanilla Implementation
    // Detect @username mentions and handle private messages
    // ========================================================================

    // Check if this is a direct message
    const isDirectMessage = data.isDirectMessage || false;
    const isSender = data.sender === username;

    // Detect if current user is mentioned (for non-DM messages)
    const mentionRegex = new RegExp(`@${username}\\b`, 'gi');
    const isMentioned = mentionRegex.test(data.text);

    // Extract all mentions from message
    const allMentionsRegex = /@(\w+)/g;
    const mentions = data.text.match(allMentionsRegex) || [];

    // Create message container
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';

    // Add 'own-message' class if it's from current user
    if (isSender) {
        messageDiv.classList.add('own-message');
    }

    // Add 'direct-message' class if this is a DM
    if (isDirectMessage) {
        messageDiv.classList.add('direct-message');
    }

    // Add 'mentioned' class if current user is mentioned (non-DM)
    if (isMentioned && !isSender && !isDirectMessage) {
        messageDiv.classList.add('mentioned');
    }

    // Create message header
    const headerDiv = document.createElement('div');
    headerDiv.className = 'message-header';

    // Sender name
    const senderSpan = document.createElement('span');
    senderSpan.className = 'message-sender';
    senderSpan.textContent = isSender ? 'You' : data.sender;
    headerDiv.appendChild(senderSpan);

    // Add DM badge if this is a direct message
    if (isDirectMessage) {
        const dmBadge = document.createElement('span');
        dmBadge.className = 'dm-badge';
        if (isSender) {
            dmBadge.textContent = `📩 Private to @${data.recipient}`;
        } else {
            dmBadge.textContent = `📩 Private message`;
        }
        headerDiv.appendChild(dmBadge);
    }
    // Add mention badge if user is mentioned (non-DM)
    else if (isMentioned && !isSender) {
        const mentionBadge = document.createElement('span');
        mentionBadge.className = 'mention-badge';
        mentionBadge.textContent = '@ mentioned you';
        headerDiv.appendChild(mentionBadge);
    }

    // Timestamp
    const timeSpan = document.createElement('span');
    timeSpan.className = 'message-time';
    timeSpan.textContent = formatTime(data.timestamp);
    headerDiv.appendChild(timeSpan);

    // Create message text with highlighted mentions
    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';

    // Manually replace @mentions with highlighted spans
    // This is complex in vanilla - need to parse and create elements
    if (mentions.length > 0) {
        let highlightedText = data.text;
        mentions.forEach(mention => {
            const mentionUser = mention.substring(1); // Remove @
            const highlightSpan = `<span class="mention-highlight">${mention}</span>`;
            highlightedText = highlightedText.replace(
                new RegExp(mention, 'g'),
                highlightSpan
            );
        });
        textDiv.innerHTML = highlightedText;
    } else {
        textDiv.textContent = data.text;
    }

    // Assemble message
    messageDiv.appendChild(headerDiv);
    messageDiv.appendChild(textDiv);

    // Add to container
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ============================================================================
// SEND MESSAGE
// ============================================================================
function sendMessage() {
    const text = messageInput.value.trim();

    if (!text) return;
    if (!isConnected) {
        alert('Not connected to server!');
        return;
    }

    // Send message to server
    websocket.send(JSON.stringify({
        type: 'message',
        text: text
    }));

    // Clear input
    messageInput.value = '';
    messageInput.focus();

    // Stop typing indicator
    if (isTyping) {
        sendStopTyping();
    }
}

// ============================================================================
// TYPING INDICATORS
// ============================================================================
function sendTyping() {
    if (!isConnected || isTyping) return;

    isTyping = true;
    websocket.send(JSON.stringify({
        type: 'typing'
    }));
}

function sendStopTyping() {
    if (!isConnected || !isTyping) return;

    isTyping = false;
    websocket.send(JSON.stringify({
        type: 'stop_typing'
    }));
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

// Send button
sendButton.addEventListener('click', sendMessage);

// Enter key in message input
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Typing indicator - detect when user types
messageInput.addEventListener('input', () => {
    if (!isConnected) return;

    // Send typing indicator
    sendTyping();

    // Clear existing timeout
    if (typingTimeout) {
        clearTimeout(typingTimeout);
    }

    // Stop typing after 2 seconds of no input
    typingTimeout = setTimeout(() => {
        sendStopTyping();
    }, 2000);
});

console.log('💬 Vanilla Chat loaded');
console.log('📝 Backend: Plain Node.js + Raw WebSocket');
console.log('🎨 Frontend: Pure HTML, CSS, JavaScript');
