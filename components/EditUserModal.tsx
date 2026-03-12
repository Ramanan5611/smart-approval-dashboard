import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { X, Save, Key, User as UserIcon, Mail, Shield } from 'lucide-react';

interface Props {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: Partial<User>) => void;
  onResetPassword: (userId: string, newPassword: string) => void;
  isAdmin?: boolean;
}

const EditUserModal: React.FC<Props> = ({ user, isOpen, onClose, onSave, onResetPassword, isAdmin = true }) => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    role: UserRole.STUDENT
  });
  const [resetPasswordData, setResetPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        name: user.name,
        username: user.username,
        role: user.role
      });
      setResetPasswordData({ newPassword: '', confirmPassword: '' });
      setShowPasswordReset(false);
      setErrors({});
    }
  }, [user, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (showPasswordReset) {
      if (!resetPasswordData.newPassword) {
        newErrors.newPassword = 'New password is required';
      } else if (resetPasswordData.newPassword.length < 6) {
        newErrors.newPassword = 'Password must be at least 6 characters';
      }

      if (!resetPasswordData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm the password';
      } else if (resetPasswordData.newPassword !== resetPasswordData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;
    if (!user) return;

    // Save user details
    onSave(formData);

    // Reset password if enabled
    if (showPasswordReset && resetPasswordData.newPassword) {
      onResetPassword(user.id, resetPasswordData.newPassword);
    }

    onClose();
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

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="p-6 border-b flex justify-between items-start bg-slate-50 rounded-t-xl">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Edit User</h2>
            <p className="text-sm text-slate-500">Modify user details and reset password</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Current User Info */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center text-lg">
                👤
              </div>
              <div>
                <div className="font-medium text-slate-800">{user.name}</div>
                <div className="text-sm text-slate-500">ID: {user.id}</div>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRoleColor(user.role)}`}>
              {user.role}
            </span>
          </div>

          {/* Edit Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <UserIcon size={16} className="inline mr-1" />
                Full Name
              </label>
              <input
                type="text"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${errors.name ? 'border-red-300' : 'border-slate-300'
                  }`}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter full name"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <Mail size={16} className="inline mr-1" />
                Username
              </label>
              <input
                type="text"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${errors.username ? 'border-red-300' : 'border-slate-300'
                  }`}
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Enter username"
              />
              {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <Shield size={16} className="inline mr-1" />
                Role {isAdmin && '(Cannot be changed)'}
              </label>
              <select
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${isAdmin ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed' : 'border-slate-300'
                  }`}
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                disabled={isAdmin}
              >
                <option value={UserRole.STUDENT}>Student</option>
                <option value={UserRole.FACULTY}>Faculty Advisor</option>
                <option value={UserRole.HOD}>Head of Department</option>
                <option value={UserRole.STUDENT_AFFAIRS}>Student Affairs</option>
                <option value={UserRole.ADMIN}>Administrator</option>
              </select>
              {isAdmin && (
                <p className="text-xs text-amber-600 mt-1">⚠️ Role changes are restricted for security reasons</p>
              )}
            </div>
          </div>

          {/* Password Reset Section */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Key size={18} />
                  Password Reset
                </h3>
                <p className="text-sm text-slate-500">Generate a new password for this user</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordReset(!showPasswordReset)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${showPasswordReset
                    ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
              >
                {showPasswordReset ? 'Cancel' : 'Reset Password'}
              </button>
            </div>

            {showPasswordReset && (
              <div className="space-y-4 bg-amber-50 p-4 rounded-lg border border-amber-200">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                  <input
                    type="password"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${errors.newPassword ? 'border-red-300' : 'border-slate-300'
                      }`}
                    value={resetPasswordData.newPassword}
                    onChange={(e) => setResetPasswordData({ ...resetPasswordData, newPassword: e.target.value })}
                    placeholder="Enter new password"
                  />
                  {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${errors.confirmPassword ? 'border-red-300' : 'border-slate-300'
                      }`}
                    value={resetPasswordData.confirmPassword}
                    onChange={(e) => setResetPasswordData({ ...resetPasswordData, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                  />
                  {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                </div>

                <div className="text-sm text-amber-800">
                  <p>⚠️ The user will need to use this new password for their next login.</p>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t bg-slate-50 rounded-b-xl">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-lg shadow-blue-200 flex items-center gap-2"
            >
              <Save size={18} />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal;
