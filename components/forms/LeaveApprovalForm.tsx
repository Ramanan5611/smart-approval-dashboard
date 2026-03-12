import React, { useState, useEffect } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { apiService } from '../../services/apiService';
import toast from 'react-hot-toast';

interface Props {
    onBack: () => void;
    onSuccess: () => void;
}

const LeaveApprovalForm: React.FC<Props> = ({ onBack, onSuccess }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [approvers, setApprovers] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        studentRegistrationNumber: '',
        fromDate: '',
        fromTime: '',
        toDate: '',
        toTime: '',
        selectedApproverId: '',
    });

    useEffect(() => {
        const fetchApprovers = async () => {
            try {
                const data = await apiService.getApprovers();
                setApprovers(data);
            } catch (error) {
                console.error('Failed to fetch approvers:', error);
            }
        };
        fetchApprovers();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title || !formData.description || !formData.studentRegistrationNumber ||
            !formData.fromDate || !formData.fromTime || !formData.toDate || !formData.toTime || !formData.selectedApproverId) {
            toast.error('Please fill all required fields');
            return;
        }

        try {
            setIsSubmitting(true);
            await apiService.createRequest({
                title: formData.title,
                description: formData.description,
                requestType: 'leave', // matches enum or logic
                studentRegistrationNumber: formData.studentRegistrationNumber,
                fromDate: formData.fromDate,
                fromTime: formData.fromTime,
                toDate: formData.toDate,
                toTime: formData.toTime,
                needsFacultyApproval: true,
                needsHodApproval: false,
                needsOdApproval: false,
                needsLeaveApproval: true,
                selectedFacultyId: formData.selectedApproverId,
            });
            toast.success('Leave Request submitted successfully');
            onSuccess();
        } catch (error) {
            toast.error('Failed to submit leave request');
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fade-in">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-500 bg-slate-100">
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Leave Approval Request</h2>
                    <p className="text-slate-500 text-xs">Apply for academic leave within specific dates</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Request Title *</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Medical Leave for 2 days"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Reason / Description *</label>
                        <textarea
                            required
                            rows={4}
                            placeholder="Please provide detailed reason for the leave..."
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Select Approving Faculty/HOD *</label>
                        <select
                            required
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            value={formData.selectedApproverId}
                            onChange={(e) => setFormData({ ...formData, selectedApproverId: e.target.value })}
                        >
                            <option value="">Select a member</option>
                            {approvers.map((approver) => (
                                <option key={approver.id} value={approver.id}>
                                    {approver.name} ({approver.role})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Student Registration Number *</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. 21BCE1234"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            value={formData.studentRegistrationNumber}
                            onChange={(e) => setFormData({ ...formData, studentRegistrationNumber: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">From Date *</label>
                        <input
                            type="date"
                            required
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            value={formData.fromDate}
                            onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">From Time *</label>
                        <input
                            type="time"
                            required
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            value={formData.fromTime}
                            onChange={(e) => setFormData({ ...formData, fromTime: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">To Date *</label>
                        <input
                            type="date"
                            required
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            value={formData.toDate}
                            onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">To Time *</label>
                        <input
                            type="time"
                            required
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            value={formData.toTime}
                            onChange={(e) => setFormData({ ...formData, toTime: e.target.value })}
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={onBack}
                        className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors mr-3"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium shadow-lg shadow-blue-200 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <Send size={18} />
                        )}
                        Submit Request
                    </button>
                </div>
            </form>
        </div>
    );
};

export default LeaveApprovalForm;
