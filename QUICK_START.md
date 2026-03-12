# 🚀 Quick Start Guide - Smart Approval Dashboard

## ⚡ Fastest Way to Deploy

### Option 1: Local Development (5 minutes)

```bash
# 1. Clone or navigate to project
cd smart-approval-dashboard

# 2. Install dependencies
npm install

# 3. Start servers (Windows)
deploy.bat local

# OR (Linux/Mac)
./deploy.sh local
```

**Access:** http://localhost:3000

---

### Option 2: Network Access (10 minutes)

```bash
# 1. Install dependencies
npm install

# 2. Deploy to local network
deploy.bat network

# OR (Linux/Mac)
./deploy.sh network
```

**Access:** http://YOUR_LOCAL_IP:3000

---

### Option 3: Cloud Deployment (15 minutes)

#### Vercel (Frontend only)
```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy
deploy.bat vercel
```

#### Railway (Full stack)
```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Deploy
deploy.bat railway
```

---

## 🔑 Default Login Credentials

| Role | Username | Password |
|------|----------|---------|
| Student | `student_user` | `stud123` |
| Faculty | `faculty_adv` | `fac123` |
| HOD | `hod_dept` | `hod123` |
| Dean | `dean_admin` | `dean123` |
| Admin | `admin_system` | `admin123` |

---

## 🎯 Quick Testing Checklist

### ✅ Basic Functionality
- [ ] Login with different user roles
- [ ] Create a new request (as student)
- [ ] Approve/reject requests (as faculty/HOD/dean)
- [ ] Book an appointment (as student)
- [ ] View appointments (as faculty/HOD/dean)
- [ ] Manage users (as admin)

### ✅ Advanced Features
- [ ] File upload with requests
- [ ] Multi-participant appointments
- [ ] Dean override access
- [ ] User role restrictions
- [ ] Password reset functionality

---

## 🛠️ Manual Setup (if scripts don't work)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Setup Environment
```bash
# Create .env file
echo "NODE_ENV=development" > .env
echo "PORT=5000" >> .env
echo "JWT_SECRET=your-secret-key" >> .env
echo "GEMINI_API_KEY=your-api-key" >> .env
```

### Step 3: Start Backend
```bash
npm run server
```

### Step 4: Start Frontend (new terminal)
```bash
npm run dev
```

### Step 5: Access Application
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

---

## 🌐 Network Access Setup

### Find Your Local IP
```bash
# Windows
ipconfig

# macOS/Linux
ifconfig | grep "inet "
```

### Update Configuration
```bash
# Update .env.local
echo "VITE_API_URL=http://YOUR_IP:5000" > .env.local
```

### Start Servers
```bash
npm run server
npm run dev
```

### Access from Other Devices
- Frontend: http://YOUR_IP:3000
- Backend: http://YOUR_IP:5000

---

## ☁️ Cloud Deployment

### Vercel (Recommended for Frontend)
```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Build frontend
npm run build

# 3. Deploy
vercel --prod
```

### Railway (Recommended for Full Stack)
```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Deploy
railway up
```

### DigitalOcean (VPS)
```bash
# 1. Create Ubuntu server
# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install PM2
npm install -g pm2

# 4. Deploy
git clone <your-repo>
cd smart-approval-dashboard
npm install
pm2 start server-simple.js --name "smart-approval"
```

---

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -aon | findstr :3000
taskkill /F /PID <PID>

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### CORS Errors
```bash
# Check environment variables
echo $VITE_API_URL

# Update .env.local
echo "VITE_API_URL=http://localhost:5000" > .env.local
```

### Dependencies Issues
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules
rm -rf node_modules

# Reinstall
npm install
```

---

## 📱 Mobile Access

### Local Network
1. Connect to same WiFi network
2. Use local IP address: http://YOUR_IP:3000
3. Test with mobile browser

### Cloud Deployment
1. Deploy to Vercel/Railway
2. Use provided URL
3. Works on any device with internet

---

## 🎉 Success!

Your Smart Approval Dashboard is now running! 

### Next Steps:
1. **Test all features** with different user roles
2. **Customize** the application for your needs
3. **Deploy to production** when ready
4. **Monitor** performance and usage

### Need Help?
- Check the full [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- Review the [troubleshooting section](#-troubleshooting)
- Check application logs for errors

---

**Happy Deploying! 🚀**
