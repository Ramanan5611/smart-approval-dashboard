import React, { useState, useEffect } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { apiService } from '../../services/apiService';
import toast from 'react-hot-toast';

interface Props {
    onBack: () => void;
    onSuccess: () => void;
}

const MailIdUnblockForm: React.FC<Props> = ({ onBack, onSuccess }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [approvers, setApprovers] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        studentRegistrationNumber: '',
        enteredMailId: '',
        mailIdReason: '',
        description: '',
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

        if (!formData.studentRegistrationNumber || !formData.enteredMailId || !formData.mailIdReason || !formData.selectedApproverId || !formData.description) {
            toast.error('Please fill all required fields');
            return;
        }

        try {
            setIsSubmitting(true);
            await apiService.createRequest({
                title: `Mail ID Unblock Request for ${formData.enteredMailId}`,
                description: `Reason: ${formData.mailIdReason}. Details: ${formData.description}`,
                requestType: 'mailid',
                mailIdReason: formData.mailIdReason,
                enteredMailId: formData.enteredMailId,
                studentRegistrationNumber: formData.studentRegistrationNumber,
                needsFacultyApproval: false,
                needsHodApproval: false,
                needsOdApproval: false,
                needsLeaveApproval: false,
                needsMailIdUnblock: true,
                selectedFacultyId: formData.selectedApproverId,
            });
            toast.success('Mail ID Unblock Request submitted successfully');
            onSuccess();
        } catch (error) {
            toast.error('Failed to submit Mail ID request');
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
                    <h2 className="text-xl font-bold text-slate-800">Mail ID Unblock Request</h2>
                    <p className="text-slate-500 text-xs">Request access restoration for university email accounts</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Select Approving Faculty/HOD *</label>
                        <select
                            required
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
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
                        <label className="block text-sm font-medium text-slate-700 mb-1">Reason for block / Description *</label>
                        <textarea
                            required
                            rows={3}
                            placeholder="Why was the email blocked? Provide relevant context..."
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Specific Reason for Mail ID Block *</label>
                        <select
                            required
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                            value={formData.mailIdReason}
                            onChange={(e) => setFormData({ ...formData, mailIdReason: e.target.value })}
                        >
                            <option value="">Select Reason...</option>
                            <option value="Password Reset Limit Exceeded">Password Reset Limit Exceeded</option>
                            <option value="Suspicious Activity Detected">Suspicious Activity Detected</option>
                            <option value="Inactivity / Dormant Account">Inactivity / Dormant Account</option>
                            <option value="Policy Violation">Policy Violation</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Blocked Email Address *</label>
                        <input
                            type="email"
                            required
                            placeholder="student@example.edu"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                            value={formData.enteredMailId}
                            onChange={(e) => setFormData({ ...formData, enteredMailId: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Student Registration Number *</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. 21BCE1234"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                            value={formData.studentRegistrationNumber}
                            onChange={(e) => setFormData({ ...formData, studentRegistrationNumber: e.target.value })}
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
                        className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg font-medium shadow-lg shadow-amber-200 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
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

export default MailIdUnblockForm;
