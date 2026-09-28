# Kharcha - Personal Expense Tracker

Kharcha is a mobile-first, installable (PWA) personal expense tracker built with the MERN stack (MongoDB, Express, React, Node.js). 

## Features
- Mobile-first responsive design (best viewed on mobile phones).
- JWT-based authentication.
- Real-time balance and expense tracking with transaction history.
- Set monthly targets and get visual alerts when exceeded.
- Custom categories with icons and colors.
- PWA support (installable to home screen).

**Note:** For security, forgotten passwords cannot be reset unless you are logged in. There is no phone-based or email-based OTP reset in this version. Keep your password safe.

## Prerequisites
- Node.js installed (v16+)
- MongoDB Atlas account (or local MongoDB)

### MongoDB Setup
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign in.
2. Create a new cluster (free tier is fine).
3. Under Database Access, create a database user (e.g., `db_user`) and a secure password.
4. Under Network Access, click "Add IP Address" and select "Allow Access from Anywhere" (`0.0.0.0/0`) or add your specific IP.
5. In the Clusters view, click "Connect", choose "Connect your application", and copy the connection string.

## Local Development Setup

1. **Clone and Install:**
   ```bash
   cd KharchaPani
   
   # Install server dependencies
   cd server
   npm install
   
   # Install client dependencies
   cd ../client
   npm install
   ```

2. **Environment Variables:**
   - In `server/.env`, set:
     ```env
     PORT=5000
     MONGODB_URI="your_mongodb_connection_string"
     JWT_SECRET="your_secret_key"
     CLIENT_ORIGIN="http://localhost:5173"
     ```
   - In `client/.env` (if required):
     ```env
     VITE_API_URL="http://localhost:5000/api"
     ```

3. **Running the Apps:**
   - **Server:** `cd server && npm run dev` (Runs on http://localhost:5000)
   - **Client:** `cd client && npm run dev` (Runs on http://localhost:5173)

### Testing on a Mobile Phone (Same Wi-Fi)
1. Find your laptop's local IP address (e.g., `192.168.1.5`).
2. Run Vite exposing the host: `npm run dev -- --host` (this is configured in our setup).
3. On your phone browser, navigate to `http://<your-laptop-ip>:5173`.
4. Ensure your server's CORS settings (`CLIENT_ORIGIN`) allow this IP, or set it to `*` for local testing.

## Deployment (Single Service on Render/Railway)

To deploy the entire app as a single service:
1. Copy the `client/dist` build folder to the `server/public` directory after building.
2. In `server/src/index.js`, add static file serving:
   ```javascript
   const path = require('path');
   app.use(express.static(path.join(__dirname, '../../client/dist')));
   app.get('*', (req, res) => {
     res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
   });
   ```
3. Update `package.json` in the root (or server) to install both and build the React app before starting Node.
4. Set the `MONGODB_URI` and `JWT_SECRET` in your hosting provider's dashboard.

## Add to Home Screen (PWA)
Once deployed on HTTPS, visit the URL on your mobile browser. Tap the browser menu (e.g., Share on Safari, or 3 dots on Chrome) and select **Add to Home Screen**. Kharcha will now act like a native app.
