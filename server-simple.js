import express from 'express';
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

// ─── Persistent storage helpers ───────────────────────────────────────────────
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const LOGS_FILE = path.join(DATA_DIR, 'activity_logs.json');

// In-memory stores
const otps = new Map();
const resetTokens = new Map(); // token -> { userId, expires }

const DEFAULT_USERS = [
  { id: 'u1', username: 'student@smartapproval.com', password: 'stud123', role: 'STUDENT', name: 'Alice Student' },
  { id: 'u2', username: 'faculty@smartapproval.com',  password: 'fac123',  role: 'FACULTY', name: 'Dr. Smith (Advisor)' },
  { id: 'u3', username: 'hod@smartapproval.com',     password: 'hod123',  role: 'HOD',     name: 'Prof. Jones (HOD)' },
  { id: 'u4', username: 'affairs@smartapproval.com',     password: 'aff123',  role: 'STUDENT_AFFAIRS', name: 'Student Affairs' },
  { id: 'u5', username: 'admin@smartapproval.com', password: 'admin123',role: 'ADMIN',   name: 'System Admin' }
];

// Ensure the data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load users from disk (fallback to defaults)
const loadUsers = () => {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to load users.json, using defaults:', err.message);
  }
  // First run: seed the file with defaults
  saveUsers(DEFAULT_USERS);
  return [...DEFAULT_USERS];
};

