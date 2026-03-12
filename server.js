import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-approval-dashboard', {
      dbName: 'smart-approval-dashboard'
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name}`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    if (error.reason) console.error('Connection reason:', error.reason);
    process.exit(1);
  }
};

// User Schema
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['STUDENT', 'FACULTY', 'HOD', 'DEAN', 'ADMIN', 'STUDENT_AFFAIRS'] },
  name: { type: String, required: true }
}, { timestamps: true });

UserSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', UserSchema);

// Request Schema
const LogEntrySchema = new mongoose.Schema({
  date: { type: String, required: true },
  actorName: { type: String, required: true },
  action: { type: String, required: true },
  comment: { type: String }
}, { _id: false });

const RequestSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  currentStage: { type: String, required: true, enum: ['SUBMITTED', 'FACULTY_REVIEW', 'HOD_REVIEW', 'DEAN_APPROVAL', 'STUDENT_AFFAIRS_APPROVAL', 'COMPLETED'] },
  status: { type: String, required: true, enum: ['PENDING', 'APPROVED', 'REJECTED'] },
  logs: [LogEntrySchema],
  complianceScore: { type: Number, min: 0, max: 100 },
  complianceReason: { type: String },
  // Enhanced request fields
  requestType: { type: String, enum: ['leave', 'mailid', 'od'] },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'] },
  studentIdNumber: { type: String },
  needsFacultyApproval: { type: Boolean, default: false },
  needsHodApproval: { type: Boolean, default: false },
  needsOdApproval: { type: Boolean, default: false },
  needsLeaveApproval: { type: Boolean, default: false },
  email: { type: String },
  phone: { type: String },
  needsMailIdUnblock: { type: Boolean, default: false },
  mailIdReason: { type: String },
  additionalNotes: { type: String },
  documents: [{
    name: String,
    size: Number,
    type: String
  }]
}, { timestamps: true });

RequestSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

RequestSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Request = mongoose.model('Request', RequestSchema);

// Appointment Schema
const AppointmentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String, required: true },
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  facultyName: { type: String },
  hodId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  hodName: { type: String },
  deanId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deanName: { type: String },
  date: { type: String, required: true },
  time: { type: String, required: true },
  duration: { type: String, required: true },
  purpose: { type: String, required: true },
  status: { type: String, required: true, enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'], default: 'PENDING' },
  meetingType: { type: String, required: true, enum: ['IN_PERSON', 'VIDEO_CALL', 'PHONE'] },
  location: { type: String },
  videoLink: { type: String },
  notes: { type: String },
  createdAt: { type: String, required: true }
}, { timestamps: true });

AppointmentSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

AppointmentSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Appointment = mongoose.model('Appointment', AppointmentSchema);

const seedAdmin = async () => {
  try {
    console.log(`Checking database state in ${mongoose.connection.name}...`);
    const userCount = await User.countDocuments();
    console.log(`Total users found: ${userCount}`);
    
    const adminExists = await User.findOne({ role: 'ADMIN' });
    if (!adminExists) {
      console.log('No admin found. Seeding default admin...');
      const admin = new User({
        username: 'admin@smartapproval.com',
        password: 'admin123',
        role: 'ADMIN',
        name: 'System Admin'
      });
      await admin.save();
      console.log('✅ Default admin account created successfully!');
    } else {
      console.log(`Admin user (${adminExists.username}) already exists. Skipping seed.`);
    }
  } catch (error) {
    console.error('CRITICAL: Error seeding admin:', error.message);
    console.error(error.stack);
  }
};

// JWT Token generation
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '24h' });
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.userId = decoded.userId;
    next();
  });
};

// Routes

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const requestCount = await Request.countDocuments();
    res.json({ 
      status: 'OK', 
      db: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
      dbName: mongoose.connection.name,
      dbHost: mongoose.connection.host,
      counts: {
        users: userCount,
        requests: requestCount
      },
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'Error', 
      error: error.message,
      db: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    });
  }
});

// Diagnostic: Check all collections
app.get('/api/admin/check-db', async (req, res) => {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    const stats = {};
    for (const col of collections) {
      stats[col.name] = await mongoose.connection.db.collection(col.name).countDocuments();
    }
    res.json({
      database: mongoose.connection.name,
      collections: stats,
      readyState: mongoose.connection.readyState
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Diagnostic: Force Seed
app.get('/api/admin/force-seed', async (req, res) => {
  try {
    console.log('MANUAL SEED TRIGGERED');
    const newUser = new User({
      username: `admin_${Date.now()}@test.com`,
      password: 'managed_password_123',
      role: 'ADMIN',
      name: 'Diagnostic Admin'
    });
    await newUser.save();
    res.json({ message: 'Diagnostic user created!', user: newUser.username });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id.toString());

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
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, role, name } = req.body;

    if (!username || !password || !role || !name) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ username });
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
    console.error('Registration error details:', {
      message: error.message,
      stack: error.stack,
      body: req.body // Log the body to see what role/data caused the failure
    });
    res.status(500).json({ 
      message: 'Server error during registration',
      details: error.message 
    });
  }
});

// Request routes
app.get('/api/requests', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let requests;
    switch (user.role) {
      case 'STUDENT':
        requests = await Request.find({ studentId: user._id }).sort({ createdAt: -1 });
        break;
      case 'FACULTY':
        requests = await Request.find({ 
          currentStage: 'FACULTY_REVIEW', 
          status: 'PENDING' 
        }).sort({ createdAt: -1 });
        break;
      case 'HOD':
        requests = await Request.find({ 
          currentStage: 'HOD_REVIEW', 
          status: 'PENDING' 
        }).sort({ createdAt: -1 });
        break;
      case 'DEAN':
        requests = await Request.find({ 
          currentStage: 'DEAN_APPROVAL', 
          status: 'PENDING' 
        }).sort({ createdAt: -1 });
        break;
      case 'STUDENT_AFFAIRS':
        requests = await Request.find({ 
          currentStage: { $in: ['STUDENT_AFFAIRS_APPROVAL', 'DEAN_APPROVAL'] }, 
          status: 'PENDING' 
        }).sort({ createdAt: -1 });
        break;
      case 'ADMIN':
        requests = await Request.find().sort({ createdAt: -1 });
        break;
      default:
        requests = [];
    }

    res.json(requests);
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/requests', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
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
      email,
      phone,
      needsMailIdUnblock,
      mailIdReason,
      additionalNotes,
      documents
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    // Determine the appropriate stage based on approval requirements
    let currentStage = 'SUBMITTED';
    
    // Follow the exact approval chain selected by the student
    if (needsFacultyApproval) {
      currentStage = 'FACULTY_REVIEW';
    } else if (needsHodApproval) {
      currentStage = 'HOD_REVIEW';
    } else if (needsOdApproval) {
      currentStage = 'DEAN_APPROVAL';
    } else if (needsLeaveApproval) {
      currentStage = 'FACULTY_REVIEW'; // Leave approval goes to faculty first
    } else if (needsMailIdUnblock) {
      currentStage = 'FACULTY_REVIEW'; // Mail ID unblock goes to faculty first
    } else {
      currentStage = 'COMPLETED'; // No approval needed
    }

    const newRequest = new Request({
      studentId: user._id,
      studentName: user.name,
      title,
      description,
      currentStage,
      status: 'PENDING',
      // Enhanced fields
      requestType,
      priority,
      studentIdNumber,
      needsFacultyApproval: needsFacultyApproval || false,
      needsHodApproval: needsHodApproval || false,
      needsOdApproval: needsOdApproval || false,
      needsLeaveApproval: needsLeaveApproval || false,
      email,
      phone,
      needsMailIdUnblock: needsMailIdUnblock || false,
      mailIdReason,
      additionalNotes,
      documents: documents || [],
      logs: [{
        date: new Date().toISOString(),
        actorName: user.name,
        action: 'Request submitted',
        comment: `Request submitted by ${user.name}`
      }]
    });

    await newRequest.save();

    res.status(201).json(newRequest);
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/requests/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { action, comment } = req.body;
    const requestId = req.params.id;

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Action must be approve or reject' });
    }

    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const canAct = 
      (user.role === 'FACULTY' && request.currentStage === 'FACULTY_REVIEW') ||
      (user.role === 'HOD' && request.currentStage === 'HOD_REVIEW') ||
      (user.role === 'DEAN' && request.currentStage === 'DEAN_APPROVAL');

    if (!canAct) {
      return res.status(403).json({ message: 'You do not have permission to act on this request' });
    }

    let nextStage = request.currentStage;
    let nextStatus = 'PENDING';

    if (action === 'approve') {
      if (request.currentStage === 'FACULTY_REVIEW') {
        nextStage = 'HOD_REVIEW';
      } else if (request.currentStage === 'HOD_REVIEW') {
        nextStage = 'DEAN_APPROVAL';
      } else if (request.currentStage === 'DEAN_APPROVAL') {
        nextStage = 'COMPLETED';
        nextStatus = 'APPROVED';
      }
    } else {
      nextStage = 'COMPLETED';
      nextStatus = 'REJECTED';
    }

    const log = {
      date: new Date().toISOString(),
      actorName: user.name,
      action: `${action === 'approve' ? 'Approved' : 'Rejected'} (${user.role})`,
      comment
    };

    request.currentStage = nextStage;
    request.status = nextStatus;
    request.logs.push(log);

    await request.save();
    res.json(request);
  } catch (error) {
    console.error('Update request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// User routes
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/users', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { name, username, role, password } = req.body;
    if (!name || !username || !role || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const newUser = new User({ name, username, role, password });
    await newUser.save();

    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { id } = req.params;
    const updateData = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/users/:id/reset-password', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ message: 'New password is required' });
    }

    const targetUser = await User.findByIdAndUpdate(
      id,
      { password: newPassword },
      { new: true, runValidators: true }
    ).select('-password');

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Approvers route
app.get('/api/approvers', authenticateToken, async (req, res) => {
  try {
    const approvers = await User.find({ 
      role: { $in: ['FACULTY', 'HOD', 'DEAN', 'ADMIN'] } 
    }).select('name role username');
    res.json(approvers);
  } catch (error) {
    console.error('Get approvers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Appointment routes
app.get('/api/appointments', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let appointments;
    switch (user.role) {
      case 'STUDENT':
        appointments = await Appointment.find({ studentId: user._id }).sort({ date: -1 });
        break;
      case 'FACULTY':
        appointments = await Appointment.find({ facultyId: user._id }).sort({ date: -1 });
        break;
      case 'HOD':
        appointments = await Appointment.find({ hodId: user._id }).sort({ date: -1 });
        break;
      case 'DEAN':
        appointments = await Appointment.find({ deanId: user._id }).sort({ date: -1 });
        break;
      case 'ADMIN':
        appointments = await Appointment.find().sort({ date: -1 });
        break;
      default:
        appointments = [];
    }

    res.json(appointments);
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/appointments', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const appointmentData = {
      ...req.body,
      studentId: user._id,
      studentName: user.name,
      createdAt: new Date().toISOString()
    };

    const newAppointment = new Appointment(appointmentData);
    await newAppointment.save();

    res.status(201).json(newAppointment);
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    await seedAdmin();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`API endpoints:`);
      console.log(`  - POST /api/auth/login`);
      console.log(`  - POST /api/auth/register`);
      console.log(`  - GET /api/requests`);
      console.log(`  - POST /api/requests`);
      console.log(`  - PUT /api/requests/:id`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
