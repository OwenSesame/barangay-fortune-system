import AdminSidebar from '../components/AdminSidebar';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function AuditLogs() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [badgeCounts, setBadgeCounts] = useState({ pending: 0, ready: 0, residentApprovals: 0 });

  const fetchLogs = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/audit-logs');
      setLogs(response.data);
    } catch (error) { console.error("Failed to fetch logs", error); }
  };

  useEffect(() => { fetchLogs(); }, []);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [requestsRes, residentsRes] = await Promise.all([
            axios.get('http://localhost:5000/api/staff/pending-requests'),
            axios.get('http://localhost:5000/api/admin/pending-residents')
        ]);
        const pending = requestsRes.data.filter(req => req.status === 'Pending').length;
        const ready = requestsRes.data.filter(req => req.status === 'Ready to Print').length;
        const residentApprovals = residentsRes.data.length;
        setBadgeCounts({ pending, ready, residentApprovals });
      } catch (error) {
        console.error("Failed to fetch notification counts", error);
      }
    };
    
    fetchCounts();
    const interval = setInterval(fetchCounts, 5000);
  
  // FEATURE 8: Export to CSV
  const exportToCSV = () => {
    if (filteredLogs.length === 0) return alert("No logs to export.");
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Timestamp,User,Action,Details\n";
    filteredLogs.forEach(log => {
      const date = new Date(log.timestamp).toLocaleString().replace(/,/g, '');
      const user = log.user_name || 'System Admin';
      const action = log.action_type;
      const details = log.details.replace(/,/g, ';'); // prevent CSV breaking
      csvContent += `${date},${user},${action},${details}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "System_Audit_Logs.csv");
    document.body.appendChild(link);
    link.click();
  };

  return () => clearInterval(interval);
  }, []);

  // Filter Logic: Search by Action, Details, User, or Date
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.user_name && log.user_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDate = dateFilter === '' || log.timestamp.startsWith(dateFilter);
    
    return matchesSearch && matchesDate;
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: '"Segoe UI", sans-serif', backgroundColor: '#f1f5f9' }}>
      <style>
        {`
          @keyframes pulse-red {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
          }
          .notification-dot {
            display: inline-flex; align-items: center; justify-content: center;
            background: #ef4444; color: white; border-radius: 50%;
            min-width: 20px; height: 20px; font-size: 11px; font-weight: bold;
            margin-left: 10px; animation: pulse-red 2s infinite;
          }
        `}
      </style>
      
      {/* Admin Sidebar */}
      <AdminSidebar badgeCounts={badgeCounts} />

      <div style={{ flex: 1, padding: '40px' }}>
        <h1 style={{ color: '#0f172a', marginBottom: '10px' }}>System Audit Logs</h1>
        <p style={{ color: '#64748b', marginBottom: '30px' }}>Tracking every administrative action and system change.</p>

        {/* Filters Bar */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ flex: 2 }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '5px' }}>SEARCH ACTIONS OR USERS</label>
            <input 
              type="text" 
              placeholder="e.g. Privilege Change, Update, or Staff Name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '5px' }}>FILTER BY DATE</label>
            <input 
              type="date" 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            />
          </div>
          <button onClick={() => {setSearchTerm(''); setDateFilter('');}} style={{ alignSelf: 'flex-end', padding: '10px 20px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}>Reset</button>
          <button onClick={exportToCSV} style={{ alignSelf: 'flex-end', padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>📥 Export CSV</button>
        </div>

        {/* Logs Table */}
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '15px 25px', textAlign: 'left', color: '#64748b', fontSize: '12px' }}>TIMESTAMP</th>
                <th style={{ padding: '15px 25px', textAlign: 'left', color: '#64748b', fontSize: '12px' }}>USER</th>
                <th style={{ padding: '15px 25px', textAlign: 'left', color: '#64748b', fontSize: '12px' }}>ACTION</th>
                <th style={{ padding: '15px 25px', textAlign: 'left', color: '#64748b', fontSize: '12px' }}>DETAILS</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                <tr key={log.log_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '15px 25px', color: '#64748b', fontSize: '14px' }}>{new Date(log.timestamp).toLocaleString()}</td>
                  <td style={{ padding: '15px 25px', fontWeight: 'bold' }}>{log.user_name || 'System Admin'}</td>
                  <td style={{ padding: '15px 25px' }}>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '4px', 
                      fontSize: '11px', 
                      fontWeight: 'bold',
                      background: log.action_type === 'Privilege Change' ? '#fef3c7' : '#e0e7ff',
                      color: log.action_type === 'Privilege Change' ? '#92400e' : '#3730a3'
                    }}>
                      {log.action_type}
                    </span>
                  </td>
                  <td style={{ padding: '15px 25px', color: '#475569', fontSize: '14px' }}>{log.details}</td>
                </tr>
              )) : (
                <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No logs match your search criteria.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}