import { RequestItem, RequestStage, RequestStatus, UserRole, User, LogEntry } from '../types';

const STORAGE_KEY = 'smart_approval_db';

const seedData: RequestItem[] = [
  {
    id: 'req-101',
    studentId: 'u1',
    studentName: 'Alice Student',
    title: 'Research Grant for AI Project',
    description: 'Requesting $500 for cloud GPU credits to train a neural network model for the senior thesis project.',
    currentStage: RequestStage.FACULTY_REVIEW,
    status: RequestStatus.PENDING,
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
    currentStage: RequestStage.COMPLETED,
    status: RequestStatus.APPROVED,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    logs: [
      { date: new Date(Date.now() - 86400000 * 5).toISOString(), actorName: 'Alice Student', action: 'Submitted Request' },
      { date: new Date(Date.now() - 86400000 * 4).toISOString(), actorName: 'Dr. Smith', action: 'Approved (Faculty)' },
      { date: new Date(Date.now() - 86400000 * 3).toISOString(), actorName: 'Prof. Jones', action: 'Approved (HOD)' },
      { date: new Date(Date.now() - 86400000 * 2).toISOString(), actorName: 'Student Affairs', action: 'Final Approval' },
    ]
  }
];

export const storageService = {
  init: () => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData));
    }
  },

  getAllRequests: (): RequestItem[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  getRequestsForUser: (user: User): RequestItem[] => {
    const all = storageService.getAllRequests();
    switch (user.role) {
      case UserRole.STUDENT:
        return all.filter(r => r.studentId === user.id);
      case UserRole.FACULTY:
        return all.filter(r => r.currentStage === RequestStage.FACULTY_REVIEW && r.status === RequestStatus.PENDING);
      case UserRole.HOD:
        return all.filter(r => r.currentStage === RequestStage.HOD_REVIEW && r.status === RequestStatus.PENDING);
      case UserRole.STUDENT_AFFAIRS:
        return all.filter(r => r.currentStage === RequestStage.STUDENT_AFFAIRS_APPROVAL && r.status === RequestStatus.PENDING);
      case UserRole.ADMIN:
        return all; // God view
      default:
        return [];
    }
  },

  createRequest: (student: User, title: string, description: string): RequestItem => {
    const all = storageService.getAllRequests();
    const newReq: RequestItem = {
      id: `req-${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      title,
      description,
      currentStage: RequestStage.FACULTY_REVIEW, // Move directly to first approver
      status: RequestStatus.PENDING,
      createdAt: new Date().toISOString(),
      logs: [
        { date: new Date().toISOString(), actorName: student.name, action: 'Submitted Request' }
      ]
    };
    all.unshift(newReq);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return newReq;
  },

  updateRequest: (reqId: string, updates: Partial<RequestItem>): RequestItem | null => {
    const all = storageService.getAllRequests();
    const idx = all.findIndex(r => r.id === reqId);
    if (idx === -1) return null;

    const updated = { ...all[idx], ...updates };
    all[idx] = updated;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return updated;
  },

  approveRequest: (request: RequestItem, actor: User, comment: string): RequestItem | null => {
    let nextStage = request.currentStage;
    let nextStatus = RequestStatus.PENDING;

    // Workflow Logic
    if (request.currentStage === RequestStage.FACULTY_REVIEW) nextStage = RequestStage.HOD_REVIEW;
    else if (request.currentStage === RequestStage.HOD_REVIEW) nextStage = RequestStage.STUDENT_AFFAIRS_APPROVAL;
    else if (request.currentStage === RequestStage.STUDENT_AFFAIRS_APPROVAL) {
      nextStage = RequestStage.COMPLETED;
      nextStatus = RequestStatus.APPROVED;
    }

    const log: LogEntry = {
      date: new Date().toISOString(),
      actorName: actor.name,
      action: `Approved (${actor.role})`,
      comment
    };

    return storageService.updateRequest(request.id, {
      currentStage: nextStage,
      status: nextStatus,
      logs: [...request.logs, log]
    });
  },

  rejectRequest: (request: RequestItem, actor: User, comment: string): RequestItem | null => {
    const log: LogEntry = {
      date: new Date().toISOString(),
      actorName: actor.name,
      action: `Rejected (${actor.role})`,
      comment
    };

    return storageService.updateRequest(request.id, {
      status: RequestStatus.REJECTED,
      currentStage: RequestStage.COMPLETED,
      logs: [...request.logs, log]
    });
  }
};