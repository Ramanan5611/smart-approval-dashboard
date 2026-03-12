import dotenv from 'dotenv';
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);
import { connectDB, disconnectDB } from '../config/database';
import { User, Request } from '../models/index';
import { UserRole, RequestStage, RequestStatus } from '../types';

// Load environment variables
dotenv.config();

const seedUsers = [
  {
    username: 'student_user',
    password: 'stud123',
    role: UserRole.STUDENT,
    name: 'Alice Student'
  },
  {
    username: 'faculty_adv',
    password: 'fac123',
    role: UserRole.FACULTY,
    name: 'Dr. Smith (Advisor)'
  },
  {
    username: 'hod_dept',
    password: 'hod123',
    role: UserRole.HOD,
    name: 'Prof. Jones (HOD)'
  },
  {
    username: 'student_admin',
    password: 'sa123',
    role: UserRole.STUDENT_AFFAIRS,
    name: 'Student Affairs Admin'
  },
  {
    username: 'admin_system',
    password: 'admin123',
    role: UserRole.ADMIN,
    name: 'System Admin'
  }
];

const seedRequests = [
  {
    studentName: 'Alice Student',
    title: 'Research Grant for AI Project',
    description: 'Requesting $500 for cloud GPU credits to train a neural network model for the senior thesis project.',
    currentStage: RequestStage.FACULTY_REVIEW,
    status: RequestStatus.PENDING,
    logs: [
      { date: new Date().toISOString(), actorName: 'Alice Student', action: 'Submitted Request' }
    ]
  },
  {
    studentName: 'Alice Student',
    title: 'Conference Travel Approval',
    description: 'Permission to travel to NYC for the Tech 2024 conference.',
    currentStage: RequestStage.COMPLETED,
    status: RequestStatus.APPROVED,
    logs: [
      { date: new Date(Date.now() - 86400000 * 5).toISOString(), actorName: 'Alice Student', action: 'Submitted Request' },
      { date: new Date(Date.now() - 86400000 * 4).toISOString(), actorName: 'Dr. Smith', action: 'Approved (Faculty)' },
      { date: new Date(Date.now() - 86400000 * 3).toISOString(), actorName: 'Prof. Jones', action: 'Approved (HOD)' },
      { date: new Date(Date.now() - 86400000 * 2).toISOString(), actorName: 'Student Affairs Admin', action: 'Final Approval' },
    ]
  }
];

const seedDatabase = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();

    // Clear existing data
    console.log('Clearing existing data...');
    await Request.deleteMany({});
    await User.deleteMany({});

    console.log('Seeding users...');
    const createdUsers = [];
    for (const userData of seedUsers) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
    }
    console.log(`Created ${createdUsers.length} users:`);
    createdUsers.forEach(user => {
      console.log(`  ${user.username} / [HIDDEN] (${user.role})`);
    });

    // Get the student user ID for requests
    const studentUser = createdUsers.find(u => u.role === UserRole.STUDENT);

    if (studentUser) {
      // Seed requests with student ID
      console.log('Seeding requests...');
      const requestsWithStudentId = seedRequests.map(req => ({
        ...req,
        studentId: studentUser._id
      }));

      const createdRequests: any = await Request.create(requestsWithStudentId as any);
      console.log(`Created ${createdRequests.length} requests`);
    }

    console.log('Database seeded successfully!');
    console.log('\nDemo credentials:');
    seedUsers.forEach(user => {
      console.log(`  ${user.username} / ${user.password} (${user.role})`);
    });

  } catch (error: any) {
    console.error('Error seeding database:', error.message);
    if (error.errors) {
      console.error('Validation Errors:', error.errors);
    }
  } finally {
    await disconnectDB();
    process.exit(0);
  }
};

seedDatabase();
