/**
 * CHAT MESSAGE COMPONENT (View)
 *
 * This is a REUSABLE COMPONENT - one of React's biggest advantages!
 *
 * In vanilla JavaScript, we wrote a giant function to create DOM elements.
 * In React, we write a simple component that can be reused anywhere.
 *
 * COMPONENT BENEFITS:
 * - Write once, use many times
 * - Props make it configurable
 * - Self-contained and testable
 * - Easy to understand and maintain
 */

import React from 'react';

function ChatMessage({ data }) {
  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Look how simple this is compared to vanilla's createElement hell!
  return (
    <div className="message">
      <div className="message-header">
        <span className="message-sender">{data.sender || 'Anonymous'}</span>
        <span className="message-impl">{data.implementation || 'unknown'}</span>
        {data.mentionedImplementation && (
          <span className="mention-badge">@{data.mentionedImplementation}</span>
        )}
        <span className="message-time">{formatTime(data.timestamp)}</span>
      </div>
      <div className={`message-text ${data.mentionedImplementation ? 'mention' : ''}`}>
        {data.text}
      </div>
    </div>
  );
}

export default ChatMessage;
