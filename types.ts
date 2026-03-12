export enum UserRole {
  STUDENT = 'STUDENT',
  FACULTY = 'FACULTY',
  HOD = 'HOD',
  STUDENT_AFFAIRS = 'STUDENT_AFFAIRS',
  ADMIN = 'ADMIN'
}

export enum RequestStage {
  SUBMITTED = 'SUBMITTED',
  FACULTY_REVIEW = 'FACULTY_REVIEW',
  HOD_REVIEW = 'HOD_REVIEW',
  STUDENT_AFFAIRS_APPROVAL = 'STUDENT_AFFAIRS_APPROVAL',
  COMPLETED = 'COMPLETED'
}

export enum RequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
}

export interface LogEntry {
  date: string;
  actorName: string;
  action: string;
  comment?: string;
}

export interface RequestItem {
  id: string;
  studentId: string;
  studentName: string;
  title: string;
  description: string;
  currentStage: RequestStage;
  status: RequestStatus;
  logs: LogEntry[];
  complianceScore?: number;
  complianceReason?: string;
  createdAt: string;
  requestType?: string;
  priority?: string;
  studentIdNumber?: string;
  needsFacultyApproval?: boolean;
  needsHodApproval?: boolean;
  needsOdApproval?: boolean;
  needsLeaveApproval?: boolean;
  needsMailIdUnblock?: boolean;
  email?: string;
  phone?: string;
  mailIdReason?: string;
  additionalNotes?: string;

  // New specific fields
  eventType?: string;
  eventId?: string;
  studentRegistrationNumber?: string;
  eventStatusImageUrl?: string;
  fromDate?: string;
  fromTime?: string;
  toDate?: string;
  toTime?: string;
  enteredMailId?: string;
  documents?: Array<{
    name: string;
    size: number;
    type: string;
    uploadedAt: string;
  }>;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}