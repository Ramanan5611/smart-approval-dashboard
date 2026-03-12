import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, RequestItem, RequestStatus, UserRole } from '../types';
import { apiService, API_BASE_URL } from '../services/apiService';
import RequestModal from './RequestModal';
import AppointmentBooking from './AppointmentBooking';
import FacultyAppointments from './FacultyAppointments';
import RequestSelection from './RequestSelection';
import SettingsPage from './SettingsPage';
import LeaveApprovalForm from './forms/LeaveApprovalForm';
import OdApprovalForm from './forms/OdApprovalForm';
import MailIdUnblockForm from './forms/MailIdUnblockForm';
import SkeletonTable from './SkeletonTable';
import toast from 'react-hot-toast';
import { Plus, Search, FileText, CheckCircle, Clock, Ban, LogOut, Upload, X, Users, Calendar, Bell, Settings, RefreshCw, TrendingUp, Activity, Home, User as UserIcon } from 'lucide-react';

// Type definitions for file handling
interface FileList {
  [index: string]: File;
}

interface Props {
  user: User;
  onLogout: () => void;
  onShowUsersPage?: () => void;
}

const Dashboard: React.FC<Props> = ({ user, onLogout, onShowUsersPage }) => {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAppointments, setShowAppointments] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'ALL'>('ALL');
  const [notifications, setNotifications] = useState<string[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [activityFeed, setActivityFeed] = useState<string[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const refreshInterval = useRef<NodeJS.Timeout | null>(null);

  // View State for simplified navigation
  const [activeView, setActiveView] = useState<'dashboard' | 'request-selection' | 'leave-form' | 'od-form' | 'mailid-form' | 'appointments' | 'settings'>('dashboard');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiService.getRequests();
      setRequests(data);
      setLastUpdate(new Date());

      // Add activity feed entry
      const newActivity = `Data refreshed at ${new Date().toLocaleTimeString()}`;
      setActivityFeed(prev => [newActivity, ...prev.slice(0, 4)]);

      // Check for new notifications
      const pendingCount = data.filter(r => r.status === RequestStatus.PENDING &&
        (user.role === UserRole.FACULTY || user.role === UserRole.HOD || user.role === UserRole.STUDENT_AFFAIRS || user.role === UserRole.ADMIN)).length;

      if (pendingCount > 0) {
        setNotifications([`${pendingCount} requests pending approval`]);
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to load requests:', error);
      setLoading(false);
    }
  }, [user.role]);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh) {
      refreshInterval.current = setInterval(loadData, 30000); // Refresh every 30 seconds
    } else {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    }

    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, [autoRefresh, loadData]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Removed legacy handeCreate/resetForm

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case RequestStatus.APPROVED: return 'bg-green-100 text-green-700 border-green-200';
      case RequestStatus.REJECTED: return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  // Request Table Component for reuse
  const RequestTable: React.FC<{ requests: RequestItem[], user: User, onAction: (request: RequestItem) => void, emptyMessage: string }> = ({ requests, user, onAction, emptyMessage }) => {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase bg-slate-50">
              <th className="p-4 font-semibold">ID</th>
              <th className="p-4 font-semibold">Title</th>
              {user.role !== UserRole.STUDENT && <th className="p-4 font-semibold">Student</th>}
              <th className="p-4 font-semibold">Stage</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold">Submitted</th>
              <th className="p-4 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {requests.length === 0 ? (
              <tr>
                <td colSpan={user.role !== UserRole.STUDENT ? 7 : 6} className="p-12 text-center bg-white">
                  <div className="flex flex-col items-center justify-center text-slate-500 py-8">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                      <FileText size={28} className="text-slate-300" />
                    </div>
                    <p className="font-medium text-slate-700 text-lg mb-1">{emptyMessage}</p>
                    <p className="text-sm text-slate-400 max-w-sm mx-auto">We couldn't find any data matching this view. Check back later or adjust your filters.</p>
                  </div>
                </td>
              </tr>
            ) : (
              requests.map(request => (
                <tr
                  key={request.id}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedRequest(request);
                    setIsModalOpen(true);
                  }}
                >
                  <td className="p-4 text-sm font-medium text-slate-900">#{request.id}</td>
                  <td className="p-4">
                    <div>
                      <div className="font-medium text-slate-900">{request.title}</div>
                      <div className="text-sm text-slate-500 truncate max-w-xs">{request.description}</div>
                    </div>
                  </td>
                  {user.role !== UserRole.STUDENT && (
                    <td className="p-4 text-sm text-slate-600">{request.studentName || 'Unknown'}</td>
                  )}
                  <td className="p-4 text-sm text-slate-600">{request.currentStage || 'SUBMITTED'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-600">{new Date(request.createdAt).toLocaleDateString()}</td>
                  <td className="p-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRequest(request);
                        setIsModalOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // Filter requests based on user role and approval requirements
  const getFilteredRequests = () => {
    if (user.role === UserRole.STUDENT) {
      return requests;
    }

    return requests.filter(request => {
      // For faculty - show requests requiring faculty approval
      if (user.role === UserRole.FACULTY) {
        return request.needsFacultyApproval;
      }

      // For HOD - show requests requiring HOD approval
      if (user.role === UserRole.HOD) {
        return request.needsHodApproval;
      }

      // For Student Affairs - show requests requiring OD approval
      if (user.role === UserRole.STUDENT_AFFAIRS) {
        return request.needsOdApproval;
      }

      // For admin - show all requests
      return true;
    });
  };

  // Get requests by type for separate sections
  const getRequestsByType = (type: string) => {
    // For students, return empty - they don't see approval sections
    if (user.role === UserRole.STUDENT) {
      return [];
    }

    // For admin, show all requests by type
    if (user.role === UserRole.ADMIN) {
      return requests.filter(request => {
        if (type === 'mailid') return request.requestType === 'mailid' || request.needsMailIdUnblock;
        if (type === 'leave') return request.requestType === 'leave' || request.needsLeaveApproval;
        if (type === 'od') return request.requestType === 'od' || request.needsOdApproval;
        return false;
      });
    }

    // For approval staff, show requests by type
    // Faculty should see leave requests, and they process the first stage of OD requests
    if (user.role === UserRole.FACULTY) {
      return requests.filter(request => {
        if (type === 'leave') return request.requestType === 'leave' || request.needsLeaveApproval;
        if (type === 'od') return request.requestType === 'od' || request.needsOdApproval;
        return false;
      });
    }

    // HOD should see OD requests
    if (user.role === UserRole.HOD) {
      return requests.filter(request => {
        if (type === 'od') return request.requestType === 'od' || request.needsOdApproval;
        return false;
      });
    }

    // Student Affairs should see OD requests and Mailid requests
    if (user.role === UserRole.STUDENT_AFFAIRS) {
      return requests.filter(request => {
        if (type === 'od') return request.requestType === 'od' || request.needsOdApproval;
        if (type === 'mailid') return request.requestType === 'mailid' || request.needsMailIdUnblock;
        return false;
      });
    }

    return [];
  };

  const filteredRequests = getFilteredRequests().filter(req => {
    const matchesSearch = !searchTerm ||
      req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.studentName && req.studentName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter;

    return matchesSearch && matchesStatus;
  });


  return (
    <div className="min-h-screen flex bg-slate-50 gradient-mesh overflow-hidden">

      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full z-20 shadow-2xl">
        <div className="p-6 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 blur-lg rounded-lg"></div>
              <img src="/logo.png" alt="Logo" className="w-10 h-10 relative z-10 rounded-lg drop-shadow-lg" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tighter leading-tight">Smart Approval</h2>
              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-0.5">Dashboard</p>
            </div>
          </div>
        </div>

        <div className="p-6 flex-1">
          <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-5 mb-8 border border-slate-700/50 hover-lift">
            <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mb-2 opacity-60">Status</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                <UserIcon size={20} />
              </div>
              <div>
                <p className="font-bold text-white truncate leading-tight">{user.name}</p>
                <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full text-white font-bold uppercase tracking-tighter ${user.role === UserRole.STUDENT_AFFAIRS ? 'bg-purple-600' :
                  user.role === UserRole.ADMIN ? 'bg-indigo-600' :
                    user.role === UserRole.HOD ? 'bg-amber-500' :
                      user.role === UserRole.FACULTY ? 'bg-blue-500' : 'bg-green-500'}`}>
                  {user.role}
                </span>
              </div>
            </div>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => setActiveView('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${activeView === 'dashboard' ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20' : 'text-slate-400 border-transparent hover:bg-slate-800 hover:text-white'}`}>
              <Home size={18} />
              <span className="font-medium">Dashboard</span>
            </button>
            {user.role === UserRole.STUDENT && (
              <button
                onClick={() => setActiveView('request-selection')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all group ${['request-selection', 'leave-form', 'od-form', 'mailid-form'].includes(activeView) ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-500/20' : 'text-slate-400 border-transparent hover:bg-slate-800 hover:text-white'}`}
              >
                <Plus size={18} className={`${['request-selection', 'leave-form', 'od-form', 'mailid-form'].includes(activeView) ? 'text-white' : 'text-emerald-500'} group-hover:scale-110 transition-transform`} />
                <span className="font-medium">Submit Request</span>
              </button>
            )}
            {(user.role === UserRole.STUDENT || user.role === UserRole.FACULTY || user.role === UserRole.HOD || user.role === UserRole.STUDENT_AFFAIRS) && (
              <button
                onClick={() => setActiveView('appointments')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${activeView === 'appointments' ? 'bg-indigo-600/10 text-indigo-400 border-indigo-600/20 shadow-lg' : 'text-slate-300 border-transparent hover:bg-slate-800'}`}
              >
                <Calendar size={18} />
                <span className="font-medium">Appointments</span>
              </button>
            )}
            {user.role === UserRole.ADMIN && onShowUsersPage && (
              <button
                onClick={onShowUsersPage}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors"
              >
                <Users size={18} />
                <span className="font-medium">User Management</span>
              </button>
            )}
          </nav>
        </div>

        <div className="p-6 border-t border-slate-700">
          <button onClick={onLogout} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8">

        {/* Header - Only visible on main dashboard */}
        {activeView === 'dashboard' && (
          <header className="mb-8">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">
                    {user.role === UserRole.STUDENT_AFFAIRS ? 'Student Affairs Dashboard' : user.role === UserRole.ADMIN ? 'Admin Dashboard' : 'My Dashboard'}
                  </h2>
                  <p className="text-slate-500 mt-1">
                    {user.role === UserRole.ADMIN ? 'System administration and user management' : 'Track your requests and approvals'}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                    <Activity size={12} />
                    <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
                    {loading && <RefreshCw size={12} className="animate-spin" />}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Auto-refresh toggle */}
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`p-2 rounded-lg transition-colors ${autoRefresh ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-600'}`}
                  title={autoRefresh ? 'Auto-refresh enabled' : 'Auto-refresh disabled'}
                >
                  <RefreshCw size={18} className={autoRefresh ? 'animate-spin' : ''} />
                </button>

                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors relative"
                  >
                    <Bell size={18} />
                    {notifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
                      <div className="p-3 border-b border-slate-100">
                        <h4 className="font-semibold text-slate-800">Notifications</h4>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className="p-3 text-slate-500 text-sm">No new notifications</p>
                        ) : (
                          notifications.map((notif, index) => (
                            <div key={index} className="p-3 text-sm text-slate-600 border-b border-slate-50 last:border-b-0">
                              {notif}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Settings */}
                <button 
                  onClick={() => setActiveView('settings')}
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                  title="Account Settings"
                >
                  <Settings size={18} />
                </button>
              </div>
            </div>
          </header>
        )}

        {/* Stats Grid - Only visible on main dashboard */}
        {activeView === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="glass-card p-6 rounded-2xl flex items-center gap-5 card-hover fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="p-4 bg-amber-100/80 text-amber-600 rounded-2xl"><Clock size={28} /></div>
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Pending</p>
                <p className="text-3xl font-black text-slate-800">
                  {requests.filter(r => r.status === RequestStatus.PENDING).length}
                </p>
              </div>
            </div>
            <div className="glass-card p-6 rounded-2xl flex items-center gap-5 card-hover fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="p-4 bg-green-100/80 text-green-600 rounded-2xl"><CheckCircle size={28} /></div>
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Approved</p>
                <p className="text-3xl font-black text-slate-800">
                  {requests.filter(r => r.status === RequestStatus.APPROVED).length}
                </p>
              </div>
            </div>
            <div className="glass-card p-6 rounded-2xl flex items-center gap-5 card-hover fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="p-4 bg-red-100/80 text-red-600 rounded-2xl"><Ban size={28} /></div>
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Rejected</p>
                <p className="text-3xl font-black text-slate-800">
                  {requests.filter(r => r.status === RequestStatus.REJECTED).length}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Student Action Button - Always visible on dashboard for students */}
        {user.role === UserRole.STUDENT && activeView === 'dashboard' && (
          <div className="mb-8">
            <button
              onClick={() => setActiveView('request-selection')}
              className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-lg hover-lift"
            >
              <Plus size={20} />
              Submit New Request
            </button>
          </div>
        )}

        {/* Conditional View Rendering below Stats/Header */}
        {activeView === 'dashboard' ? (
          <>
            {/* Activity Feed */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <TrendingUp size={18} />
                  Recent Activity
                </h3>
                <button
                  onClick={loadData}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </div>
              <div className="space-y-2">
                {activityFeed.length === 0 ? (
                  <p className="text-slate-500 text-sm">No recent activity</p>
                ) : (
                  activityFeed.map((activity, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-slate-600 p-2 bg-slate-50 rounded">
                      <Activity size={14} />
                      <span>{activity}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Request Tables Based on Role */}
            {user.role !== UserRole.STUDENT ? (
              <div className="space-y-8">
                {/* Leave Apply Requests */}
                {(user.role === UserRole.FACULTY || user.role === UserRole.ADMIN) && (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-green-50/50">
                      <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        Leave Apply Requests
                      </h3>
                    </div>
                    {loading ? <SkeletonTable columns={7} rows={3} /> : (
                      <RequestTable requests={getRequestsByType('leave')} user={user} onAction={setSelectedRequest} emptyMessage="No leave requests." />
                    )}
                  </div>
                )}
                
                {/* Mail ID Unblock */}
                {(user.role === UserRole.STUDENT_AFFAIRS || user.role === UserRole.ADMIN) && (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-red-50/50">
                      <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        Mail ID Unblock Requests
                      </h3>
                    </div>
                    {loading ? <SkeletonTable columns={7} rows={3} /> : (
                      <RequestTable requests={getRequestsByType('mailid')} user={user} onAction={setSelectedRequest} emptyMessage="No mail unblock requests." />
                    )}
                  </div>
                )}

                {/* OD Approval */}
                {(user.role === UserRole.FACULTY || user.role === UserRole.HOD || user.role === UserRole.STUDENT_AFFAIRS || user.role === UserRole.ADMIN) && (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-purple-50/50">
                      <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        OD Approval Requests
                      </h3>
                    </div>
                    {loading ? <SkeletonTable columns={7} rows={3} /> : (
                      <RequestTable requests={getRequestsByType('od')} user={user} onAction={setSelectedRequest} emptyMessage="No OD requests." />
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Student's personal requests table */
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="font-semibold text-slate-800">My Requests</h3>
                  <div className="flex gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="text" placeholder="Search requests..."
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                      />
                    </div>
                  </div>
                </div>

                {loading ? <div className="p-4"><SkeletonTable columns={6} rows={5} /></div> : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase bg-slate-50">
                          <th className="p-4 font-semibold">ID</th>
                          <th className="p-4 font-semibold">Title</th>
                          <th className="p-4 font-semibold">Stage</th>
                          <th className="p-4 font-semibold">Status</th>
                          <th className="p-4 font-semibold">Submitted</th>
                          <th className="p-4 font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredRequests.length === 0 ? (
                          <tr><td colSpan={6} className="p-8 text-center text-slate-500">No requests found.</td></tr>
                        ) : (
                          filteredRequests.map(request => (
                            <tr key={request.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => { setSelectedRequest(request); setIsModalOpen(true); }}>
                              <td className="p-4 text-sm font-medium text-slate-900">#{request.id}</td>
                              <td className="p-4">
                                <div className="font-medium text-slate-900">{request.title}</div>
                                <div className="text-xs text-slate-500 truncate max-w-xs">{request.description}</div>
                              </td>
                              <td className="p-4 text-sm text-slate-600">{request.currentStage || 'SUBMITTED'}</td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getStatusColor(request.status)}`}>
                                  {request.status}
                                </span>
                              </td>
                              <td className="p-4 text-sm text-slate-600">{new Date(request.createdAt).toLocaleDateString()}</td>
                              <td className="p-4">
                                <button className="text-blue-600 hover:text-blue-800 text-xs font-bold uppercase tracking-wider">Details</button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )
 : activeView === 'request-selection' ? (
          <RequestSelection 
            onSelectType={(type) => setActiveView(`${type}-form` as any)} 
            onCancel={() => setActiveView('dashboard')} 
          />
        ) : activeView === 'leave-form' ? (
          <LeaveApprovalForm 
            onBack={() => setActiveView('request-selection')} 
            onSuccess={() => { setActiveView('dashboard'); loadData(); }} 
          />
        ) : activeView === 'od-form' ? (
          <OdApprovalForm 
            onBack={() => setActiveView('request-selection')} 
            onSuccess={() => { setActiveView('dashboard'); loadData(); }} 
          />
        ) : activeView === 'mailid-form' ? (
          <MailIdUnblockForm 
            onBack={() => setActiveView('request-selection')} 
            onSuccess={() => { setActiveView('dashboard'); loadData(); }} 
          />
        ) : activeView === 'settings' ? (
          <SettingsPage user={user} onBack={() => setActiveView('dashboard')} />
        ) : activeView === 'appointments' ? (
          user.role === UserRole.STUDENT ? (
            <AppointmentBooking user={user} onBack={() => setActiveView('dashboard')} />
          ) : (
            <FacultyAppointments user={user} onBack={() => setActiveView('dashboard')} />
          )
        ) : null}
      </main>

      {/* Detail Modal */}
      <RequestModal
        request={selectedRequest}
        user={user}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={loadData}
      />
    </div>
  );
};

export default Dashboard;