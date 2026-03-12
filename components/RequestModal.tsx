import React, { useState, useEffect } from 'react';
import { RequestItem, User, UserRole, RequestStatus } from '../types';
import ProgressBar from './ProgressBar';
import { geminiService } from '../services/geminiService';
import { apiService } from '../services/apiService';
import { X, ShieldCheck, AlertTriangle, Send, FileText, Download } from 'lucide-react';

interface Props {
  request: RequestItem | null;
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const RequestModal: React.FC<Props> = ({ request, user, isOpen, onClose, onUpdate }) => {
  const [comment, setComment] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [localRequest, setLocalRequest] = useState<RequestItem | null>(null);

  useEffect(() => {
    setLocalRequest(request);
    setComment('');

    // Auto-analyze if Faculty and no score exists
    if (isOpen && request && user.role === UserRole.FACULTY && request.complianceScore === undefined) {
      runAnalysis(request);
    }
  }, [request, isOpen, user]);

  const runAnalysis = async (req: RequestItem) => {
    setIsAnalyzing(true);
    const result = await geminiService.analyzeCompliance(req.description);

    // Note: In a real implementation, we'd need an API endpoint to update compliance score
    // For now, we'll just update the local state
    setLocalRequest({
      ...req,
      complianceScore: result.score,
      complianceReason: result.reason
    });

    setIsAnalyzing(false);
    onUpdate(); // Refresh parent
  };

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!localRequest) return;

