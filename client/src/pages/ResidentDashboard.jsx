import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function ResidentDashboard() {
  const navigate = useNavigate();
  
  const [queueInfo, setQueueInfo] = useState({ queueNumber: '--', status: 'Pending' });
  const [history, setHistory] = useState([]);

  // --- UPGRADED: Translation with Fail-Safes ---
  const getDisplayStatus = (dbStatus) => {
    // If the database sends "undefined" or nothing, default to Pending
    if (!dbStatus || dbStatus === 'undefined') return 'Pending'; 
    if (dbStatus === 'Ready to Print') return 'Ready for Pickup at Brgy. Hall';
    if (dbStatus === 'Released') return 'Completed / Picked Up';
    return dbStatus;
  };

  const fetchMyData = useCallback(async () => {
    try {
      const myId = localStorage.getItem('userId');
      if (!myId) return navigate('/');

      const queueResponse = await axios.get(`http://localhost:5000/api/requests/latest/${myId}`);
      if (queueResponse.data && queueResponse.data.daily_sequence_no) {
        setQueueInfo({
          queueNumber: queueResponse.data.daily_sequence_no,
          // Add a fallback in case the database column is empty
          status: queueResponse.data.request_status || 'Pending' 
        });
      }

      const historyResponse = await axios.get(`http://localhost:5000/api/requests/history/${myId}`);
      setHistory(historyResponse.data);

    } catch (error) {
      console.error("Dashboard sync error:", error);
    }
  }, [navigate]);

  useEffect(() => {
    fetchMyData();
    const interval = setInterval(fetchMyData, 5000); 
    return () => clearInterval(interval);
  }, [fetchMyData]);

  const handleCancel = async (requestId) => {
    if (!window.confirm("Are you sure you want to cancel this request?")) return;

    try {
      await axios.put(`http://localhost:5000/api/requests/cancel/${requestId}`);
      alert("Application Cancelled Successfully.");
      fetchMyData(); // Refresh the table
    } catch (error) {
      // NEW: This will now display the exact error message from the backend!
      const errorMsg = error.response?.data?.error || "Error cancelling request.";
      alert(errorMsg);
    }
  };
  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif', backgroundColor: '#f4f7f6' }}>
      
      {/* Sidebar */}
      <div style={{ width: '260px', background: '#1e3a8a', color: 'white', padding: '30px 20px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '20px', margin: '0 0 40px 0', borderBottom: '1px solid #3b82f6', paddingBottom: '15px' }}>🏛️ Brgy. Fortune</h2>
        <div style={{ flex: 1 }}>
          <p style={{ margin: '15px 0', cursor: 'pointer', fontWeight: 'bold' }}>📄 My Dashboard</p>
          <p onClick={() => navigate('/document-request')} style={{ margin: '15px 0', cursor: 'pointer', color: '#93c5fd' }}>➕ Request Document</p>
          <p onClick={() => navigate('/profile')} style={{ margin: '15px 0', cursor: 'pointer', color: '#93c5fd' }}>👤 Profile Settings</p>
        </div>
        <button onClick={handleLogout} style={{ padding: '10px', background: 'transparent', color: '#fca5a5', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer' }}>Logout</button>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '40px' }}>
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ margin: 0, color: '#1f2937', fontSize: '28px' }}>Resident Portal</h1>
          <p style={{ color: '#6b7280', marginTop: '5px' }}>Welcome back. Track and manage your document requests below.</p>
        </div>
        
        {/* Top Cards */}
        <div style={{ display: 'flex', gap: '20px', marginTop: '20px', marginBottom: '40px' }}>
          <div style={{ flex: 1, background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderLeft: '5px solid #3b82f6' }}>
            <h4 style={{ color: '#6b7280', margin: '0 0 10px 0', textTransform: 'uppercase', fontSize: '12px' }}>Your Latest Queue</h4>
            <p style={{ fontSize: '42px', fontWeight: 'bold', color: '#1e3a8a', margin: 0 }}>{queueInfo.queueNumber}</p>
          </div>
          
          <div style={{ flex: 1, background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', 
            borderLeft: queueInfo.status === 'Ready to Print' ? '5px solid #10b981' : queueInfo.status === 'Released' ? '5px solid #3b82f6' : queueInfo.status === 'Cancelled' ? '5px solid #ef4444' : '5px solid #f59e0b' }}>
            <h4 style={{ color: '#6b7280', margin: '0 0 10px 0', textTransform: 'uppercase', fontSize: '12px' }}>Latest Status</h4>
            <p style={{ fontSize: '20px', fontWeight: 'bold', margin: '10px 0 0 0', 
              color: queueInfo.status === 'Ready to Print' ? '#10b981' : queueInfo.status === 'Released' ? '#3b82f6' : queueInfo.status === 'Cancelled' ? '#ef4444' : '#f59e0b' }}>
              {getDisplayStatus(queueInfo.status)}
            </p>
          </div>
          
          <div onClick={() => navigate('/document-request')} style={{ flex: 1, background: '#2563eb', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'center', transition: '0.2s' }}>
            <h4 style={{ color: 'white', margin: '0 0 5px 0', fontSize: '18px' }}>New Application</h4>
            <p style={{ color: '#bfdbfe', margin: 0, fontSize: '14px' }}>Click here to apply for a new Document ➔</p>
          </div>
        </div>

        {/* Transaction History Table */}
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 25px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <h3 style={{ margin: 0, color: '#334155' }}>My Request History</h3>
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', color: '#475569', textAlign: 'left', fontSize: '14px', textTransform: 'uppercase' }}>
                <th style={{ padding: '15px 25px' }}>Date</th>
                <th style={{ padding: '15px 25px' }}>Document Type</th>
                <th style={{ padding: '15px 25px' }}>Status</th>
                <th style={{ padding: '15px 25px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {history.length > 0 ? (
                history.map((req) => {
                  // We extract the variables cleanly here so we can fail-safe them!
                  const safeDocName = req.doc_name === 'undefined' ? 'Official Document' : req.doc_name;
                  const rawStatus = (!req.status || req.status === 'undefined') ? 'Pending' : req.status;

                  return (
                    <tr key={req.request_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '15px 25px', color: '#64748b', fontSize: '14px' }}>{new Date(req.date_requested).toLocaleDateString()}</td>
                      
                      {/* Using the safe document name */}
                      <td style={{ padding: '15px 25px', fontWeight: '500', color: '#1e293b' }}>{safeDocName}</td>
                      
                      <td style={{ padding: '15px 25px' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold',
                        background: rawStatus === 'Ready to Print' ? '#dcfce7' : rawStatus === 'Released' ? '#dbeafe' : rawStatus === 'Cancelled' ? '#fee2e2' : rawStatus === 'Rejected' ? '#fee2e2' : '#fef08a',
                        color: rawStatus === 'Ready to Print' ? '#166534' : rawStatus === 'Released' ? '#1e40af' : rawStatus === 'Cancelled' ? '#991b1b' : rawStatus === 'Rejected' ? '#991b1b' : '#854d0e'
                      }}>
                        {getDisplayStatus(rawStatus)}
                      </span>
                      
                      {/* NEW: Display the Staff's reason for rejection */}
                      {rawStatus === 'Rejected' && req.remarks && (
                        <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '6px', fontWeight: 'bold' }}>
                          Reason: {req.remarks}
                        </div>
                      )}
                    </td>
                      <td style={{ padding: '15px 25px' }}>
                        {rawStatus === 'Pending' ? (
                          <button onClick={() => handleCancel(req.request_id)} style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '4px', border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}>
                            Cancel
                          </button>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '12px' }}>--</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>You have no past requests.</td></tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}