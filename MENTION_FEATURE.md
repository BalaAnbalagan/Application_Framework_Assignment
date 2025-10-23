# @Mention Feature Guide

## Overview
The chat application now supports **@mentions** to send messages to specific framework implementations!

## How to Use

### Syntax
```
@<framework> <your message>
```

### Examples

1. **Message only Angular users:**
   ```
   @angular Hey Angular users, how's TypeScript treating you?
   ```

2. **Message only React users:**
   ```
   @react React devs, check out this cool feature!
   ```

3. **Message only Vanilla users:**
   ```
   @vanilla Hello vanilla JavaScript users!
   ```

### Case Insensitive
The @mention feature is case-insensitive. These all work:
- `@Angular`
- `@ANGULAR`
- `@angular`

## How It Works

### 1. Message Routing
When you send a message with `@framework`:
- The server parses the @mention
- Only users of that framework receive the message
- The sender always sees their own message (for confirmation)

### 2. Visual Indicators
Messages with @mentions are highlighted:
- 📣 Icon before the message text
- Yellow/amber background
- Orange left border
- `@framework` badge in the message header

### 3. Regular Messages
Messages WITHOUT @mentions are sent to everyone (broadcast to all frameworks).

## Testing @Mentions

1. **Open all three implementations:**
   - http://localhost:3001 (Vanilla)
   - http://localhost:3002 (React)
   - http://localhost:3003 (Angular)

2. **From Vanilla, type:**
   ```
   @react This message is only for React users!
   ```
   - ✅ React users see it (highlighted)
   - ✅ Vanilla user sees it (sent confirmation)
   - ❌ Angular users DON'T see it

3. **From React, type:**
   ```
   Hello everyone!
   ```
   - ✅ ALL implementations see it (regular broadcast)

4. **From Angular, type:**
   ```
   @vanilla Vanilla users, try using @react to message React!
   ```
   - ✅ Vanilla users see it (highlighted)
   - ✅ Angular user sees it (sent confirmation)
   - ❌ React users DON'T see it

## Technical Implementation

### Server-Side (shared-server/server.js)
```javascript
// Parse @mention syntax
const mentionMatch = message.text.match(/^@(vanilla|react|angular)\\s+(.+)/i);

if (mentionMatch) {
  const targetImpl = mentionMatch[1].toLowerCase();
  const messageText = mentionMatch[2];

  // Send only to target implementation
  broadcastToImplementation(message, targetImpl, senderClientId);
}
```

### Client-Side
Each implementation checks for `mentionedImplementation` field:
- **Vanilla**: Manual DOM class manipulation
- **React**: Conditional className rendering
- **Angular**: Angular `[class.mention]` binding

## Why This Is Cool

### Educational Value
This feature demonstrates:
1. **Pattern Matching**: Regex for parsing user input
2. **Selective Broadcasting**: Server logic for routing messages
3. **Conditional Rendering**: Different visual styles for different message types
4. **Framework Differences**: See how each framework handles the same feature

### Real-World Application
Similar features exist in:
- Slack (@channel, @here, @username)
- Discord (@everyone, @role)
- Microsoft Teams (@team, @mention)

## Advanced Usage

### Multiple Mentions (Not Currently Supported)
Currently, you can only mention one framework per message:
- ✅ `@react Hello React users!`
- ❌ `@react @angular Hello both!` (won't work)

**Exercise for the reader:** Extend the code to support multiple mentions!

### Message History
@Mentions are not persisted - they only exist during the session.
**Exercise for the reader:** Add a database to store message history!

### Private Messages
Currently, @mentions are "semi-private" - only targeted users see them.
**Exercise for the reader:** Add true private messaging between specific clients!

## Code Comparison: Same Feature, Different Frameworks

### Vanilla JavaScript
```javascript
// Manual DOM manipulation
if (data.mentionedImplementation) {
    const mentionSpan = document.createElement('span');
    mentionSpan.className = 'mention-badge';
    mentionSpan.textContent = `@${data.mentionedImplementation}`;
    headerDiv.appendChild(mentionSpan);
    textDiv.className += ' mention';
}
```

### React
```javascript
// Declarative JSX
{data.mentionedImplementation && (
  <span className="mention-badge">@{data.mentionedImplementation}</span>
)}
<div className={`message-text ${data.mentionedImplementation ? 'mention' : ''}`}>
```

### Angular
```html
<!-- Template with directives -->
<span *ngIf="msg.mentionedImplementation" class="mention-badge">
  @{{ msg.mentionedImplementation }}
</span>
<div class="message-text" [class.mention]="msg.mentionedImplementation">
```

**Notice:** Same feature, completely different implementation approaches! This highlights framework philosophy differences.

## Try It Now!

All servers should be running. Open the three URLs and try:
1. Regular messages (everyone sees them)
2. `@angular` messages (only Angular sees)
3. `@react` messages (only React sees)
4. `@vanilla` messages (only Vanilla sees)

Have fun experimenting! 🎉