    try {
      await apiService.updateRequest(localRequest.id, action, comment);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Failed to update request:', error);
    }
  };

  if (!isOpen || !localRequest) return null;

  // Faculty and HOD cannot act on mail ID unblock requests (goes straight to Student Affairs)
  const isMailId = localRequest.requestType === 'mailid';
  const canAct = user.role !== UserRole.STUDENT &&
    localRequest.status === RequestStatus.PENDING &&
    !(isMailId && (user.role === UserRole.FACULTY || user.role === UserRole.HOD));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">

        {/* Header */}
        <div className="p-6 border-b flex justify-between items-start bg-slate-50 rounded-t-xl">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{localRequest.title}</h2>
            <p className="text-sm text-slate-500">ID: {localRequest.id} • By {localRequest.studentName}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 flex-1">
          {/* Progress */}
          <ProgressBar currentStage={localRequest.currentStage} status={localRequest.status} requestType={localRequest.requestType} />

          {/* Description */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">Description</h3>
            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{localRequest.description}</p>
          </div>

          {/* Extended Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Request Details</h3>
              <div className="space-y-2 text-sm text-slate-600">
                {localRequest.requestType && (
                  <div className="flex justify-between"><span className="font-medium text-slate-700">Type:</span> <span className="capitalize">{localRequest.requestType}</span></div>
                )}
                {localRequest.priority && (
                  <div className="flex justify-between"><span className="font-medium text-slate-700">Priority:</span> <span className="capitalize">{localRequest.priority}</span></div>
                )}

                {/* Custom Fields */}
                {localRequest.eventType && (
                  <div className="flex justify-between"><span className="font-medium text-slate-700">Event Type:</span> <span>{localRequest.eventType}</span></div>
                )}
                {localRequest.eventId && (
                  <div className="flex justify-between"><span className="font-medium text-slate-700">Event ID:</span> <span>{localRequest.eventId}</span></div>
                )}
                {localRequest.fromDate && (
                  <div className="flex justify-between"><span className="font-medium text-slate-700">From:</span> <span>{localRequest.fromDate} {localRequest.fromTime}</span></div>
                )}
                {localRequest.toDate && (
                  <div className="flex justify-between"><span className="font-medium text-slate-700">To:</span> <span>{localRequest.toDate} {localRequest.toTime}</span></div>
                )}
                {localRequest.enteredMailId && (
                  <div className="flex flex-col mt-2 pt-2 border-t border-slate-200">
                    <span className="font-medium text-slate-700 mb-1">Mail ID to Unblock:</span>
                    <span className="text-blue-600">{localRequest.enteredMailId}</span>
                  </div>
                )}
                {localRequest.eventStatusImageUrl && (
                  <div className="flex flex-col mt-2 pt-2 border-t border-slate-200">
                    <span className="font-medium text-slate-700 mb-1">Event Status Default:</span>
                    <a href={localRequest.eventStatusImageUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate">{localRequest.eventStatusImageUrl}</a>
                  </div>
                )}

                {localRequest.needsMailIdUnblock && localRequest.mailIdReason && (
                  <div className="mt-2 pt-2 border-t border-slate-200">
                    <span className="font-medium text-slate-700 block mb-1">Mail ID Unblock Reason:</span>
                    <span className="text-slate-600 italic block">{localRequest.mailIdReason}</span>
                  </div>
                )}
                {localRequest.additionalNotes && (
                  <div className="mt-2 pt-2 border-t border-slate-200">
                    <span className="font-medium text-slate-700 block mb-1">Additional Notes:</span>
                    <span className="text-slate-600 block whitespace-pre-wrap">{localRequest.additionalNotes}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Contact & Approvals</h3>
              <div className="space-y-2 text-sm text-slate-600">
                {localRequest.studentIdNumber && (
                  <div className="flex justify-between"><span className="font-medium text-slate-700">Student ID Legacy:</span> <span>{localRequest.studentIdNumber}</span></div>
                )}
                {localRequest.studentRegistrationNumber && (
                  <div className="flex justify-between"><span className="font-medium text-slate-700">Student Reg. No:</span> <span>{localRequest.studentRegistrationNumber}</span></div>
                )}
                {localRequest.email && (
                  <div className="flex justify-between"><span className="font-medium text-slate-700">Email:</span> <span>{localRequest.email}</span></div>
                )}
                {localRequest.phone && (
                  <div className="flex justify-between"><span className="font-medium text-slate-700">Phone:</span> <span>{localRequest.phone}</span></div>
                )}

                <div className="pt-2 mt-2 border-t border-slate-200">
                  <span className="font-medium text-slate-700 block mb-2">Required Approvals:</span>
                  <div className="flex flex-wrap gap-2">
                    {localRequest.requestType === 'mailid' ? (
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full border border-amber-200">Student Affairs</span>
                    ) : (
                      <>
                        {localRequest.needsFacultyApproval && <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full border border-blue-200">Faculty</span>}
                        {localRequest.needsHodApproval && <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full border border-purple-200">HOD</span>}
                        {localRequest.needsOdApproval && <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full border border-amber-200">Student Affairs/OD</span>}
                        {localRequest.needsLeaveApproval && <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full border border-green-200">Leave</span>}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Supporting Documents */}
          {localRequest.documents && localRequest.documents.length > 0 && (
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Supporting Documents</h3>
              <div className="space-y-2">
                {localRequest.documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between bg-white p-3 rounded border border-slate-200">
                    <div className="flex items-center gap-3">
                      <FileText size={18} className="text-slate-500" />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{doc.name}</p>
                        <p className="text-xs text-slate-500">
                          {(doc.size / 1024 / 1024).toFixed(2)} MB • {new Date(doc.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1">
                      <Download size={14} />
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Analysis Section (Visible to Faculty or if analysis exists) */}
          {(localRequest.complianceScore !== undefined || user.role === UserRole.FACULTY) && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-indigo-800 font-semibold">
                  <ShieldCheck size={20} />
                  <span>AI Policy Compliance Check</span>
                </div>
                {isAnalyzing && <span className="text-xs text-indigo-500 animate-pulse">Analyzing...</span>}
              </div>

              {localRequest.complianceScore !== undefined ? (
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-3xl font-bold text-indigo-900">{localRequest.complianceScore}%</div>
                    <div className="h-2 flex-1 bg-indigo-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${localRequest.complianceScore > 75 ? 'bg-green-500' : localRequest.complianceScore > 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${localRequest.complianceScore}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-sm text-indigo-800">{localRequest.complianceReason}</p>
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">Analysis pending...</p>
              )}
            </div>
          )}

          {/* History Log */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Approval Log</h3>
            <div className="space-y-3">
              {localRequest.logs.map((log, i) => (
                <div key={i} className="text-sm flex gap-3">
                  <div className="min-w-[120px] text-slate-400 text-xs mt-1">
                    {new Date(log.date).toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium text-slate-900">{log.actorName}</span>
                    <span className="text-slate-600"> {log.action}</span>
                    {log.comment && <div className="text-slate-500 italic mt-1">"{log.comment}"</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Footer */}
        {canAct && (
          <div className="p-6 border-t bg-slate-50 rounded-b-xl space-y-4">
            {/* Student Affairs Override Indicator */}
            {(user.role === UserRole.STUDENT_AFFAIRS || user.role === UserRole.ADMIN) && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                <div className="flex items-center gap-2 text-amber-800 font-medium">
                  <ShieldCheck size={16} />
                  {user.role === UserRole.STUDENT_AFFAIRS ? 'Student Affairs Override Authority' : 'Administrator Access'}
                </div>
                <p className="text-amber-700 mt-1">
                  You can approve or reject any request at any stage, bypassing normal workflow.
                </p>
              </div>
            )}
            <textarea
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              placeholder="Add a comment (optional)..."
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => handleAction('reject')}
                className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium transition-colors flex items-center gap-2"
              >
                <AlertTriangle size={18} /> Reject
              </button>
              <button
                onClick={() => handleAction('approve')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-lg shadow-blue-200 flex items-center gap-2"
              >
                <Send size={18} /> {user.role === UserRole.STUDENT_AFFAIRS || user.role === UserRole.ADMIN ? 'Final Approval' : 'Approve & Forward'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestModal;