import { UserRole, RequestStage } from './types';

export const MOCK_USERS = [
  { id: 'u1', username: 'student_user', password: 'stud123', role: UserRole.STUDENT, name: 'Alice Student' },
  { id: 'u2', username: 'faculty_adv', password: 'fac123', role: UserRole.FACULTY, name: 'Dr. Smith (Advisor)' },
  { id: 'u3', username: 'hod_dept', password: 'hod123', role: UserRole.HOD, name: 'Prof. Jones (HOD)' },
  { id: 'u4', username: 'student_admin', password: 'sa123', role: UserRole.STUDENT_AFFAIRS, name: 'Student Affairs' },
  { id: 'u5', username: 'admin_system', password: 'admin123', role: UserRole.ADMIN, name: 'System Admin' },
];

export const STAGE_ORDER = [
  RequestStage.SUBMITTED,
  RequestStage.FACULTY_REVIEW,
  RequestStage.HOD_REVIEW,
  RequestStage.STUDENT_AFFAIRS_APPROVAL,
  RequestStage.COMPLETED
];

export const STAGE_LABELS: Record<RequestStage, string> = {
  [RequestStage.SUBMITTED]: 'Draft/Submitted',
  [RequestStage.FACULTY_REVIEW]: 'Faculty Review',
  [RequestStage.HOD_REVIEW]: 'HOD Review',
  [RequestStage.STUDENT_AFFAIRS_APPROVAL]: 'Student Affairs Approval',
  [RequestStage.COMPLETED]: 'Completed',
};