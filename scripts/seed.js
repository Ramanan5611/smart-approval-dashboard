import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-approval-dashboard';

// User Schema
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['STUDENT', 'FACULTY', 'HOD', 'DEAN', 'ADMIN'] },
  name: { type: String, required: true }
}, { timestamps: true });

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

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
  currentStage: { type: String, required: true, enum: ['SUBMITTED', 'FACULTY_REVIEW', 'HOD_REVIEW', 'DEAN_APPROVAL', 'COMPLETED'] },
  status: { type: String, required: true, enum: ['PENDING', 'APPROVED', 'REJECTED'] },
  logs: [LogEntrySchema],
  complianceScore: { type: Number, min: 0, max: 100 },
  complianceReason: { type: String }
}, { timestamps: true });

const Request = mongoose.model('Request', RequestSchema);

const seedUsers = [
  { username: 'student_user', password: 'stud123', role: 'STUDENT', name: 'Alice Student' },
  { username: 'faculty_adv', password: 'fac123', role: 'FACULTY', name: 'Dr. Smith (Advisor)' },
  { username: 'hod_dept', password: 'hod123', role: 'HOD', name: 'Prof. Jones (HOD)' },
  { username: 'dean_admin', password: 'dean123', role: 'DEAN', name: 'Dean Williams' },
  { username: 'admin_system', password: 'admin123', role: 'ADMIN', name: 'System Admin' }
];

const seedRequests = [
  {
    studentName: 'Alice Student',
    title: 'Research Grant for AI Project',
    description: 'Requesting $500 for cloud GPU credits to train a neural network model for the senior thesis project.',
    currentStage: 'FACULTY_REVIEW',
    status: 'PENDING',
    logs: [
      { date: new Date().toISOString(), actorName: 'Alice Student', action: 'Submitted Request' }
    ]
  },
  {
    studentName: 'Alice Student',
    title: 'Conference Travel Approval',
    description: 'Permission to travel to NYC for the Tech 2024 conference.',
    currentStage: 'COMPLETED',
    status: 'APPROVED',
    logs: [
      { date: new Date(Date.now() - 86400000 * 5).toISOString(), actorName: 'Alice Student', action: 'Submitted Request' },
      { date: new Date(Date.now() - 86400000 * 4).toISOString(), actorName: 'Dr. Smith', action: 'Approved (Faculty)' },
      { date: new Date(Date.now() - 86400000 * 3).toISOString(), actorName: 'Prof. Jones', action: 'Approved (HOD)' },
      { date: new Date(Date.now() - 86400000 * 2).toISOString(), actorName: 'Dean Williams', action: 'Final Approval' },
    ]
  }
];

const seedDatabase = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Request.deleteMany({});

    // Seed users
    console.log('Seeding users...');
    const createdUsers = await User.create(seedUsers);
    console.log(`Created ${createdUsers.length} users`);

    // Get the student user ID for requests
    const studentUser = createdUsers.find(u => u.role === 'STUDENT');
    
    if (studentUser) {
      // Seed requests with student ID
      console.log('Seeding requests...');
      const requestsWithStudentId = seedRequests.map(req => ({
        ...req,
        studentId: studentUser._id
      }));
      
      const createdRequests = await Request.create(requestsWithStudentId);
      console.log(`Created ${createdRequests.length} requests`);
    }

    console.log('Database seeded successfully!');
    console.log('\nDemo credentials:');
    seedUsers.forEach(user => {
      console.log(`  ${user.username} / ${user.password} (${user.role})`);
    });

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
};

seedDatabase();
