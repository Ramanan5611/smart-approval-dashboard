import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { apiService } from '../services/apiService';
import EditUserModal from './EditUserModal';
import AddUserModal from './AddUserModal';
import SettingsPage from './SettingsPage';
import SkeletonTable from './SkeletonTable';
import toast from 'react-hot-toast';
import { Users, Search, Filter, Mail, Shield, Calendar, Trash2, Edit, UserPlus, Database, Layers, ChevronLeft, ChevronRight, Settings, Menu, X } from 'lucide-react';

interface Props {
  user: User;
  onLogout: () => void;
  onBack?: () => void;
}

const UsersPage: React.FC<Props> = ({ user, onLogout, onBack }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Database Viewer State
  // Database Viewer State
  const [activeTab, setActiveTab] = useState<string>('users'); // 'users', 'collections', 'settings'
  const [collections, setCollections] = useState<string[]>([]);
  const [collectionData, setCollectionData] = useState<any[]>([]);
  const [loadingCollection, setLoadingCollection] = useState(false);

  // Pagination State
  const [userPage, setUserPage] = useState(1);
  const [collectionPage, setCollectionPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    loadUsers();
    loadCollections();
  }, []);

  useEffect(() => {
    setUserPage(1);
    filterUsers();
  }, [users, searchTerm, roleFilter]);

  useEffect(() => {
    if (activeTab !== 'users') {
      setCollectionPage(1);
      loadCollectionData(activeTab);
    }
  }, [activeTab]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await apiService.getAllUsers();
      setUsers(data);
      setLoading(false);
    } catch (error) {
      setError('Failed to load users');
      setLoading(false);
    }
  };

  const loadCollections = async () => {
    try {
      const cols = await apiService.getDatabaseCollections();
      setCollections(cols);
    } catch (error) {
      console.error('Failed to load collections:', error);
    }
  };

  const loadCollectionData = async (collectionName: string) => {
    try {
      setLoadingCollection(true);
      const data = await apiService.getCollectionData(collectionName);
      setCollectionData(data);
      setLoadingCollection(false);
    } catch (error) {
      console.error(`Failed to load data for ${collectionName}:`, error);
      setCollectionData([]);
      setLoadingCollection(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by role
    if (roleFilter !== 'ALL') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.STUDENT: return 'bg-blue-100 text-blue-700 border-blue-200';
      case UserRole.FACULTY: return 'bg-green-100 text-green-700 border-green-200';
      case UserRole.HOD: return 'bg-purple-100 text-purple-700 border-purple-200';
      case UserRole.STUDENT_AFFAIRS: return 'bg-amber-100 text-amber-700 border-amber-200';
      case UserRole.ADMIN: return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.STUDENT: return '👨‍🎓';
      case UserRole.FACULTY: return '👨‍🏫';
      case UserRole.HOD: return '👔';
      case UserRole.STUDENT_AFFAIRS: return '🎓';
      case UserRole.ADMIN: return '👑';
      default: return '👤';
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await apiService.deleteUser(userId);
      // Update local state
      setUsers(users.filter(user => user.id !== userId));
    } catch (error) {
      setError('Failed to delete user');
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleSaveUser = async (userData: Partial<User>) => {
    try {
      if (!editingUser) return;

      await apiService.updateUser(editingUser.id, userData);

      // Update local state
      setUsers(users.map(user =>
        user.id === editingUser.id
          ? { ...user, ...userData }
          : user
      ));

      setIsEditModalOpen(false);
      setEditingUser(null);
    } catch (error) {
      setError('Failed to update user');
    }
  };

  const handleResetPassword = async (userId: string, newPassword: string) => {
    try {
      await apiService.resetUserPassword(userId, newPassword);

      // Show success message
      toast.success('Password has been reset successfully!');
    } catch (error) {
      setError('Failed to reset password');
      toast.error('Failed to reset password');
    }
  };

  const handleAddUser = () => {
    setIsAddUserModalOpen(true);
  };

  const handleSaveNewUser = async (userData: { name: string; username: string; role: UserRole; password: string }) => {
    try {
      const newUser = await apiService.createUser(userData);

      // Update local state
      setUsers([...users, newUser]);
      setIsAddUserModalOpen(false);

      // Show success message
      toast.success('User created successfully!');
    } catch (error: any) {
      setError(error.message || 'Failed to add user');
      toast.error(error.message || 'Failed to add user');
    }
  };

  const getUserStats = () => {
    const stats = {
      total: users.length,
      students: users.filter(u => u.role === UserRole.STUDENT).length,
      faculty: users.filter(u => u.role === UserRole.FACULTY).length,
      hod: users.filter(u => u.role === UserRole.HOD).length,
      dean: users.filter(u => u.role === UserRole.STUDENT_AFFAIRS).length,
      admin: users.filter(u => u.role === UserRole.ADMIN).length,
    };
    return stats;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex bg-slate-100 overflow-hidden">
        <aside className="w-64 bg-slate-900 border-r border-slate-800 flex-shrink-0 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800/20 to-slate-900 animate-pulse" />
        </aside>
        <main className="flex-1 p-8">
          <div className="h-8 bg-slate-200 rounded w-64 mb-8 animate-pulse"></div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <SkeletonTable columns={6} rows={8} />
          </div>
        </main>
      </div>
    );
  }

  const stats = getUserStats();

  const renderGenericTable = () => {
    if (loadingCollection) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <SkeletonTable columns={5} rows={6} />
        </div>
      );
    }

    if (collectionData.length === 0) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-16 text-center">
          <div className="mx-auto w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-5 border border-slate-100">
            <Database className="text-slate-300" size={36} />
          </div>
          <h3 className="text-lg font-medium text-slate-800 mb-2">Empty Collection</h3>
          <p className="text-slate-500 max-w-sm mx-auto text-sm">
            This collection is currently empty. There are no documents stored here yet.
          </p>
        </div>
      );
    }

    // Collection Pagination Calculations
    const indexOfLastItem = collectionPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = collectionData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(collectionData.length / itemsPerPage);

    // Extract all unique keys from all documents to form headers
    const headers = Array.from(new Set(collectionData.flatMap(Object.keys)));

    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 text-sm bg-slate-50">
                {headers.map(header => (
                  <th key={header} className="p-4 font-semibold whitespace-nowrap">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {currentItems.map((doc, index) => (
                <tr key={doc._id || index} className="hover:bg-slate-50 transition-colors">
                  {headers.map((header: string) => {
                    const key = header as string;
                    let value = (doc as any)[key];
                    if (typeof value === 'object' && value !== null) {
                      value = JSON.stringify(value);
                    }
                    return (
                      <td key={`${index}-${header}`} className="p-4 max-w-xs truncate" title={String(value)}>
                        {String(value ?? '')}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {collectionData.length > itemsPerPage && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex flex-1 items-center justify-between">
              <p className="text-sm text-slate-700">
                Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to <span className="font-medium">{Math.min(indexOfLastItem, collectionData.length)}</span> of <span className="font-medium">{collectionData.length}</span> results
              </p>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => setCollectionPage(prev => Math.max(prev - 1, 1))}
                  disabled={collectionPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCollectionPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={collectionPage === totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </nav>
            </div>
          </div>
        )}
      </div>
    );
  };

  // User Pagination Calculations
  const indexOfLastUser = userPage * itemsPerPage;
  const indexOfFirstUser = indexOfLastUser - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalUserPages = Math.ceil(filteredUsers.length / itemsPerPage);

  return (
    <div className="min-h-screen flex bg-slate-900 gradient-mesh overflow-hidden relative">
      {/* Mobile Hamburger */}
      <button 
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-30 p-2 bg-slate-900 text-white rounded-lg shadow-lg border border-slate-800"
      >
        <Menu size={24} />
      </button>

      {/* Sidebar */}
      <aside className={`w-64 bg-slate-900 text-white flex flex-col fixed h-full z-40 shadow-2xl transition-transform duration-300 transform 
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        
        {/* Mobile Close Button */}
        <button 
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X size={24} />
        </button>
        <div className="p-6 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 blur-lg rounded-lg"></div>
              <img src="/logo.png" alt="Logo" className="w-10 h-10 relative z-10 rounded-lg drop-shadow-lg" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tighter leading-tight">Smart Approval</h2>
              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">Admin Central</p>
            </div>
          </div>
        </div>

        <div className="p-6 flex-1">
          <div className="bg-slate-800 rounded-lg p-4 mb-6">
            <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Logged in as</p>
            <p className="font-medium text-white">System Administrator</p>
            <span className="inline-block mt-2 text-xs bg-red-600 px-2 py-0.5 rounded text-white font-medium">
              ADMIN
            </span>
          </div>

          <nav className="space-y-4">
            <div>
              <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">System</p>
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'users' ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                <Users size={18} />
                <span className="font-medium">User Management</span>
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/20' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                <Settings className={activeTab === 'settings' ? 'text-indigo-400' : 'text-slate-400'} size={18} />
                <span className="font-medium">Account Settings</span>
              </button>
            </div>

            <div>
              <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-4 flex items-center gap-2">
                <Database size={14} /> Database Viewer
              </p>
              <div className="space-y-1">
                {collections.map(col => (
                  <button
                    key={col}
                    onClick={() => setActiveTab(col)}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors ${activeTab === col ? 'bg-purple-600/10 text-purple-400' : 'text-slate-400 hover:bg-slate-800'}`}
                  >
                    <Layers size={16} />
                    <span>{col}</span>
                  </button>
                ))}
                {collections.length === 0 && (
                  <p className="px-4 text-xs text-slate-500 italic">No collections found</p>
                )}
              </div>
            </div>
          </nav>
        </div>

        <div className="p-6 border-t border-slate-700 flex flex-col gap-4">
          {onBack && (
            <button onClick={onBack} className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors font-bold uppercase text-xs tracking-widest">
              <ChevronLeft size={18} />
              <span>Back to Dashboard</span>
            </button>
          )}
          <button onClick={onLogout} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <Shield size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 flex-1 p-4 lg:p-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 capitalize">
                {activeTab === 'users' ? 'Database Manager' : `${activeTab} Data`}
              </h2>
              <p className="text-slate-500 mt-1">
                {activeTab === 'users' ? 'View and manage all system users' : `Raw database documents in collection '${activeTab}'`}
              </p>
            </div>
            {activeTab === 'users' && (
              <button onClick={handleAddUser} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 shadow-lg shadow-blue-200 transition-all">
                <UserPlus size={20} />
                Add User
              </button>
            )}
          </div>
        </header>

        {activeTab === 'settings' ? (
          <SettingsPage user={user} onBack={() => setActiveTab('users')} />
        ) : activeTab === 'users' ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
                <div className="text-sm text-slate-500">Total Users</div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="text-2xl font-bold text-blue-600">{stats.students}</div>
                <div className="text-sm text-slate-500">Students</div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="text-2xl font-bold text-green-600">{stats.faculty}</div>
                <div className="text-sm text-slate-500">Faculty</div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="text-2xl font-bold text-purple-600">{stats.hod}</div>
                <div className="text-sm text-slate-500">HODs</div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="text-2xl font-bold text-amber-600">{stats.dean}</div>
                <div className="text-sm text-slate-500">Student Affairs</div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="text-2xl font-bold text-red-600">{stats.admin}</div>
                <div className="text-sm text-slate-500">Admins</div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search users by name or username..."
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="md:w-48">
                  <select
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as UserRole | 'ALL')}
                  >
                    <option value="ALL">All Roles</option>
                    <option value={UserRole.STUDENT}>Students</option>
                    <option value={UserRole.FACULTY}>Faculty</option>
                    <option value={UserRole.HOD}>HODs</option>
                    <option value={UserRole.STUDENT_AFFAIRS}>Student Affairs</option>
                    <option value={UserRole.ADMIN}>Admins</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-semibold text-slate-800">All Users ({filteredUsers.length})</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase bg-slate-50">
                      <th className="p-4 font-semibold">User</th>
                      <th className="p-4 font-semibold">Username</th>
                      <th className="p-4 font-semibold">Role</th>
                      <th className="p-4 font-semibold">Status</th>
                      <th className="p-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500">
                          {searchTerm || roleFilter !== 'ALL' ? 'No users found matching your criteria.' : 'No users found.'}
                        </td>
                      </tr>
                    ) : (
                      currentUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-lg">
                                {getRoleIcon(user.role)}
                              </div>
                              <div>
                                <div className="font-medium text-slate-800">{user.name}</div>
                                <div className="text-sm text-slate-500">ID: {user.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Mail size={14} className="text-slate-400" />
                              <span className="text-sm text-slate-600">{user.username}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRoleColor(user.role)}`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-sm text-slate-600">Active</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditUser(user)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                                title="Edit user"
                              >
                                <Edit size={14} />
                              </button>
                              {user.role !== UserRole.ADMIN && (
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="text-red-600 hover:text-red-800 text-sm font-medium hover:underline"
                                  title="Delete user"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {filteredUsers.length > itemsPerPage && (
                <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
                  <div className="flex flex-1 items-center justify-between">
                    <p className="text-sm text-slate-700">
                      Showing <span className="font-medium">{indexOfFirstUser + 1}</span> to <span className="font-medium">{Math.min(indexOfLastUser, filteredUsers.length)}</span> of <span className="font-medium">{filteredUsers.length}</span> users
                    </p>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                      <button
                        onClick={() => setUserPage(prev => Math.max(prev - 1, 1))}
                        disabled={userPage === 1}
                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 disabled:opacity-50"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setUserPage(prev => Math.min(prev + 1, totalUserPages))}
                        disabled={userPage === totalUserPages}
                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 disabled:opacity-50"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </nav>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Database size={18} className="text-purple-600" />
                Collection: {activeTab}
              </h3>
              <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                {collectionData.length} documents
              </span>
            </div>
            {renderGenericTable()}
          </div>
        )}
      </main>

      {/* Edit User Modal */}
      <EditUserModal
        user={editingUser}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingUser(null);
        }}
        onSave={handleSaveUser}
        onResetPassword={handleResetPassword}
        isAdmin={true}
      />

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onSave={handleSaveNewUser}
      />
    </div>
  );
};

export default UsersPage;
