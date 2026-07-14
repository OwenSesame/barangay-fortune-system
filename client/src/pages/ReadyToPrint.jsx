import AdminSidebar from '../components/AdminSidebar';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function ReadyToPrint() {
  const navigate = useNavigate();
  const [printQueue, setPrintQueue] = useState([]);
  
  // Persistent Notification State
  const [badgeCounts, setBadgeCounts] = useState({ pending: 0, ready: 0, residentApprovals: 0 });

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
        
        setPrintQueue(requestsRes.data.filter(req => req.status === 'Ready to Print'));
      } catch (error) {
        console.error("Failed to fetch notification counts", error);
      }
    };
    
    fetchCounts();
    const interval = setInterval(fetchCounts, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRelease = async (requestId) => {
    if (!window.confirm("Confirm: Has the resident physically picked up this document?")) return;
    try {
      const adminId = localStorage.getItem('userId');
      await axios.put(`http://localhost:5000/api/staff/update-status/${requestId}`, { status: 'Released', official_id: adminId });
      alert("Document successfully marked as Released!");
      fetchPrintQueue();
    } catch (error) {
      alert("Error updating document status.");
    }
  };

  const handleNoShow = async (requestId) => {
    if (!window.confirm("WARNING: Mark this resident as a No-Show? This will forfeit their document and clear the queue slot.")) return;
    try {
      const adminId = localStorage.getItem('userId');
      await axios.put(`http://localhost:5000/api/staff/no-show/${requestId}`, { official_id: adminId });
      alert("Document forfeited due to No-Show.");
      fetchPrintQueue();
    } catch (error) {
      alert("Error updating document status.");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif', backgroundColor: '#f8fafc' }}>
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

      {/* Dynamic Admin Sidebar */}
      <AdminSidebar badgeCounts={badgeCounts} />

      <div style={{ flex: 1, padding: '40px' }}>
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ margin: 0, color: '#0f172a', fontSize: '28px' }}>Printing & Release Queue</h1>
          <p style={{ color: '#64748b', marginTop: '5px' }}>Generate official documents and mark them as released upon pickup.</p>
        </div>

        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 25px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <h3 style={{ margin: 0, color: '#334155' }}>Approved Documents ({printQueue.length})</h3>
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', color: '#475569', textAlign: 'left', fontSize: '14px', textTransform: 'uppercase' }}>
                <th style={{ padding: '15px 25px' }}>Queue #</th>
                <th style={{ padding: '15px 25px' }}>Resident Name</th>
                <th style={{ padding: '15px 25px' }}>Document & Purpose</th>
                <th style={{ padding: '15px 25px' }}>Status</th>
                <th style={{ padding: '15px 25px', width: '200px' }}>Final Action</th>
              </tr>
            </thead>
            <tbody>
              {printQueue.length > 0 ? printQueue.map((req) => (
                <tr key={req.request_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '15px 25px', fontWeight: 'bold', color: '#0f172a' }}>{req.daily_sequence_no}</td>
                  <td style={{ padding: '15px 25px', color: '#334155', fontWeight: '500' }}>{req.first_name} {req.last_name}</td>
                  <td style={{ padding: '15px 25px' }}>
                    <div style={{ fontWeight: 'bold', color: '#1e3a8a', fontSize: '14px' }}>{req.doc_name}</div>
                    <div style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>Purpose: {req.purpose || 'None provided'}</div>
                  </td>
                  <td style={{ padding: '15px 25px' }}>
                    <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', background: '#dcfce7', color: '#166534' }}>Ready for Pickup</span>
                  </td>
                  <td style={{ padding: '15px 25px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => navigate(`/print/${req.request_id}`)} style={{ padding: '8px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', flex: 1 }}>🖨️ Print</button>
                      <button onClick={() => handleRelease(req.request_id)} style={{ padding: '8px', background: '#64748b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', flex: 1 }}>✅ Release</button>
                      <button onClick={() => handleNoShow(req.request_id)} style={{ padding: '8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', flex: 1 }}>❌ No-Show</button>
                    </div>
                  </td>
                </tr>
              )) : <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No documents are currently waiting to be printed.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}