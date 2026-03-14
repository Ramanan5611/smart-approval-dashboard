import React, { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import { Activity, Clock, User, Info, ArrowLeft } from 'lucide-react';

interface Log {
  id: string;
  userId: string;
  timestamp: string;
  type: string;
  details: any;
}

interface Props {
  onBack: () => void;
}

const AdminActivityLogs: React.FC<Props> = ({ onBack }) => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await apiService.getActivityLogs();
        setLogs(data);
      } catch (err) {
        console.error('Failed to fetch logs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const getLogIcon = (type: string) => {
    if (type.includes('LOGIN')) return <User size={16} className="text-blue-500" />;
    if (type.includes('AUTH')) return <Activity size={16} className="text-purple-500" />;
    return <Info size={16} className="text-slate-500" />;
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-200"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">System Activity Logs</h2>
            <p className="text-sm text-slate-500 font-medium">Monitoring real-time authentication and workflow events</p>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-[2rem] border border-white/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest bg-slate-50/50">
                <th className="p-5">Event Type</th>
                <th className="p-5">User ID</th>
                <th className="p-5">Details</th>
                <th className="p-5">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white/30 backdrop-blur-md">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Hydrating Logs...</p>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-20 text-center text-slate-400 font-medium">
                    No activity logs recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-white/50 transition-colors">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
                          {getLogIcon(log.type)}
                        </div>
                        <span className="text-sm font-black text-slate-900 tracking-tight uppercase">{log.type.replace(/_/g, ' ')}</span>
                      </div>
                    </td>
                    <td className="p-5 text-sm font-bold text-slate-500">{log.userId}</td>
                    <td className="p-5">
                      <div className="text-xs font-medium text-slate-600 max-w-md truncate">
                        {JSON.stringify(log.details)}
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                        <Clock size={12} />
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminActivityLogs;
