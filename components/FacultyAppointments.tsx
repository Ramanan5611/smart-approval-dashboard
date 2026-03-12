import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { apiService } from '../services/apiService';
import { Calendar, Clock, User as UserIcon, Mail, MapPin, Video, Check, X, Filter, Search as SearchIcon } from 'lucide-react';

interface Appointment {
  id: string;
  studentId: string;
  studentName: string;
  facultyId: string;
  facultyName: string;
  hodId?: string;
  hodName?: string;
  studentAffairsId?: string;
  studentAffairsName?: string;
  date: string;
  time: string;
  duration: string;
  purpose: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  meetingType: 'IN_PERSON' | 'VIDEO_CALL';
  location?: string;
  videoLink?: string;
  createdAt: string;
}

interface Props {
  user: User;
  onBack: () => void;
}

const FacultyAppointments: React.FC<Props> = ({ user, onBack }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const data = await apiService.getAppointments();
      setAppointments(data);
      setLoading(false);
    } catch (error) {
      setError('Failed to load appointments');
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-700 border-green-200';
      case 'PENDING': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
      case 'COMPLETED': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getMeetingTypeIcon = (type: string) => {
    return type === 'VIDEO_CALL' ? <Video size={16} /> : <MapPin size={16} />;
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'FACULTY': return 'Faculty Advisor';
      case 'HOD': return 'Head of Department';
      case 'STUDENT_AFFAIRS': return 'Student Affairs';
      case 'ADMIN': return 'Administrator';
      default: return role;
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = !searchTerm ||
      apt.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.purpose.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || apt.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStats = () => {
    const total = filteredAppointments.length;
    const pending = filteredAppointments.filter(apt => apt.status === 'PENDING').length;
    const confirmed = filteredAppointments.filter(apt => apt.status === 'CONFIRMED').length;
    const completed = filteredAppointments.filter(apt => apt.status === 'COMPLETED').length;
    const cancelled = filteredAppointments.filter(apt => apt.status === 'CANCELLED').length;

    return { total, pending, confirmed, completed, cancelled };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">My Appointments</h2>
          <p className="text-slate-500 mt-1">
            {user.role === UserRole.FACULTY ? 'View appointments assigned to you' :
              user.role === UserRole.HOD ? 'View appointments assigned to you' :
                user.role === UserRole.STUDENT_AFFAIRS ? 'View appointments assigned to you' :
                  'View all appointments'}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="text-2xl font-black text-slate-800">{getStats().total}</div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Total</div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="text-2xl font-black text-amber-600">{getStats().pending}</div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Pending</div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="text-2xl font-black text-green-600">{getStats().confirmed}</div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Confirmed</div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="text-2xl font-black text-blue-600">{getStats().completed}</div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Completed</div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="text-2xl font-black text-red-600">{getStats().cancelled}</div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Cancelled</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all"
                placeholder="Search by student name or purpose..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="md:w-48">
            <select
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm cursor-pointer transition-all"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-800">
            Appointments ({filteredAppointments.length})
          </h3>
        </div>

        {filteredAppointments.length === 0 ? (
          <div className="p-20 text-center text-slate-500">
            <Calendar size={64} className="mx-auto mb-4 text-slate-200" />
            <p className="text-lg font-medium text-slate-600">No appointments found.</p>
            <p className="text-sm mt-2 text-slate-400">No appointments have been assigned to you yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filteredAppointments.map((appointment) => (
              <div key={appointment.id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <h4 className="font-bold text-slate-800 text-lg">{appointment.purpose}</h4>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <UserIcon size={16} className="text-blue-500" />
                        <span className="font-medium text-slate-700">{appointment.studentName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-blue-500" />
                        <span>{new Date(appointment.date).toLocaleDateString()} at {appointment.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-blue-500" />
                        <span>{appointment.duration} mins</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getMeetingTypeIcon(appointment.meetingType)}
                        <span>{appointment.meetingType === 'VIDEO_CALL' ? 'Video Call' : 'In Person'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    {appointment.videoLink && (
                      <a 
                        href={appointment.videoLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex-1 md:flex-none px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-bold text-center"
                      >
                        Join Call
                      </a>
                    )}
                    {appointment.location && (
                       <span className="flex-1 md:flex-none px-4 py-2 bg-slate-50 text-slate-600 rounded-lg text-sm flex items-center gap-2">
                         <MapPin size={14} /> {appointment.location}
                       </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FacultyAppointments;
