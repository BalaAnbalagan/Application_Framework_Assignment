/**
 * ANGULAR CHAT COMPONENT - EventSource + HTTP
 *
 * Frontend Framework: Angular (TypeScript)
 * Communication: Server-Sent Events (receive) + HTTP POST (send)
 *
 * KEY DIFFERENCES:
 * - TypeScript with strong typing
 * - EventSource API instead of WebSocket
 * - HTTP POST for client→server communication
 * - Component-based architecture with decorators
 * - Signals for reactive state management
 */

import { Component, OnInit, OnDestroy, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ChatMessage {
  id?: number;
  type: string;
  text?: string;
  message?: string;
  sender?: string;
  user_id?: string;
  timestamp: string;
}

interface User {
  user_id: string;
  username: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  // Signals for reactive state (Angular 17+ feature)
  username = signal('');
  hasJoined = signal(false);
  messages = signal<ChatMessage[]>([]);
  inputValue = signal('');
  isConnected = signal(false);
  onlineUsers = signal<User[]>([]);
  typingUsers = signal<string[]>([]);

  // Non-signal state
  userId = '';
  eventSource: EventSource | null = null;
  typingTimeout: any = null;
  isTyping = false;

  private readonly API_URL = 'http://localhost:3003/api';

  constructor(private http: HttpClient) {
    // Auto-scroll effect when messages change
    effect(() => {
      const msgs = this.messages();
      setTimeout(() => this.scrollToBottom(), 100);
    });
  }

  ngOnInit() {
    // Focus username input on load
    setTimeout(() => {
      const input = document.getElementById('username-input') as HTMLInputElement;
      input?.focus();
    }, 100);
  }

  ngOnDestroy() {
    this.disconnect();
  }

  joinChat() {
    const username = this.username().trim();
    if (!username) return;

    // Join via HTTP POST
    this.http.post<{user_id: string, username: string, history: ChatMessage[]}>
      (`${this.API_URL}/join`, { username })
      .subscribe({
        next: (response) => {
          this.userId = response.user_id;
          this.hasJoined.set(true);
          this.messages.set(response.history);

          // Connect to SSE stream
          this.connectEventSource();
        },
        error: (err) => {
          console.error('Failed to join:', err);
          alert('Failed to join chat. Please try again.');
        }
      });
  }

  connectEventSource() {
    // EventSource for receiving messages (Server-Sent Events)
    this.eventSource = new EventSource(`${this.API_URL}/events/${this.userId}`);

    this.eventSource.onopen = () => {
      console.log('✅ Connected to SSE stream');
      this.isConnected.set(true);
    };

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (e) {
        console.error('Failed to parse SSE message:', e);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      this.isConnected.set(false);
    };
  }

  handleMessage(data: any) {
    switch (data.type) {
      case 'message':
        this.messages.update(msgs => [...msgs, data]);
        break;

      case 'system':
        this.messages.update(msgs => [...msgs, data]);
        break;

      case 'user_list':
        this.onlineUsers.set(data.users);
        break;

      case 'typing_indicator':
        this.typingUsers.set(data.typing_users || []);
        break;
    }
  }

  sendMessage() {
    const text = this.inputValue().trim();
    if (!text) return;

    // Send via HTTP POST (not WebSocket!)
    this.http.post(`${this.API_URL}/message`, {
      user_id: this.userId,
      text: text
    }).subscribe({
      next: () => {
        this.inputValue.set('');

        // Clear typing indicator
        if (this.isTyping) {
          this.stopTyping();
        }
      },
      error: (err) => {
        console.error('Failed to send message:', err);
      }
    });
  }

  onInputChange(value: string) {
    this.inputValue.set(value);

    if (!this.isConnected()) return;

    // Don't send typing if input is empty
    if (!value.trim()) {
      if (this.isTyping) {
        this.stopTyping();
      }
      return;
    }

    // Start typing
    if (!this.isTyping) {
      this.isTyping = true;
      this.http.post(`${this.API_URL}/typing`, {
        user_id: this.userId,
        is_typing: true
      }).subscribe();
    }

    // Debounce - stop typing after 2 seconds
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    this.typingTimeout = setTimeout(() => {
      this.stopTyping();
    }, 2000);
  }

  stopTyping() {
    if (!this.isTyping) return;

    this.isTyping = false;
    this.http.post(`${this.API_URL}/typing`, {
      user_id: this.userId,
      is_typing: false
    }).subscribe();
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
  }

  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTypingIndicator(): string | null {
    const currentUsername = this.username();
    const others = this.typingUsers().filter(u => u !== currentUsername);

    if (others.length === 0) return null;
    if (others.length === 1) return `${others[0]} is typing...`;
    if (others.length === 2) return `${others[0]} and ${others[1]} are typing...`;
    return `${others.length} people are typing...`;
  }

  isOwnMessage(msg: ChatMessage): boolean {
    return msg.user_id === this.userId;
  }

  isCurrentUser(user: User): boolean {
    return user.user_id === this.userId;
  }

  private scrollToBottom() {
    const messagesContainer = document.querySelector('.messages');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  onEnterPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.sendMessage();
    }
  }

  onUsernameEnter(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.joinChat();
    }
  }
}
