# MongoDB Database Setup

This document provides instructions for setting up and running the MongoDB database for the Smart Approval Dashboard.

## Prerequisites

- MongoDB installed and running on your system
- Node.js and npm installed

## Setup Instructions

### 1. Install MongoDB

#### Windows:
```bash
# Download and install MongoDB Community Server from:
# https://www.mongodb.com/try/download/community
```

#### macOS (using Homebrew):
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

#### Linux (Ubuntu/Debian):
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 2. Start MongoDB Server

```bash
# Start MongoDB service
mongod

# Or run as a service
# Windows: net start MongoDB
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

### 3. Seed the Database

```bash
# Run the seeding script to populate initial data
npm run seed
```

This will create:
- 5 users with different roles (student, faculty, HOD, dean, admin)
- 2 sample requests

### 4. Start the Backend Server

```bash
# Start the Express.js API server
npm run server

# Or for development with auto-restart
npm run server:dev
```

The API server will run on `http://localhost:5000`

### 5. Start the Frontend

```bash
# In a new terminal, start the React development server
npm run dev
```

The frontend will run on `http://localhost:3000`

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  username: String (unique),
  password: String (hashed),
  role: String (STUDENT|FACULTY|HOD|DEAN|ADMIN),
  name: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Requests Collection
```javascript
{
  _id: ObjectId,
  studentId: ObjectId (ref: User),
  studentName: String,
  title: String,
  description: String,
  currentStage: String (SUBMITTED|FACULTY_REVIEW|HOD_REVIEW|DEAN_APPROVAL|COMPLETED),
  status: String (PENDING|APPROVED|REJECTED),
  logs: [{
    date: String,
    actorName: String,
    action: String,
    comment: String (optional)
  }],
  complianceScore: Number (optional),
  complianceReason: String (optional),
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Requests
- `GET /api/requests` - Get requests for current user
- `POST /api/requests` - Create new request
- `PUT /api/requests/:id` - Update request (approve/reject)

### Health Check
- `GET /api/health` - Server health status

## Demo Credentials

After seeding, you can use these credentials:

| Username | Password | Role |
|----------|----------|------|
| student_user | stud123 | Student |
| faculty_adv | fac123 | Faculty Advisor |
| hod_dept | hod123 | Head of Department |
| dean_admin | dean123 | Dean |
| admin_system | admin123 | System Administrator |

## Environment Variables

Create a `.env` file in the root directory:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/smart-approval-dashboard

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Configuration
PORT=5000
NODE_ENV=development
```

## Troubleshooting

### MongoDB Connection Issues
1. Ensure MongoDB is running: `mongod`
2. Check if port 27017 is available
3. Verify the connection string in `.env`

### Server Issues
1. Check if port 5000 is available
2. Verify all dependencies are installed: `npm install`
3. Check the server logs for error messages

### Frontend Issues
1. Ensure the backend server is running on port 5000
2. Check the API URL in `.env.local`
3. Verify CORS is configured correctly

## Development Workflow

1. Make changes to the backend code
2. The server will automatically restart (if using `npm run server`)
3. Refresh the frontend to see changes
4. For database schema changes, you may need to re-seed: `npm run seed`

## Production Considerations

- Change the JWT secret in production
- Use environment-specific MongoDB connection strings
- Implement proper error handling and logging
- Add rate limiting and security middleware
- Use HTTPS in production
- Implement database backups
