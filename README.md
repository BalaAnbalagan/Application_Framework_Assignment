# Chat Application Framework Comparison

## Project Overview
This project implements a real-time chat application using three different approaches to understand how frameworks help in web development.

## Three Implementations

### 1. Vanilla Implementation (No Framework)
- **Frontend**: Plain HTML, CSS, JavaScript
- **Backend**: Plain Node.js with WebSocket
- **Port**: 3001
- **Directory**: `vanilla-chat/`

### 2. React Implementation
- **Frontend**: React.js
- **Backend**: Express.js with WebSocket
- **Port**: 3002
- **Directory**: `react-chat/`

### 3. Angular Implementation
- **Frontend**: Angular (TypeScript)
- **Backend**: Shared WebSocket Server
- **Port**: 3003
- **Directory**: `angular-chat/`

## Special Feature: Cross-Implementation Communication
All three chat implementations connect to a **shared WebSocket server** running on port 3000. This means:
- A message sent from the Vanilla app appears in React and Angular apps
- A message sent from React app appears in Vanilla and Angular apps
- All three implementations communicate with each other in real-time!

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Vanilla Chat   │     │   React Chat    │     │  Angular Chat   │
│   (Port 3001)   │     │   (Port 3002)   │     │   (Port 3003)   │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │        WebSocket      │      WebSocket        │
         └───────────────────────┼───────────────────────┘
                                 │
                        ┌────────▼────────┐
                        │  Shared WebSocket│
                        │      Server      │
                        │   (Port 3000)    │
                        └──────────────────┘
```

## How to Run

### Prerequisites
- Node.js (v14 or higher)
- npm

### Running All Applications

1. **Start the Shared WebSocket Server** (Required first!)
```bash
cd shared-server
npm install
npm start
```

2. **Start Vanilla Chat** (in new terminal)
```bash
cd vanilla-chat
npm install
npm start
```
Open browser: http://localhost:3001

3. **Start React Chat** (in new terminal)
```bash
cd react-chat
npm install
npm start
```
Open browser: http://localhost:3002

4. **Start Angular Chat** (in new terminal)
```bash
cd angular-chat
npm install
npm start
```
Open browser: http://localhost:3003

### Testing Cross-Communication
1. Open all three apps in different browser tabs:
   - http://localhost:3001 (Vanilla)
   - http://localhost:3002 (React)
   - http://localhost:3003 (Angular)
2. Type a message in any one
3. Watch it appear in all three in real-time!
4. Notice each message shows which framework sent it

### Using @Mentions (New Feature!)
Send messages to specific framework users:
- `@angular Hello Angular users!` - Only Angular sees this
- `@react Hey React devs!` - Only React sees this
- `@vanilla Hi Vanilla users!` - Only Vanilla sees this
- `Hello everyone!` - Everyone sees this (regular message)

📣 Mentioned messages are highlighted with yellow background and special badge!
See [MENTION_FEATURE.md](MENTION_FEATURE.md) for detailed guide.

### Stopping the Servers
Press `Ctrl+C` in each terminal window to stop the servers.

## Learning Objectives
- Understand MVC architecture in different contexts
- Experience problems without frameworks (Vanilla implementation)
- See how frameworks solve those problems differently (React vs Angular)
- Learn WebSocket real-time communication
- Compare framework philosophies: React (flexible) vs Angular (opinionated)

## Documentation
See [ANALYSIS.md](ANALYSIS.md) for:
- Detailed framework comparison
- MVC architecture breakdown for each implementation
- Strengths and weaknesses analysis
- Code examples showing differences
- Recommendations for when to use each framework

## Project Structure
```
.
├── shared-server/       # WebSocket server (all implementations connect here)
├── vanilla-chat/        # No framework (pure HTML/CSS/JS)
├── react-chat/          # React.js frontend
├── angular-chat/        # Angular + TypeScript frontend
├── README.md           # This file
└── ANALYSIS.md         # Detailed analysis (required for assignment)
```

## Key Differences at a Glance

| Feature | Vanilla | React | Angular |
|---------|---------|-------|---------|
| DOM Updates | Manual | Automatic | Automatic |
| State Management | Global variables | useState hooks | Signals |
| Type Safety | None | Optional (TS) | Built-in (TS) |
| Learning Curve | Easy | Medium | Steep |
| Code Lines | ~250 | ~180 | ~190 |
| Bundle Size | 0 KB | ~40 KB | ~130 KB |
| Development Speed | Slow | Fast | Medium |

## Assignment Deliverables ✅
- ✅ Functioning code in GitHub repo
- ✅ Precise instructions for how to run (above)
- ✅ One page write-up ([ANALYSIS.md](ANALYSIS.md))
  - ✅ Framework differences and strengths/weaknesses
  - ✅ MVC architecture explanation
  - ✅ Justification for architectural decisions