// Load logs from disk
const loadLogs = () => {
  try {
    if (fs.existsSync(LOGS_FILE)) {
      return JSON.parse(fs.readFileSync(LOGS_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('Failed to load logs:', err.message);
  }
  return [];
};

// Log activity helper
const logActivity = (userId, type, details) => {
  try {
    const logs = loadLogs();
    const newLog = {
      id: `log-${Date.now()}`,
      userId,
      timestamp: new Date().toISOString(),
      type,
      details
    };
    logs.unshift(newLog);
    // Keep only last 1000 logs
    fs.writeFileSync(LOGS_FILE, JSON.stringify(logs.slice(0, 1000), null, 2));
    return newLog;
  } catch (err) {
    console.error('Log failed:', err);
  }
};
// ──────────────────────────────────────────────────────────────────────────────

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

// In-memory data store (for demo without MongoDB)
let appointments = [];

// Role limits configuration
const ROLE_LIMITS = {
  'STUDENT': Infinity, // Unlimited students
  'FACULTY': 5,
  'HOD': 3,
  'STUDENT_AFFAIRS': 2,
  'ADMIN': 1
};

// Load users from persistent storage
let users = loadUsers();

let requests = [
  {
    id: 'req-101',
    studentId: 'u1',
    studentName: 'Alice Student',
    title: 'Research Grant for AI Project',
    description: 'Requesting $500 for cloud GPU credits to train a neural network model for the senior thesis project.',
    currentStage: 'FACULTY_REVIEW',
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    logs: [
      { date: new Date().toISOString(), actorName: 'Alice Student', action: 'Submitted Request' }
    ]
  },
  {
    id: 'req-102',
    studentId: 'u1',
    studentName: 'Alice Student',
    title: 'Conference Travel Approval',
    description: 'Permission to travel to NYC for the Tech 2024 conference.',
    currentStage: 'COMPLETED',
    status: 'APPROVED',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    logs: [
      { date: new Date(Date.now() - 86400000 * 5).toISOString(), actorName: 'Alice Student', action: 'Submitted Request' },
      { date: new Date(Date.now() - 86400000 * 4).toISOString(), actorName: 'Dr. Smith', action: 'Approved (Faculty)' },
      { date: new Date(Date.now() - 86400000 * 3).toISOString(), actorName: 'Prof. Jones', action: 'Approved (HOD)' },
      { date: new Date(Date.now() - 86400000 * 2).toISOString(), actorName: 'Dean Williams', action: 'Final Approval' },
    ]
  }
];

// Helper functions
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '24h' });
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret', (err, decoded) => {
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
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = users.find(u => u.username === username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // For demo, we'll use plain text comparison since we have pre-hashed passwords
    // For newly registered users, we'll compare plain text
    let isMatch = false;
    if (user.password.startsWith('$2a$')) {
      // Pre-hashed user - use bcrypt comparison (simplified for demo)
      const plainPasswords = {
        'student_user': 'stud123',
        'faculty_adv': 'fac123',
        'hod_dept': 'hod123',
        'stud_aff': 'aff123',
        'admin_system': 'admin123'
      };
      isMatch = plainPasswords[username] === password;
    } else {
      // Newly registered user - plain text comparison
      isMatch = user.password === password;
    }

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate OTP for login (Professional Expansion)
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes
    otps.set(user.id, { code: otpCode, expires });

    const mailOptions = {
      from: `"Smart Approval System" <${process.env.SMTP_USER}>`,
      to: username,
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

    logActivity(user.id, 'AUTH_LOGIN_ATTEMPT', { status: 'OTP_SENT', username });

    res.json({
      message: 'OTP sent to your email',
      requiresOtp: true,
      userId: user.id
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

    const user = users.find(u => u.id === userId);
    otps.delete(userId);

    const token = generateToken(user.id);
    logActivity(user.id, 'AUTH_LOGIN_SUCCESS', { method: 'OTP' });

    res.json({
      token,
      user: {
        id: user.id,
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
    const currentCount = users.filter(u => u.role === role).length;
    const limit = ROLE_LIMITS[role];

    if (currentCount >= limit) {
      return res.status(400).json({
        message: `Cannot create more ${role.toLowerCase()} accounts. Maximum limit: ${limit}`
      });
    }

    const existingUser = users.find(u => u.username === username);
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // For demo, we'll use plain text password comparison
    // In production, you'd hash the password properly
    const user = { id: `u${users.length + 1}`, username, password, role, name };
    users.push(user);
    saveUsers(users); // persist to disk

    const token = generateToken(user.id);

    res.status(201).json({
      token,
      user: {
        id: user.id,
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
    const user = users.find(u => u.username === username);

    if (!user) {
      // Don't reveal if user exists for security, but for this demo we'll be helpful
      return res.status(404).json({ message: 'User not found' });
    }

    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    resetTokens.set(token, { userId: user.id, expires: Date.now() + 3600000 }); // 1 hour

    const mailOptions = {
      from: `"Smart Approval System" <${process.env.SMTP_USER}>`,
      to: username,
      subject: 'Password Reset Request',
      html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
        <h2 style="color: #2563eb;">Password Reset</h2>
        <p>Hello <strong>${user.name}</strong>,</p>
        <p>You requested to reset your password. Use the token below to complete the process:</p>
        <div style="background: #f8fafc; padding: 15px; text-align: center; border-radius: 8px; font-family: monospace; font-size: 18px; font-weight: bold; color: #1e293b; margin: 20px 0;">
          ${token}
        </div>
        <p style="font-size: 14px; color: #64748b;">This token is valid for 1 hour. If you did not request this, please ignore this email.</p>
      </div>`
    };

    await transporter.sendMail(mailOptions);
    logActivity(user.id, 'AUTH_RESET_REQUESTED', { username });

    res.json({ message: 'Reset token sent to email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const resetData = resetTokens.get(token);

    if (!resetData || Date.now() > resetData.expires) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const userIndex = users.findIndex(u => u.id === resetData.userId);
    if (userIndex === -1) {
      return res.status(404).json({ message: 'User no longer exists' });
    }

    // Update password
    users[userIndex].password = newPassword;
    saveUsers(users);
    resetTokens.delete(token);

    logActivity(resetData.userId, 'AUTH_RESET_SUCCESS', {});

    res.json({ message: 'Password reset successful. You can now login.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/approvers', authenticateToken, async (req, res) => {
  try {
    const approvers = users
      .filter(u => u.role === 'FACULTY' || u.role === 'HOD')
      .map(({ password, ...user }) => user);
    res.json(approvers);
  } catch (error) {
    console.error('Get approvers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin-only endpoint to get activity logs
app.get('/api/logs', authenticateToken, async (req, res) => {
  try {
    const user = users.find(u => u.id === req.userId);
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    const logs = loadLogs();
    res.json(logs);
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin-only endpoint to get all users
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const user = users.find(u => u.id === req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only admin can access user list
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Return users without passwords
    const safeUsers = users.map(({ password, ...user }) => user);
    res.json(safeUsers);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin-only endpoint to create user
app.post('/api/users', authenticateToken, async (req, res) => {
  try {
    const adminUser = users.find(u => u.id === req.userId);
    if (!adminUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only admin can create users
    if (adminUser.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { name, username, role, password } = req.body;

    if (!name || !username || !role || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if role is valid
    if (!['STUDENT', 'FACULTY', 'HOD', 'STUDENT_AFFAIRS', 'ADMIN'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    // Check role limits
    const currentCount = users.filter(u => u.role === role).length;
    const limit = ROLE_LIMITS[role];

    if (currentCount >= limit) {
      return res.status(400).json({
        message: `Cannot create more ${role.toLowerCase()} accounts. Maximum limit: ${limit}`
      });
    }

    const existingUser = users.find(u => u.username === username);
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Create new user
    const newUser = {
      id: `u${users.length + 1}`,
      name,
      username,
      role,
      password // In production, you'd hash this
    };

    users.push(newUser);
    saveUsers(users); // persist to disk

    // Return user without password
    const { password: _, ...safeUser } = newUser;
    res.status(201).json(safeUser);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Appointment endpoints
app.get('/api/appointments', authenticateToken, async (req, res) => {
  try {
    const user = users.find(u => u.id === req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let filteredAppointments = appointments;

    // Filter appointments based on user role
    switch (user.role) {
      case 'STUDENT':
        // Students can only see their own appointments
        filteredAppointments = appointments.filter(apt => apt.studentId === user.id);
        break;
      case 'FACULTY':
        // Faculty can see appointments where they are the assigned faculty
        filteredAppointments = appointments.filter(apt => apt.facultyId === user.id);
        break;
      case 'HOD':
        // HODs can see appointments where they are the assigned HOD
        filteredAppointments = appointments.filter(apt => apt.hodId === user.id);
        break;
      case 'STUDENT_AFFAIRS':
        // Deans can see appointments where they are the assigned dean
        filteredAppointments = appointments.filter(apt => apt.deanId === user.id);
        break;
      case 'ADMIN':
        // Admins can see all appointments
        filteredAppointments = appointments;
        break;
      default:
        filteredAppointments = [];
    }

    res.json(filteredAppointments);
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/appointments', authenticateToken, async (req, res) => {
  try {
    const user = users.find(u => u.id === req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only students can create appointments
    if (user.role !== 'STUDENT') {
      return res.status(403).json({ message: 'Only students can book appointments' });
    }

    const { facultyId, hodId, deanId, date, time, duration, purpose, meetingType, location, videoLink } = req.body;

    if (!facultyId || !date || !time || !purpose) {
      return res.status(400).json({ message: 'Faculty, date, time, and purpose are required' });
    }

    // Validate faculty exists
    const faculty = users.find(u => u.id === facultyId);
    if (!faculty || faculty.role !== 'FACULTY') {
      return res.status(400).json({ message: 'Invalid faculty selected' });
    }

    // Validate optional participants
    if (hodId) {
      const hod = users.find(u => u.id === hodId);
      if (!hod || hod.role !== 'HOD') {
        return res.status(400).json({ message: 'Invalid HOD selected' });
      }
    }

    if (deanId) {
      const dean = users.find(u => u.id === deanId);
      if (!dean || dean.role !== 'STUDENT_AFFAIRS') {
        return res.status(400).json({ message: 'Invalid Dean selected' });
      }
    }

    const newAppointment = {
      id: `appt${Date.now()}`,
      studentId: user.id,
      studentName: user.name,
      facultyId,
      facultyName: faculty.name,
      hodId: hodId || undefined,
      hodName: hodId ? users.find(u => u.id === hodId)?.name : undefined,
      deanId: deanId || undefined,
      deanName: deanId ? users.find(u => u.id === deanId)?.name : undefined,
      date,
      time,
      duration: duration || '30',
      purpose,
      status: 'PENDING',
      meetingType: meetingType || 'IN_PERSON',
      location: meetingType === 'IN_PERSON' ? location : undefined,
      videoLink: meetingType === 'VIDEO_CALL' ? videoLink : undefined,
      createdAt: new Date().toISOString()
    };

    appointments.push(newAppointment);
    res.status(201).json(newAppointment);
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin-only endpoint to update user
app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const adminUser = users.find(u => u.id === req.userId);
    if (!adminUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only admin can update users
    if (adminUser.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { id } = req.params;
    const { name, username, role } = req.body;

    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }

    const targetUser = users[userIndex];

    // Prevent role changes for security
    if (role && role !== targetUser.role) {
      return res.status(403).json({ message: 'Role changes are not allowed for security reasons' });
    }

    // Update user (don't allow password changes here)
    const updatedUser = {
      ...targetUser,
      name: name || targetUser.name,
      username: username || targetUser.username,
      role: targetUser.role // Keep original role
    };

    users[userIndex] = updatedUser;
    saveUsers(users); // persist to disk

    // Return user without password
    const { password, ...safeUser } = updatedUser;
    res.json(safeUser);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin-only endpoint to reset user password
app.post('/api/users/:id/reset-password', authenticateToken, async (req, res) => {
  try {
    const adminUser = users.find(u => u.id === req.userId);
    if (!adminUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only admin can reset passwords
    if (adminUser.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update password (in production, you'd hash this)
    users[userIndex].password = newPassword;
    saveUsers(users); // persist to disk

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin-only endpoint to delete user
app.delete('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const adminUser = users.find(u => u.id === req.userId);
    if (!adminUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (adminUser.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { id } = req.params;

    // Prevent deleting the admin account itself
    if (id === adminUser.id) {
      return res.status(400).json({ message: 'Cannot delete your own admin account' });
    }

    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting other admin accounts
    if (users[userIndex].role === 'ADMIN') {
      return res.status(400).json({ message: 'Cannot delete an admin account' });
    }

    users.splice(userIndex, 1);
    saveUsers(users); // persist to disk
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Request routes
app.get('/api/requests', authenticateToken, async (req, res) => {
  try {
    const user = users.find(u => u.id === req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let filteredRequests;
    switch (user.role) {
      case 'STUDENT':
        filteredRequests = requests.filter(r => r.studentId === user.id);
        break;
      case 'FACULTY':
        filteredRequests = requests.filter(r => r.currentStage === 'FACULTY_REVIEW' && r.status === 'PENDING');
        break;
      case 'HOD':
        filteredRequests = requests.filter(r => r.currentStage === 'HOD_REVIEW' && r.status === 'PENDING');
        break;
      case 'STUDENT_AFFAIRS':
        // Student Affairs sees requests pending their approval stage (including Dean approval for OD/Leave)
        filteredRequests = requests.filter(r =>
          (r.currentStage === 'STUDENT_AFFAIRS_APPROVAL' || r.currentStage === 'DEAN_APPROVAL') && r.status === 'PENDING'
        );
        break;
      case 'ADMIN':
        filteredRequests = requests;
        break;
      default:
        filteredRequests = [];
    }

    res.json(filteredRequests);
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/requests', authenticateToken, upload.array('documents', 5), async (req, res) => {
  try {
    const user = users.find(u => u.id === req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'STUDENT') {
      return res.status(403).json({ message: 'Only students can create requests' });
    }

    const {
      title,
      description,
      requestType,
      priority,
      studentIdNumber,
      needsFacultyApproval,
      needsHodApproval,
      needsOdApproval,
      needsLeaveApproval,
      needsMailIdUnblock,
      email,
      phone,
      mailIdReason,
      additionalNotes,
      eventType,
      eventId,
      studentRegistrationNumber,
      eventStatusImageUrl,
      fromDate,
      fromTime,
      toDate,
      toTime,
      enteredMailId,
      selectedFacultyId
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    // Process uploaded files
    const documents = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        documents.push({
          name: file.originalname,
          size: file.size,
          type: file.mimetype,
          uploadedAt: new Date().toISOString()
        });
      });
    }

    const newRequest = {
      id: `req-${Date.now()}`,
      studentId: user.id,
      studentName: user.name,
      title,
      description,
      requestType,
      priority,
      studentIdNumber,
      needsFacultyApproval,
      needsHodApproval,
      needsOdApproval,
      needsLeaveApproval,
      needsMailIdUnblock,
      email,
      phone,
      mailIdReason,
      additionalNotes,
      eventType,
      eventId,
      studentRegistrationNumber,
      eventStatusImageUrl,
      fromDate,
      fromTime,
      toDate,
      toTime,
      enteredMailId,
      selectedFacultyId,
      currentStage: requestType === 'mailid' ? 'STUDENT_AFFAIRS_APPROVAL' : 'FACULTY_REVIEW',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      documents: documents,
      logs: [{
        date: new Date().toISOString(),
        actorName: user.name,
        action: 'Submitted Request'
      }]
    };

    requests.unshift(newRequest);

    // Send email notification to selected faculty/HOD
    if (selectedFacultyId) {
      const faculty = users.find(u => u.id === selectedFacultyId);
      if (faculty && faculty.username) {
        const mailOptions = {
          from: `"Smart Approval System" <${process.env.SMTP_USER}>`,
          to: faculty.username,
          subject: `Action Required: New Request from ${user.name}`,
          text: `Hello ${faculty.name},
          
A new ${requestType.toUpperCase()} request has been submitted by student ${user.name} (${user.username}) and is waiting for your approval.

Request Details:
- Title: ${title}
- Description: ${description}
- Registration Number: ${studentRegistrationNumber || 'N/A'}
- Priority: ${priority || 'NORMAL'}

Please log in to the Smart Approval Dashboard to review and act on this request.

Regards,
Academic Workflow System`
        };

        transporter.sendMail(mailOptions).then(info => {
          console.log('Faculty notification email sent successfully:', info.response);
        }).catch(err => {
          console.error('Failed to send faculty notification email:', err);
        });
      }
    }

    res.status(201).json(newRequest);
  } catch (error) {
    console.error('Create request error:', error);
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size too large. Maximum size is 10MB per file.' });
    }
    if (error.message.includes('Invalid file type')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/requests/:id', authenticateToken, async (req, res) => {
  try {
    const user = users.find(u => u.id === req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { action, comment } = req.body;
    const requestId = req.params.id;

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Action must be approve or reject' });
    }

    const request = requests.find(r => r.id === requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // MAIL ID UNBLOCK: goes directly to Student Affairs — Faculty/HOD cannot act on it
    const isMailId = request.requestType === 'mailid';

    const canAct =
      (user.role === 'STUDENT_AFFAIRS') || // Student Affairs handles everything (including mailid)
      (user.role === 'ADMIN') ||           // Admin can act on everything
      (!isMailId && user.role === 'FACULTY' && request.currentStage === 'FACULTY_REVIEW') ||
      (!isMailId && user.role === 'HOD' && request.currentStage === 'HOD_REVIEW');

    if (!canAct) {
      return res.status(403).json({ message: 'You do not have permission to act on this request' });
    }

    let nextStage = request.currentStage;
    let nextStatus = 'PENDING';

    if (action === 'approve') {
      if (user.role === 'STUDENT_AFFAIRS' || user.role === 'ADMIN') {
        // Dean/Admin can give final approval directly
        nextStage = 'COMPLETED';
        nextStatus = 'APPROVED';
      } else if (request.currentStage === 'FACULTY_REVIEW') {
        nextStage = 'HOD_REVIEW';
      } else if (request.currentStage === 'HOD_REVIEW') {
        nextStage = 'DEAN_APPROVAL';
      } else if (request.currentStage === 'DEAN_APPROVAL') {
        nextStage = 'COMPLETED';
        nextStatus = 'APPROVED';
      }
    } else {
      // Reject
      nextStage = 'COMPLETED';
      nextStatus = 'REJECTED';
    }

    const log = {
      date: new Date().toISOString(),
      actorName: user.name,
      action: `${action === 'approve' ? 'Approved' : 'Rejected'} (${user.role}${(user.role === 'STUDENT_AFFAIRS' || user.role === 'ADMIN') ? ' - Override' : ''})`,
      comment
    };

    request.currentStage = nextStage;
    request.status = nextStatus;
    request.logs.push(log);

    res.json(request);
  } catch (error) {
    console.error('Update request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Database Introspection endpoints
app.get('/api/database/collections', authenticateToken, async (req, res) => {
  try {
    const user = users.find(u => u.id === req.userId);
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    // Return the available "collections" (our in-memory arrays)
    res.json(['users', 'requests', 'appointments']);
  } catch (error) {
    console.error('Get collections error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/database/collections/:collectionName', authenticateToken, async (req, res) => {
  try {
    const user = users.find(u => u.id === req.userId);
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { collectionName } = req.params;
    let data = [];

    switch (collectionName) {
      case 'users':
        data = users.map(({ password, ...u }) => u); // omit passwords
        break;
      case 'requests':
        data = requests;
        break;
      case 'appointments':
        data = appointments;
        break;
      default:
        return res.status(404).json({ message: 'Collection not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Get collection data error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Local: http://localhost:${PORT}`);
  console.log(`Network: http://10.40.40.99:${PORT}`);
  console.log(`API endpoints:`);
  console.log(`  - POST /api/auth/login`);
  console.log(`  - GET /api/requests`);
  console.log(`  - POST /api/requests`);
  console.log(`  - PUT /api/requests/:id`);
  console.log(`\nDemo credentials:`);
  console.log(`  student_user / stud123`);
  console.log(`  faculty_adv / fac123`);
  console.log(`  hod_dept / hod123`);
  console.log(`  stud_aff / aff123`);
  console.log(`  admin_system / admin123`);
});
