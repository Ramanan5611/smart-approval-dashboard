import React from 'react';
import { FileText, Mail, Calendar } from 'lucide-react';

interface Props {
    onSelectType: (type: 'leave' | 'od' | 'mailid') => void;
    onCancel: () => void;
}

const RequestSelection: React.FC<Props> = ({ onSelectType, onCancel }) => {
    return (
        <div className="fade-in">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-800">New Request Selection</h2>
                <p className="text-slate-500 text-sm mt-1">Select a category below to provide specific details for your request.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">

                {/* OD Approval Card */}
                <button
                    onClick={() => onSelectType('od')}
                    className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-purple-300 transition-all text-left flex flex-col h-full group"
                >
                    <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                        <Calendar size={24} />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">On-Duty (OD) Approval</h3>
                    <p className="text-slate-500 text-sm flex-1">Apply for OD for external events, internal events, internships, or other official academic activities.</p>
                </button>

                {/* Leave Approval Card */}
                <button
                    onClick={() => onSelectType('leave')}
                    className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:blue-300 transition-all text-left flex flex-col h-full group"
                >
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <FileText size={24} />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">Leave Approval</h3>
                    <p className="text-slate-500 text-sm flex-1">Apply for academic leave including specific date and time ranges.</p>
                </button>

                {/* Mail ID Unblock Card */}
                <button
                    onClick={() => onSelectType('mailid')}
                    className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:amber-300 transition-all text-left flex flex-col h-full group"
                >
                    <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center mb-4 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                        <Mail size={24} />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">Mail ID Unblock</h3>
                    <p className="text-slate-500 text-sm flex-1">Request access restoration for university email accounts due to policy flags or security locks.</p>
                </button>

            </div>

            <div className="flex justify-end">
                <button
                    onClick={onCancel}
                    className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors font-medium"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default RequestSelection;
