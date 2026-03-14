import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Email Transporter setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: (process.env.SMTP_PASS || '').replace(/\s+/g, ''),
  },
  tls: {
    rejectUnauthorized: false
  }
});

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Request Logging Middleware for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// In-memory security caches (Not persistent)
const otps = new Map();
const resetTokens = new Map(); // token -> { userId, expires }

// MongoDB connection
export const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-approval-dashboard';
    await mongoose.connect(uri, {
      dbName: 'smart-approval-dashboard',
      serverSelectionTimeoutMS: 5000,
    });
    console.log('MongoDB Connected successfully to:', mongoose.connection.host);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
  }
};

// ─── Mongoose Schemas & Models ──────────────────────────────────────────────
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['STUDENT', 'FACULTY', 'HOD', 'STUDENT_AFFAIRS', 'ADMIN'] },
  name: { type: String, required: true }
}, { timestamps: true });

// Case-insensitive lookup helper
UserSchema.statics.findByUsername = function(username) {
  return this.findOne({ username: new RegExp(`^${username}$`, 'i') });
};

// Professional Security: Password Hashing Middleware
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model('User', UserSchema);

const ActivityLogSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  type: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  details: mongoose.Schema.Types.Mixed
});

const ActivityLog = mongoose.model('ActivityLog', ActivityLogSchema);

const RequestSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  studentName: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  requestType: { type: String, required: true },
  priority: { type: String },
  studentIdNumber: { type: String },
  currentStage: { type: String, required: true },
  status: { type: String, default: 'PENDING' },
  documents: Array,
  logs: Array,
  // Other dynamic fields from the form
  studentRegistrationNumber: String,
  email: String,
  phone: String,
  mailIdReason: String,
  additionalNotes: String,
  eventType: String,
  eventId: String,
  eventStatusImageUrl: String,
  fromDate: String,
  fromTime: String,
  toDate: String,
  toTime: String,
  enteredMailId: String,
  selectedFacultyId: String
}, { timestamps: true });

const Request = mongoose.model('Request', RequestSchema);

const AppointmentSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  studentName: { type: String, required: true },
  facultyId: String,
  facultyName: String,
  hodId: String,
  hodName: String,
  deanId: String,
  deanName: String,
  date: { type: String, required: true },
  time: { type: String, required: true },
  duration: String,
  purpose: { type: String, required: true },
  status: { type: String, default: 'PENDING' },
  meetingType: String,
  location: String,
  videoLink: String,
  createdAt: { type: Date, default: Date.now }
});

const Appointment = mongoose.model('Appointment', AppointmentSchema);

// Log activity helper (Updated for MongoDB)
const logActivity = async (userId, type, details) => {
  try {
    const newLog = new ActivityLog({ userId, type, details });
    await newLog.save();
    return newLog;
  } catch (err) {
    console.error('Log failed:', err);
  }
};
// ──────────────────────────────────────────────────────────────────────────────

// Seed initial data if DB is empty
export const seedUsers = async () => {
  try {
    const count = await User.countDocuments();
    if (count === 0) {
      console.log('Database empty. Seeding default users...');
      const defaults = [
        { username: 'student@smartapproval.com', password: 'stud123', role: 'STUDENT', name: 'Alice Student' },
        { username: 'faculty@smartapproval.com',  password: 'fac123',  role: 'FACULTY', name: 'Dr. Smith (Advisor)' },
        { username: 'hod@smartapproval.com',     password: 'hod123',  role: 'HOD',     name: 'Prof. Jones (HOD)' },
        { username: 'affairs@smartapproval.com',     password: 'aff123',  role: 'STUDENT_AFFAIRS', name: 'Student Affairs' },
        { username: 'admin@smartapproval.com', password: 'admin123',role: 'ADMIN',   name: 'System Admin' }
      ];
      await User.insertMany(defaults);
      console.log('✅ Default users seeded successfully');
    }
  } catch (err) {
    console.error('Seed failed:', err.message);
  }
};

