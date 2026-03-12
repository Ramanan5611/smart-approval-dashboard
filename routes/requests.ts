import express from 'express';
import jwt from 'jsonwebtoken';
import { Request, User } from '../models/index';
import { RequestStage, RequestStatus, UserRole, LogEntry } from '../types';

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.userId = decoded.userId;
    next();
  });
};

// Get requests for the current user
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let requests;
    switch (user.role) {
      case UserRole.STUDENT:
        requests = await Request.find({ studentId: user._id }).sort({ createdAt: -1 });
        break;
      case UserRole.FACULTY:
        requests = await Request.find({
          currentStage: RequestStage.FACULTY_REVIEW,
          status: RequestStatus.PENDING
        }).sort({ createdAt: -1 });
        break;
      case UserRole.HOD:
        requests = await Request.find({
          currentStage: RequestStage.HOD_REVIEW,
          status: RequestStatus.PENDING
        }).sort({ createdAt: -1 });
        break;
      case UserRole.STUDENT_AFFAIRS:
        requests = await Request.find({
          currentStage: RequestStage.STUDENT_AFFAIRS_APPROVAL,
          status: RequestStatus.PENDING
        }).sort({ createdAt: -1 });
        break;
      case UserRole.ADMIN:
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

// Create a new request
router.post('/', authenticateToken, async (req: any, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== UserRole.STUDENT) {
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
      documents,
      // New deeply specific fields
      eventType,
      eventId,
      studentRegistrationNumber,
      eventStatusImageUrl,
      fromDate,
      fromTime,
      toDate,
      toTime,
      enteredMailId
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    const newRequest = new Request({
      studentId: user._id,
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
      currentStage: RequestStage.FACULTY_REVIEW,
      status: RequestStatus.PENDING,
      logs: [{
        date: new Date().toISOString(),
        actorName: user.name,
        action: 'Submitted Request'
      }]
    });

    await newRequest.save();
    res.status(201).json(newRequest);
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a request (approve/reject)
router.put('/:id', authenticateToken, async (req: any, res) => {
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

    // Check if user has permission to act on this request
    const canAct =
      (user.role === UserRole.FACULTY && request.currentStage === RequestStage.FACULTY_REVIEW) ||
      (user.role === UserRole.HOD && request.currentStage === RequestStage.HOD_REVIEW) ||
      (user.role === UserRole.STUDENT_AFFAIRS && request.currentStage === RequestStage.STUDENT_AFFAIRS_APPROVAL);

    if (!canAct) {
      return res.status(403).json({ message: 'You do not have permission to act on this request' });
    }

    let nextStage = request.currentStage;
    let nextStatus = RequestStatus.PENDING;

    if (action === 'approve') {
      // Custom Workflow Logic based on requestType
      if (request.currentStage === RequestStage.FACULTY_REVIEW) {
        if (request.requestType === 'leave' || request.requestType === 'mailid') {
          // Leave and Mail ID only need Faculty approval
          nextStage = RequestStage.COMPLETED;
          nextStatus = RequestStatus.APPROVED;
        } else if (request.requestType === 'od') {
          // OD needs Faculty -> HOD
          nextStage = RequestStage.HOD_REVIEW;
        } else {
          // Default fallback
          nextStage = RequestStage.HOD_REVIEW;
        }
      } else if (request.currentStage === RequestStage.HOD_REVIEW) {
        if (request.requestType === 'od') {
          // OD stops after HOD
          nextStage = RequestStage.COMPLETED;
          nextStatus = RequestStatus.APPROVED;
        } else {
          // Default fallback
          nextStage = RequestStage.STUDENT_AFFAIRS_APPROVAL;
        }
      } else if (request.currentStage === RequestStage.STUDENT_AFFAIRS_APPROVAL) {
        nextStage = RequestStage.COMPLETED;
        nextStatus = RequestStatus.APPROVED;
      }
    } else {
      // Reject
      nextStage = RequestStage.COMPLETED;
      nextStatus = RequestStatus.REJECTED;
    }

    const log: LogEntry = {
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

export default router;
