import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { apiService } from '../services/apiService';
import { Calendar, Clock, User as UserIcon, Mail, MapPin, Video, Check, X, ChevronDown, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

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

const AppointmentBooking: React.FC<Props> = ({ user, onBack }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [faculty, setFaculty] = useState<User[]>([]);
  const [hods, setHods] = useState<User[]>([]);
  const [studentAffairs, setStudentAffairs] = useState<User[]>([]);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [facultyLoading, setFacultyLoading] = useState(true);
  const [error, setError] = useState('');

  // Debug: Log user info when component mounts
  useEffect(() => {
    console.log('AppointmentBooking - User:', user);
    console.log('AppointmentBooking - User role:', user.role);
    console.log('AppointmentBooking - Is student:', user.role === UserRole.STUDENT);
  }, [user]);

  // Form state
  const [formData, setFormData] = useState({
    facultyId: '',
    hodId: '',
    studentAffairsId: '',
    date: '',
    time: '',
    duration: '30',
    purpose: '',
    meetingType: 'IN_PERSON' as 'IN_PERSON' | 'VIDEO_CALL',
    location: '',
    videoLink: ''
  });

  useEffect(() => {
    loadAppointments();
    loadFaculty();
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

  const loadFaculty = async () => {
    try {
      setFacultyLoading(true);
      console.log('Loading faculty members...');
      const allUsers = await apiService.getAllUsers();
      console.log('All users loaded:', allUsers);

      const facultyMembers = allUsers.filter(u => u.role === UserRole.FACULTY);
      const hodMembers = allUsers.filter(u => u.role === UserRole.HOD);
      const studentAffairsMembers = allUsers.filter(u => u.role === UserRole.STUDENT_AFFAIRS);

      console.log('Faculty members:', facultyMembers);
      console.log('HOD members:', hodMembers);
      console.log('Student Affairs members:', studentAffairsMembers);

      setFaculty(facultyMembers);
      setHods(hodMembers);
      setStudentAffairs(studentAffairsMembers);
      setFacultyLoading(false);
    } catch (error) {
      console.error('Failed to load faculty:', error);
      // Fallback to mock data if API fails
      console.log('Using fallback mock data...');
      const mockFaculty = [
        { id: 'u2', username: 'faculty_adv', role: UserRole.FACULTY, name: 'Dr. Smith (Advisor)' },
      ];
      const mockHods = [
        { id: 'u3', username: 'hod_dept', role: UserRole.HOD, name: 'Prof. Jones (HOD)' },
      ];
      const mockStudentAffairs = [
        { id: 'u4', username: 'student_affairs', role: UserRole.STUDENT_AFFAIRS, name: 'Student Affairs' }
      ];

      setFaculty(mockFaculty);
      setHods(mockHods);
      setStudentAffairs(mockStudentAffairs);
      setFacultyLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const selectedFaculty = faculty.find(f => f.id === formData.facultyId);
      const selectedHod = hods.find(h => h.id === formData.hodId);
      const selectedStudentAffairs = studentAffairs.find(d => d.id === formData.studentAffairsId);

      const newAppointment: Appointment = {
        id: `appt${Date.now()}`,
        studentId: user.id,
        studentName: user.name,
        facultyId: formData.facultyId,
        facultyName: selectedFaculty?.name || '',
        hodId: formData.hodId || undefined,
        hodName: selectedHod?.name || undefined,
        studentAffairsId: formData.studentAffairsId || undefined,
        studentAffairsName: selectedStudentAffairs?.name || undefined,
        date: formData.date,
        time: formData.time,
        duration: formData.duration,
        purpose: formData.purpose,
        status: 'PENDING',
        meetingType: formData.meetingType,
        location: formData.meetingType === 'IN_PERSON' ? formData.location : undefined,
        videoLink: formData.meetingType === 'VIDEO_CALL' ? formData.videoLink : undefined,
        createdAt: new Date().toISOString()
      };

      await apiService.createAppointment(newAppointment);
      setAppointments([...appointments, newAppointment]);
      setShowBookingForm(false);
      resetForm();

      toast.success('Appointment booked successfully!');
    } catch (error) {
      setError('Failed to book appointment');
      toast.error('Failed to book appointment');
    }
  };

  const resetForm = () => {
    setFormData({
      facultyId: '',
      hodId: '',
      studentAffairsId: '',
      date: '',
      time: '',
      duration: '30',
      purpose: '',
      meetingType: 'IN_PERSON',
      location: '',
      videoLink: ''
    });
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Appointment Booking</h2>
          <p className="text-slate-500 mt-1">Schedule meetings with faculty, HODs, and deans</p>
        </div>
        <button
          onClick={() => setShowBookingForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-lg shadow-blue-200 transition-all flex items-center gap-2"
        >
          <Plus size={18} />
          Book Appointment
        </button>
      </div>

      {/* Booking Form Modal */}
      {showBookingForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-start bg-slate-50 rounded-t-xl">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Book New Appointment</h3>
                <p className="text-sm text-slate-500">Schedule a meeting with faculty members</p>
              </div>
              <button onClick={() => setShowBookingForm(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Faculty Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Faculty Advisor *</label>
                  {facultyLoading ? (
                    <div className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-500">
                      Loading faculty...
                    </div>
                  ) : (
                    <select
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      value={formData.facultyId}
                      onChange={(e) => setFormData({ ...formData, facultyId: e.target.value })}
                      required
                    >
                      <option value="">Select Faculty</option>
                      {faculty.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Head of Department</label>
                  {facultyLoading ? (
                    <div className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-500">
                      Loading HODs...
                    </div>
                  ) : (
                    <select
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      value={formData.hodId}
                      onChange={(e) => setFormData({ ...formData, hodId: e.target.value })}
                    >
                      <option value="">Select HOD (Optional)</option>
                      {hods.map(h => (
                        <option key={h.id} value={h.id}>{h.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Student Affairs</label>
                  {facultyLoading ? (
                    <div className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-500">
                      Loading Student Affairs...
                    </div>
                  ) : (
                    <select
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      value={formData.studentAffairsId}
                      onChange={(e) => setFormData({ ...formData, studentAffairsId: e.target.value })}
                    >
                      <option value="">Select Student Affairs (Optional)</option>
                      {studentAffairs.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Time *</label>
                  <input
                    type="time"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Duration</label>
                  <select
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                  </select>
                </div>
              </div>

              {/* Meeting Type and Purpose */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Meeting Type *</label>
                  <select
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value={formData.meetingType}
                    onChange={(e) => setFormData({ ...formData, meetingType: e.target.value as 'IN_PERSON' | 'VIDEO_CALL' })}
                    required
                  >
                    <option value="IN_PERSON">In Person</option>
                    <option value="VIDEO_CALL">Video Call</option>
                  </select>
                </div>

                {formData.meetingType === 'IN_PERSON' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Enter meeting location"
                    />
                  </div>
                )}

                {formData.meetingType === 'VIDEO_CALL' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Video Link</label>
                    <input
                      type="url"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      value={formData.videoLink}
                      onChange={(e) => setFormData({ ...formData, videoLink: e.target.value })}
                      placeholder="Enter video call link"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Purpose *</label>
                  <textarea
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    rows={3}
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    placeholder="Describe the purpose of this meeting"
                    required
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowBookingForm(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-lg shadow-blue-200"
                >
                  Book Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Appointments List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-semibold text-slate-800">My Appointments ({appointments.length})</h3>
        </div>

        {appointments.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Calendar size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-lg font-medium text-slate-600">No appointments scheduled yet.</p>
            <p className="text-sm mt-2">Click "Book Appointment" to schedule your first meeting.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h4 className="font-semibold text-slate-800">{appointment.purpose}</h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-blue-500" />
                        <span>{new Date(appointment.date).toLocaleDateString()} at {appointment.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-blue-500" />
                        <span>{appointment.duration} minutes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <UserIcon size={16} className="text-blue-500" />
                        <span>{appointment.facultyName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getMeetingTypeIcon(appointment.meetingType)}
                        <span>{appointment.meetingType === 'VIDEO_CALL' ? 'Video Call' : 'In Person'}</span>
                      </div>
                      {appointment.location && (
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-blue-500" />
                          <span>{appointment.location}</span>
                        </div>
                      )}
                      {appointment.videoLink && (
                        <div className="flex items-center gap-2">
                          <Video size={16} className="text-blue-500" />
                          <a href={appointment.videoLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                            Join Video Call
                          </a>
                        </div>
                      )}
                    </div>
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

export default AppointmentBooking;