// Start server helper
export const startServer = async () => {
  await connectDB();
  await seedUsers();
  
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Local: http://localhost:${PORT}`);
    });
  }
};

// File upload configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png'];
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, TXT, JPG, JPEG, PNG files are allowed.'));
    }
  }
});

// Role limits configuration (Used during registration)
const ROLE_LIMITS = {
  'STUDENT': Infinity,
  'FACULTY': 5,
  'HOD': 3,
  'STUDENT_AFFAIRS': 2,
  'ADMIN': 1
};

// Requests (REPLACED BY MONGODB)

// Helper functions
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '24h' });
};

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret', async (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.userId = decoded.userId;
    next();
  });
};

const comparePassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

// Routes

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    res.json({ 
      status: 'OK', 
      db: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
      users: userCount,
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    res.status(500).json({ status: 'Error', message: error.message });
  }
});

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Professional Security: Bcrypt comparison
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate OTP for login (Professional Expansion)
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes
    otps.set(user._id.toString(), { code: otpCode, expires });

    const mailOptions = {
      from: `"Smart Approval System" <${process.env.SMTP_USER}>`,
      to: user.username,
      subject: 'Security Code - Smart Approval Dashboard',
      html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 25px;">
          <h2 style="color: #2563eb; margin: 0; font-size: 24px;">Smart Approval</h2>
          <p style="color: #64748b; margin: 5px 0 0; font-size: 14px;">Identity Verification</p>
        </div>
        <p style="color: #1e293b; font-size: 16px;">Hello <strong>${user.name}</strong>,</p>
        <p style="color: #475569; line-height: 1.6;">You requested a login to the Smart Approval Dashboard. Use the verification code below to complete your sign-in:</p>
        <div style="background: #f1f5f9; padding: 30px; text-align: center; border-radius: 10px; margin: 25px 0;">
          <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0f172a;">${otpCode}</span>
        </div>
        <p style="font-size: 14px; color: #64748b; line-height: 1.5;">This code is valid for <strong>10 minutes</strong>. If you didn't attempt to log in, please ignore this email or contact support.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #f1f5f9; text-align: center;">
          <p style="font-size: 12px; color: #94a3b8; margin: 0;">&copy; 2026 Smart Approval Systems. All rights reserved.</p>
        </div>
      </div>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Failed to send OTP email:', error.message);
      } else {
        console.log('OTP sent successfully');
      }
    });

    logActivity(user._id.toString(), 'AUTH_LOGIN_ATTEMPT', { status: 'OTP_SENT', username: user.username });

    res.json({
      message: 'OTP sent to your email',
      requiresOtp: true,
      userId: user._id.toString()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { userId, code } = req.body;
    const otpData = otps.get(userId);

    if (!otpData) {
      return res.status(400).json({ message: 'No active session. Please login again.' });
    }

    if (Date.now() > otpData.expires) {
      otps.delete(userId);
      return res.status(400).json({ message: 'Verification code expired.' });
    }

    if (otpData.code !== code) {
      return res.status(401).json({ message: 'Invalid verification code.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    otps.delete(userId);

    const token = generateToken(user._id.toString());
    logActivity(user._id.toString(), 'AUTH_LOGIN_SUCCESS', { method: 'OTP' });

    res.json({
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        role: user.role,
        name: user.name
      }
    });
  } catch (error) {
    console.error('OTP Verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, role, name } = req.body;

    if (!username || !password || !role || !name) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if role is valid
    if (!['STUDENT', 'FACULTY', 'HOD', 'STUDENT_AFFAIRS', 'ADMIN'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    // Check role limits
    const currentCount = await User.countDocuments({ role });
    const limit = ROLE_LIMITS[role];

    if (currentCount >= limit) {
      return res.status(400).json({
        message: `Cannot create more ${role.toLowerCase()} accounts. Maximum limit: ${limit}`
      });
    }

    const existingUser = await User.findOne({ username: new RegExp(`^${username}$`, 'i') });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const user = new User({ username, password, role, name });
    await user.save();

    const token = generateToken(user._id.toString());

    res.status(201).json({
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        role: user.role,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// NEW: Forgot Password Route
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ message: 'Username/Email is required' });
    }

    const user = await User.findByUsername(username);

    if (!user) {
      console.log(`Password reset attempt for non-existent user: ${username}`);
      await logActivity('SYSTEM', 'AUTH_RESET_FAILED', { info: 'User not found', attemptedIdentifier: username });
      return res.status(404).json({ message: `Identifier "${username}" not found in system.` });
    }

    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    resetTokens.set(token, { userId: user._id.toString(), expires: Date.now() + 3600000 }); // 1 hour

    const mailOptions = {
      from: `"Smart Approval System" <${process.env.SMTP_USER}>`,
      to: user.username,
      subject: 'Password Recovery Token - Smart Approval Dashboard',
      html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #f1f5f9; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
        <div style="text-align: center; margin-bottom: 25px;">
          <h2 style="color: #2563eb; margin: 0; font-size: 24px;">Security Portal</h2>
          <p style="color: #64748b; margin: 5px 0 0; font-size: 14px;">Password Recovery System</p>
        </div>
        <p style="color: #1e293b; font-size: 16px;">Hello <strong>${user.name}</strong>,</p>
        <p style="color: #475569; line-height: 1.6;">A request was made to access your account via password recovery. Use the secure token below to establish a new password:</p>
        <div style="background: #f1f5f9; padding: 20px; text-align: center; border-radius: 12px; margin: 25px 0; border: 1px dashed #cbd5e1;">
          <span style="font-family: monospace; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: 2px;">${token}</span>
        </div>
        <p style="font-size: 14px; color: #64748b; line-height: 1.5;">This token is valid for <strong>1 hour</strong>. If you did not initiate this request, please ignore this email or notify the system administrator immediately.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #f1f5f9; text-align: center;">
          <p style="font-size: 11px; color: #94a3b8; margin: 0;">This is an automated security notification. Do not reply.</p>
        </div>
      </div>`
    };

    await transporter.sendMail(mailOptions);
    await logActivity(user._id.toString(), 'AUTH_RESET_REQUESTED', { username: user.username });

    res.json({ message: 'Recovery token successfully dispatched to your email.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Internal security gateway error. Please try again later.' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const resetData = resetTokens.get(token);

    if (!resetData || Date.now() > resetData.expires) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const user = await User.findById(resetData.userId);
    if (!user) {
      return res.status(404).json({ message: 'User no longer exists' });
    }

    // Update password
    user.password = newPassword;
    await user.save();
    resetTokens.delete(token);

    await logActivity(resetData.userId, 'AUTH_RESET_SUCCESS', {});

    res.json({ message: 'Password reset successful. You can now login.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/approvers', authenticateToken, async (req, res) => {
  try {
    const approvers = await User.find({
      role: { $in: ['FACULTY', 'HOD'] }
    }).select('-password');
    res.json(approvers);
  } catch (error) {
    console.error('Get approvers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin-only endpoint to get activity logs
app.get('/api/logs', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    const logs = await ActivityLog.find().sort({ timestamp: -1 }).limit(1000);
    res.json(logs);
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin-only endpoint to get all users
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Return users without passwords
    const allUsers = await User.find().select('-password');
    res.json(allUsers);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin-only endpoint to create user
app.post('/api/users', authenticateToken, async (req, res) => {
  try {
    const adminUser = await User.findById(req.userId);
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { name, username, role, password } = req.body;

    if (!name || !username || !role || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Role validation
    if (!['STUDENT', 'FACULTY', 'HOD', 'STUDENT_AFFAIRS', 'ADMIN'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    // Role limits check
    const currentCount = await User.countDocuments({ role });
    const limit = ROLE_LIMITS[role];
    if (currentCount >= limit) {
      return res.status(400).json({ message: `Limit reached for ${role}` });
    }

    const existingUser = await User.findOne({ username: new RegExp(`^${username}$`, 'i') });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const newUser = new User({ name, username, role, password });
    await newUser.save();

    res.status(201).json({ id: newUser._id.toString(), name: newUser.name, username: newUser.username, role: newUser.role });
  } catch (error) {
    console.error('Admin Create user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Appointment endpoints
app.get('/api/appointments', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    let query = {};
    switch (user.role) {
      case 'STUDENT': query = { studentId: user._id.toString() }; break;
      case 'FACULTY': query = { facultyId: user._id.toString() }; break;
      case 'HOD': query = { hodId: user._id.toString() }; break;
      case 'STUDENT_AFFAIRS': query = { deanId: user._id.toString() }; break;
    }

    const data = await Appointment.find(query).sort({ createdAt: -1 });
    res.json(data);
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/appointments', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'STUDENT') {
      return res.status(403).json({ message: 'Only students can book appointments' });
    }

    const { facultyId, hodId, deanId, date, time, duration, purpose, meetingType, location, videoLink } = req.body;

    const faculty = await User.findById(facultyId);
    if (!faculty) return res.status(400).json({ message: 'Invalid faculty' });

    const newAppointment = new Appointment({
      studentId: user._id.toString(),
      studentName: user.name,
      facultyId,
      facultyName: faculty.name,
      hodId,
      hodName: hodId ? (await User.findById(hodId))?.name : undefined,
      deanId,
      deanName: deanId ? (await User.findById(deanId))?.name : undefined,
      date,
      time,
      duration,
      purpose,
      meetingType,
      location,
      videoLink
    });

    await newAppointment.save();
    res.status(201).json(newAppointment);
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin-only endpoint to update user
app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const adminUser = await User.findById(req.userId);
    if (!adminUser || adminUser.role !== 'ADMIN') return res.status(403).json({ message: 'Admin only' });

    const { id } = req.params;
    const { name, username, role } = req.body;

    const updatedUser = await User.findByIdAndUpdate(id, { name, username, role }, { new: true });
    res.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin-only endpoint to reset user password
app.post('/api/users/:id/reset-password', authenticateToken, async (req, res) => {
  try {
    const adminUser = await User.findById(req.userId);
    if (!adminUser || adminUser.role !== 'ADMIN') return res.status(403).json({ message: 'Admin only' });

    const { id } = req.params;
    const { newPassword } = req.body;

    const targetUser = await User.findById(id);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    targetUser.password = newPassword;
    await targetUser.save();
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin-only endpoint to delete user
app.delete('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const adminUser = await User.findById(req.userId);
    if (!adminUser || adminUser.role !== 'ADMIN') return res.status(403).json({ message: 'Admin only' });

    const { id } = req.params;
    if (id === adminUser._id.toString()) return res.status(400).json({ message: 'Cannot delete self' });

    await User.findByIdAndDelete(id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Request routes
app.get('/api/requests', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    let query = {};
    switch (user.role) {
      case 'STUDENT': query = { studentId: user._id.toString() }; break;
      case 'FACULTY': query = { currentStage: 'FACULTY_REVIEW', status: 'PENDING' }; break;
      case 'HOD': query = { currentStage: 'HOD_REVIEW', status: 'PENDING' }; break;
      case 'STUDENT_AFFAIRS': query = { $or: [{ currentStage: 'STUDENT_AFFAIRS_APPROVAL' }, { currentStage: 'DEAN_APPROVAL' }], status: 'PENDING' }; break;
      case 'ADMIN': query = {}; break; // See all
    }

    const filteredRequests = await Request.find(query).sort({ createdAt: -1 });
    res.json(filteredRequests);
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/requests', authenticateToken, upload.array('documents', 5), async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'STUDENT') {
      return res.status(403).json({ message: 'Only students can create requests' });
    }

    const {
      title, description, requestType, priority, studentIdNumber,
      needsFacultyApproval, needsHodApproval, needsOdApproval, needsLeaveApproval,
      needsMailIdUnblock, email, phone, mailIdReason, additionalNotes,
      eventType, eventId, studentRegistrationNumber, eventStatusImageUrl,
      fromDate, fromTime, toDate, toTime, enteredMailId, selectedFacultyId
    } = req.body;

    if (!title || !description) return res.status(400).json({ message: 'Missing fields' });

    const documents = (req.files || []).map(file => ({
      name: file.originalname, size: file.size, type: file.mimetype, uploadedAt: new Date().toISOString()
    }));

    const newRequest = new Request({
      studentId: user._id.toString(), studentName: user.name,
      title, description, requestType, priority, studentIdNumber,
      needsFacultyApproval, needsHodApproval, needsOdApproval, needsLeaveApproval, needsMailIdUnblock,
      email, phone, mailIdReason, additionalNotes, eventType, eventId, studentRegistrationNumber, eventStatusImageUrl,
      fromDate, fromTime, toDate, toTime, enteredMailId, selectedFacultyId,
      currentStage: requestType === 'mailid' ? 'STUDENT_AFFAIRS_APPROVAL' : 'FACULTY_REVIEW',
      status: 'PENDING',
      documents,
      logs: [{ date: new Date().toISOString(), actorName: user.name, action: 'Submitted Request' }]
    });

    await newRequest.save();

    if (selectedFacultyId) {
      const faculty = await User.findById(selectedFacultyId);
      if (faculty?.username) {
        await transporter.sendMail({
          from: `"Smart Approval System" <${process.env.SMTP_USER}>`,
          to: faculty.username,
          subject: `Action Required: New Request from ${user.name}`,
          text: `A new ${requestType.toUpperCase()} request has been submitted by ${user.name}.`
        }).catch(e => console.error('Failed to notify faculty:', e.message));
      }
    }

    res.status(201).json(newRequest);
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/requests/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { action, comment } = req.body;
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    const isMailId = request.requestType === 'mailid';
    const canAct = (user.role === 'STUDENT_AFFAIRS') || (user.role === 'ADMIN') || 
                   (!isMailId && user.role === 'FACULTY' && request.currentStage === 'FACULTY_REVIEW') ||
                   (!isMailId && user.role === 'HOD' && request.currentStage === 'HOD_REVIEW');

    if (!canAct) return res.status(403).json({ message: 'No permission' });

    let nextStage = request.currentStage;
    let nextStatus = 'PENDING';

    if (action === 'approve') {
      if (user.role === 'STUDENT_AFFAIRS' || user.role === 'ADMIN') {
        nextStage = 'COMPLETED'; nextStatus = 'APPROVED';
      } else if (request.currentStage === 'FACULTY_REVIEW') {
        nextStage = 'HOD_REVIEW';
      } else if (request.currentStage === 'HOD_REVIEW') {
        nextStage = 'DEAN_APPROVAL';
      } else if (request.currentStage === 'DEAN_APPROVAL') {
        nextStage = 'COMPLETED'; nextStatus = 'APPROVED';
      }
    } else {
      nextStage = 'COMPLETED'; nextStatus = 'REJECTED';
    }

    request.currentStage = nextStage;
    request.status = nextStatus;
    request.logs.push({
      date: new Date().toISOString(),
      actorName: user.name,
      action: `${action === 'approve' ? 'Approved' : 'Rejected'} (${user.role})`,
      comment
    });

    await request.save();
    res.json(request);
  } catch (error) {
    console.error('Update request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Database Introspection endpoints
app.get('/api/database/collections', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'ADMIN') return res.status(403).json({ message: 'Admin only' });
    const collections = await mongoose.connection.db.listCollections().toArray();
    res.json(collections.map(c => c.name));
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/database/collections/:collectionName', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'ADMIN') return res.status(403).json({ message: 'Admin only' });

    const { collectionName } = req.params;
    const data = await mongoose.connection.db.collection(collectionName).find().toArray();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
startServer();

export default app;
