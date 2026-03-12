# 🚀 Smart Approval Dashboard - Deployment Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Deployment](#local-deployment)
3. [Network Deployment](#network-deployment)
4. [Cloud Deployment Options](#cloud-deployment-options)
5. [Production Configuration](#production-configuration)
6. [Environment Setup](#environment-setup)
7. [Database Setup](#database-setup)
8. [Security Considerations](#security-considerations)
9. [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

### Required Software
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **Git** (for version control)
- **MongoDB** (optional - for production)

### System Requirements
- **Minimum RAM**: 2GB
- **Recommended RAM**: 4GB+
- **Storage**: 1GB free space
- **Network**: Internet connection for deployment

---

## 🏠 Local Deployment

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd smart-approval-dashboard
```

### Step 2: Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies (if separate)
cd client && npm install && cd ..
```

### Step 3: Environment Setup
```bash
# Copy environment file
cp .env.example .env

# Edit environment variables
nano .env
```

### Step 4: Start Development Servers
```bash
# Start backend server
npm run server

# In another terminal, start frontend
npm run dev
```

### Step 5: Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

---

## 🌐 Network Deployment

### Option 1: Local Network Access

#### Step 1: Configure Backend for Network Access
```javascript
// In server-simple.js, change:
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
```

#### Step 2: Update Frontend API URL
```bash
# In .env.local
VITE_API_URL=http://YOUR_LOCAL_IP:5000
```

#### Step 3: Find Your Local IP
```bash
# Windows
ipconfig

# macOS/Linux
ifconfig | grep "inet "
```

#### Step 4: Access from Other Devices
- **Frontend**: http://YOUR_LOCAL_IP:3000
- **Backend**: http://YOUR_LOCAL_IP:5000

### Option 2: Using Ngrok (Public Access)

#### Step 1: Install Ngrok
```bash
# Download from https://ngrok.com/download
# Or via npm
npm install -g ngrok
```

#### Step 2: Expose Backend
```bash
# Expose backend port
ngrok http 5000

# Expose frontend port
ngrok http 3000
```

#### Step 3: Update Environment
```bash
# Use ngrok URL in .env.local
VITE_API_URL=https://your-ngrok-url.ngrok.io
```

---

## ☁️ Cloud Deployment Options

### Option 1: Vercel (Recommended for Frontend)

#### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

#### Step 2: Deploy Frontend
```bash
# In project root
vercel

# Follow prompts to configure
```

#### Step 3: Configure Environment Variables
```bash
# Set environment variables in Vercel dashboard
vercel env add VITE_API_URL
```

### Option 2: Railway (Full Stack)

#### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

#### Step 2: Login to Railway
```bash
railway login
```

#### Step 3: Deploy
```bash
railway init
railway up
```

#### Step 4: Configure Environment
```bash
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=your-secret-key
```

### Option 3: DigitalOcean (VPS)

#### Step 1: Create Droplet
- Choose Ubuntu 22.04
- Minimum 2GB RAM
- Enable firewall

#### Step 2: Setup Server
```bash
# SSH into server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install PM2
npm install -g pm2
```

#### Step 3: Deploy Application
```bash
# Clone repository
git clone <repo-url>
cd smart-approval-dashboard

# Install dependencies
npm install

# Build frontend
npm run build

# Start with PM2
pm2 start server-simple.js --name "smart-approval"
pm2 startup
pm2 save
```

#### Step 4: Setup Nginx (Optional)
```bash
# Install Nginx
apt install nginx

# Configure Nginx
nano /etc/nginx/sites-available/smart-approval
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## ⚙️ Production Configuration

### Environment Variables
```bash
# .env (Production)
NODE_ENV=production
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-here
GEMINI_API_KEY=your-gemini-api-key

# Frontend (.env.production)
VITE_API_URL=https://your-domain.com/api
```

### Package.json Scripts
```json
{
  "scripts": {
    "start": "node server-simple.js",
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "server": "node server-simple.js"
  }
}
```

### Production Server Configuration
```javascript
// server-production.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Production configuration
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Production server running on port ${PORT}`);
});
```

---

## 🗄️ Database Setup

### Option 1: MongoDB (Production Recommended)

#### Step 1: Install MongoDB
```bash
# Ubuntu/Debian
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### Step 2: Update Server for MongoDB
```javascript
// server-mongodb.js
const mongoose = require('mongoose');

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-approval');

// User Schema
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: String,
  name: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
```

### Option 2: PostgreSQL

#### Step 1: Install PostgreSQL
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database
sudo -u postgres createdb smart_approval
```

#### Step 2: Setup with Sequelize
```bash
npm install sequelize pg pg-hstore
```

---

## 🔒 Security Considerations

### 1. Environment Security
```bash
# Secure environment file
chmod 600 .env
```

### 2. JWT Security
```javascript
// Use strong JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';

// Set reasonable expiration
const token = jwt.sign(
  { userId: user.id },
  JWT_SECRET,
  { expiresIn: '24h' }
);
```

### 3. Password Security
```javascript
// Use bcrypt for password hashing
const bcrypt = require('bcrypt');
const saltRounds = 10;

const hashedPassword = await bcrypt.hash(password, saltRounds);
```

### 4. CORS Configuration
```javascript
// Restrict CORS in production
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
```

### 5. Rate Limiting
```javascript
// Implement rate limiting
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
```

---

## 🛠️ Deployment Checklist

### Pre-Deployment Checklist
- [ ] Environment variables configured
- [ ] Database connection tested
- [ ] Security measures implemented
- [ ] Error handling added
- [ ] Logging configured
- [ ] Backup strategy planned
- [ ] SSL certificate configured
- [ ] Domain name configured
- [ ] Monitoring setup
- [ ] Performance testing completed

### Post-Deployment Checklist
- [ ] Application accessible via domain
- [ ] All user roles working correctly
- [ ] File uploads functioning
- [ ] Email notifications working
- [ ] Database backups running
- [ ] Monitoring alerts configured
- [ ] SSL certificate valid
- [ ] Performance metrics collected
- [ ] User testing completed
- [ ] Documentation updated

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>

# Or use different port
PORT=5001 npm start
```

#### 2. CORS Errors
```bash
# Check environment variables
echo $VITE_API_URL

# Update CORS configuration
app.use(cors({ origin: 'http://your-frontend-url.com' }));
```

#### 3. Database Connection Issues
```bash
# Check MongoDB status
sudo systemctl status mongod

# Check logs
sudo tail -f /var/log/mongodb/mongod.log
```

#### 4. Memory Issues
```bash
# Increase Node.js memory limit
node --max-old-space-size=4096 server-simple.js

# Or use PM2 with memory limit
pm2 start server-simple.js --max-memory-restart 1G
```

#### 5. SSL Certificate Issues
```bash
# Generate self-signed certificate (for testing)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout key.pem -out cert.pem

# Use Let's Encrypt (for production)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm start

# Check PM2 logs
pm2 logs smart-approval

# Monitor PM2 processes
pm2 monit
```

---

## 📈 Performance Optimization

### 1. Frontend Optimization
```bash
# Build for production
npm run build

# Enable compression
npm install compression
```

### 2. Backend Optimization
```bash
# Use PM2 cluster mode
pm2 start server-simple.js -i max

# Enable caching
npm install node-cache
```

### 3. Database Optimization
```bash
# Create indexes
db.users.createIndex({ username: 1 })
db.requests.createIndex({ studentId: 1 })
```

---

## 🔄 Continuous Deployment

### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Railway
        uses: railway-app/railway-action@v1
        with:
          api-token: ${{ secrets.RAILWAY_TOKEN }}
```

### Docker Deployment
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
EXPOSE 5000

CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t smart-approval .
docker run -p 5000:5000 smart-approval
```

---

## 📞 Support

### Getting Help
- **Documentation**: Check this guide first
- **Logs**: Always check application logs
- **Community**: GitHub Issues for bug reports
- **Email**: support@your-domain.com

### Monitoring
- **Uptime**: Use UptimeRobot or similar
- **Performance**: Use New Relic or DataDog
- **Errors**: Use Sentry for error tracking
- **Logs**: Use LogDNA or Papertrail

---

## 🎉 Success!

Your Smart Approval Dashboard is now deployed! 🚀

### Next Steps
1. **Test thoroughly** with real users
2. **Monitor performance** regularly
3. **Update dependencies** periodically
4. **Backup data** regularly
5. **Scale as needed** based on usage

### Quick Access Links
- **Application**: https://your-domain.com
- **Admin Panel**: https://your-domain.com/admin
- **API Documentation**: https://your-domain.com/api/docs

---

**Happy Deploying! 🎯**
