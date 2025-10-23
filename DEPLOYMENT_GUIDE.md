# Deploying to Render.com - Step by Step Guide

## Prerequisites
- ✅ GitHub account
- ✅ Render.com account (free, no credit card needed)
- ✅ Your code pushed to GitHub

---

## Step 1: Prepare Your Code for Deployment

### A. Create `.gitignore` file

Create `/Users/banbalagan/Projects/Application_Framework_Assignment/.gitignore`:

```
# Dependencies
node_modules/
*/node_modules/

# Build outputs
build/
dist/
.angular/

# Environment variables
.env
.env.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
```

### B. Update Package.json Files

Each implementation needs proper start scripts for production.

---

## Step 2: Push to GitHub

```bash
cd /Users/banbalagan/Projects/Application_Framework_Assignment

# Initialize git if not already
git init

# Add all files
git add .

# Commit
git commit -m "Chat application with 3 frameworks ready for deployment"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/chat-framework-comparison.git
git branch -M main
git push -u origin main
```

---

## Step 3: Deploy on Render.com

### Service 1: Shared WebSocket Server

1. Go to https://render.com/
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `chat-websocket-server`
   - **Root Directory**: `shared-server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
5. Click "Create Web Service"
6. **Save the URL**: `https://chat-websocket-server-xxxx.onrender.com`

### Service 2: Vanilla Chat

1. Click "New +" → "Web Service"
2. Select same repository
3. Configure:
   - **Name**: `vanilla-chat-app`
   - **Root Directory**: `vanilla-chat`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
4. **Environment Variables** (Add these):
   - Key: `WEBSOCKET_URL`
   - Value: `wss://chat-websocket-server-xxxx.onrender.com` (URL from Service 1)
5. Click "Create Web Service"

### Service 3: React Chat

1. Click "New +" → "Web Service"
2. Select same repository
3. Configure:
   - **Name**: `react-chat-app`
   - **Root Directory**: `react-chat`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npx serve -s build -l $PORT`
   - **Plan**: `Free`
4. **Environment Variables**:
   - Key: `REACT_APP_WEBSOCKET_URL`
   - Value: `wss://chat-websocket-server-xxxx.onrender.com`
5. Click "Create Web Service"

### Service 4: Angular Chat

1. Click "New +" → "Web Service"
2. Select same repository
3. Configure:
   - **Name**: `angular-chat-app`
   - **Root Directory**: `angular-chat`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npx http-server dist/angular-chat/browser -p $PORT`
   - **Plan**: `Free`
4. **Environment Variables**:
   - Key: `NG_APP_WEBSOCKET_URL`
   - Value: `wss://chat-websocket-server-xxxx.onrender.com`
5. Click "Create Web Service"

---

## Step 4: Update Frontend Code for Production

You need to update WebSocket connections to use environment variables:

### Vanilla: `vanilla-chat/public/app.js`
```javascript
// Change from:
const ws = new WebSocket('ws://localhost:3000');

// To:
const wsUrl = window.location.protocol === 'https:'
  ? 'wss://chat-websocket-server-xxxx.onrender.com'
  : 'ws://localhost:3000';
const ws = new WebSocket(wsUrl);
```

### React: `react-chat/src/App.js`
```javascript
// Change from:
const ws = new WebSocket('ws://localhost:3000');

// To:
const wsUrl = process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:3000';
const ws = new WebSocket(wsUrl);
```

### Angular: `angular-chat/src/app/app.ts`
```typescript
// Change from:
this.websocket = new WebSocket('ws://localhost:3000');

// To:
const wsUrl = window.location.protocol === 'https:'
  ? 'wss://chat-websocket-server-xxxx.onrender.com'
  : 'ws://localhost:3000';
this.websocket = new WebSocket(wsUrl);
```

---

## Step 5: Test Deployment

After all services show "Live":

1. Open `https://vanilla-chat-app.onrender.com`
2. Open `https://react-chat-app.onrender.com`
3. Open `https://angular-chat-app.onrender.com`

Test:
- ✅ Send message from Vanilla → appears in React and Angular
- ✅ Send from React → appears in others
- ✅ Send from Angular → appears in others
- ✅ @mentions work across all

---

## Important Notes

### Free Tier Limitations
- **Spins down after 15 minutes of inactivity**
- First request after sleep takes ~30 seconds to wake up
- 750 hours/month per service (plenty for demo)
- Only one build at a time

### Keep Services Awake (Optional)
Use a service like:
- UptimeRobot.com (free pings every 5 minutes)
- Cron-job.org (free scheduled pings)

---

## Troubleshooting

### Service Won't Start
**Check logs in Render dashboard:**
- Look for missing dependencies
- Check Node version compatibility
- Verify build command succeeded

### WebSocket Connection Fails
- Make sure using `wss://` not `ws://` for HTTPS
- Check firewall/CORS settings
- Verify shared server is running first

### Build Fails
- Check `package.json` has correct dependencies
- Verify build commands are correct
- Check Node version (Render uses Node 20 by default)

---

## Alternative: Deploy with Docker (Advanced)

If you want more control, you can use Docker:

```dockerfile
# Example Dockerfile for any service
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "start"]
```

Then deploy Docker images to Render.

---

## Your Final URLs

After deployment, update your `README.md` with:

```markdown
## Live Demo

- **Vanilla Chat**: https://vanilla-chat-app-yourname.onrender.com
- **React Chat**: https://react-chat-app-yourname.onrender.com
- **Angular Chat**: https://angular-chat-app-yourname.onrender.com

**Note**: Free tier services sleep after 15 minutes. First load may take 30 seconds.
```

---

## Submission Checklist

For your professor:

- ✅ GitHub repository URL
- ✅ Live demo URLs (all 3 apps)
- ✅ README.md with running instructions (local + cloud)
- ✅ ANALYSIS.md with framework comparison
- ✅ Screenshots of working apps
- ✅ Video demo (optional but impressive)

---

## Cost

**Everything is FREE:**
- ✅ GitHub: Free for public repos
- ✅ Render: 4 services × 750 hours = 3000 hours/month
- ✅ Your time: Priceless 😊

**Monthly cost: $0.00**

---

## Next Steps

1. Push your code to GitHub
2. Sign up on Render.com
3. Follow steps above to deploy each service
4. Test everything works
5. Update README with live URLs
6. Submit to professor!

**Estimated deployment time: 30-45 minutes**

Good luck! 🚀
