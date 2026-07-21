import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import ResidentBottomNav from '../components/ResidentBottomNav';

export default function ResidentDashboard() {
  const navigate = useNavigate();
  
  const [queueInfo, setQueueInfo] = useState({ queueNumber: '--', status: 'Pending', scheduledDate: null });
  const [history, setHistory] = useState([]);

  // --- UPGRADED: Translation with Fail-Safes ---
  const getDisplayStatus = (dbStatus) => {
    // If the database sends "undefined" or nothing, default to Pending
    if (!dbStatus || dbStatus === 'undefined') return 'Pending'; 
    if (dbStatus === 'Waiting for Printing') return 'Waiting for Printing';
    if (dbStatus === 'Ready for Pickup') return 'Ready for Pickup at Brgy. Hall';
    if (dbStatus === 'Released') return 'Completed / Picked Up';
    return dbStatus;
  };

  // Deterministic randomizer for OR code based on request ID
  const generateORCode = (id) => {
    if (!id) return '';
    const salt = 83721;
    const val = (parseInt(id) * salt).toString(16).toUpperCase();
    return `OR-${val.padStart(6, 'X')}`;
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
          status: queueResponse.data.request_status || 'Pending',
          scheduledDate: queueResponse.data.scheduled_date,
          requestId: queueResponse.data.request_id
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
      toast.success("Application Cancelled Successfully.");
      fetchMyData(); // Refresh the table
    } catch (error) {
      // NEW: This will now display the exact error message from the backend!
      const errorMsg = error.response?.data?.error || "Error cancelling request.";
      toast.error(errorMsg);
    }
  };
  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#f4f7f6] font-sans pb-[65px] md:pb-0">
      
      {/* Sidebar (Hidden on Mobile) */}
      <div className="hidden md:flex flex-col w-[260px] bg-[#1e3a8a] text-white p-[30px_20px] sticky top-0 h-screen overflow-y-auto">
        <h2 style={{ fontSize: '20px', margin: '0 0 40px 0', borderBottom: '1px solid #3b82f6', paddingBottom: '15px' }}>🏛️ Brgy. Fortune</h2>
        <div style={{ flex: 1 }}>
          <p className="transition-all duration-300 hover:translate-x-2 hover:bg-[#2563eb] hover:text-white" style={{ padding: '8px 16px', borderRadius: '8px', margin: '15px 0', cursor: 'pointer', fontWeight: 'bold' }}>📄 My Dashboard</p>
          <p onClick={() => navigate('/document-request')} className="transition-all duration-300 hover:translate-x-2 hover:bg-[#2563eb] hover:text-white" style={{ padding: '8px 16px', borderRadius: '8px', margin: '15px 0', cursor: 'pointer', color: '#93c5fd' }}>➕ Request Document</p>
          <p onClick={() => navigate('/profile')} className="transition-all duration-300 hover:translate-x-2 hover:bg-[#2563eb] hover:text-white" style={{ padding: '8px 16px', borderRadius: '8px', margin: '15px 0', cursor: 'pointer', color: '#93c5fd' }}>👤 Profile Settings</p>
        </div>
        <button onClick={handleLogout} className="transition-all duration-300 bg-transparent text-[#fca5a5] hover:bg-[#ef4444] hover:text-white hover:border-[#ef4444]" style={{ padding: '10px', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Logout</button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-5 md:p-[40px] w-full overflow-x-hidden">
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ margin: 0, color: '#1f2937', fontSize: '28px' }}>Resident Portal</h1>
          <p style={{ color: '#6b7280', marginTop: '5px' }}>Welcome back. Track and manage your document requests below.</p>
        </div>
        
        {/* Top Cards */}
        <div className="flex flex-col md:flex-row gap-[20px] mt-[20px] mb-[40px]">
          <div style={{ flex: 1, background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderLeft: '5px solid #3b82f6' }}>
            <h4 style={{ color: '#6b7280', margin: '0 0 10px 0', textTransform: 'uppercase', fontSize: '12px' }}>Your Latest Queue</h4>
            <p style={{ fontSize: '42px', fontWeight: 'bold', color: '#1e3a8a', margin: 0 }}>{queueInfo.queueNumber}</p>
            {queueInfo.scheduledDate && (
              <p style={{ color: '#64748b', fontSize: '12px', margin: '5px 0 0 0', fontWeight: 'bold' }}>
                For: {new Date(queueInfo.scheduledDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            )}
          </div>
          
          <div style={{ flex: 1, background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', 
            borderLeft: queueInfo.status === 'Ready for Pickup' ? '5px solid #10b981' : queueInfo.status === 'Released' ? '5px solid #3b82f6' : queueInfo.status === 'Cancelled' ? '5px solid #ef4444' : queueInfo.status === 'Waiting for Printing' ? '5px solid #f59e0b' : '5px solid #f59e0b' }}>
            <h4 style={{ color: '#6b7280', margin: '0 0 10px 0', textTransform: 'uppercase', fontSize: '12px' }}>Latest Status</h4>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '10px 0 0 0', 
              color: queueInfo.status === 'Ready for Pickup' ? '#10b981' : queueInfo.status === 'Released' ? '#3b82f6' : queueInfo.status === 'Cancelled' ? '#ef4444' : queueInfo.status === 'Waiting for Printing' ? '#f59e0b' : '#f59e0b' }}>
              {getDisplayStatus(queueInfo.status)}
            </h2>
            {queueInfo.status === 'Ready for Pickup' && queueInfo.requestId && (
                <div style={{ marginTop: '15px', padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
                    <p style={{ margin: '0 0 5px 0', fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Provide this code to staff</p>
                    <p style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#10b981', letterSpacing: '2px' }}>{generateORCode(queueInfo.requestId)}</p>
                </div>
            )}
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
          
          <div className="overflow-x-auto">
            <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', color: '#475569', textAlign: 'left', fontSize: '14px', textTransform: 'uppercase' }}>
                <th style={{ padding: '15px 25px' }}>Requested</th>
                <th style={{ padding: '15px 25px' }}>Pick-up Date</th>
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
                      <td style={{ padding: '15px 25px', color: '#1e3a8a', fontSize: '14px', fontWeight: 'bold' }}>{req.pick_up_date ? new Date(req.pick_up_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</td>
                      
                      {/* Using the safe document name */}
                      <td style={{ padding: '15px 25px', fontWeight: '500', color: '#1e293b' }}>{safeDocName}</td>
                      
                      <td style={{ padding: '15px 25px' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold',
                        background: rawStatus === 'Ready for Pickup' ? '#dcfce7' : rawStatus === 'Released' ? '#dbeafe' : rawStatus === 'Cancelled' ? '#fee2e2' : rawStatus === 'Rejected' ? '#fee2e2' : rawStatus === 'Waiting for Printing' ? '#fef08a' : '#fef08a',
                        color: rawStatus === 'Ready for Pickup' ? '#166534' : rawStatus === 'Released' ? '#1e40af' : rawStatus === 'Cancelled' ? '#991b1b' : rawStatus === 'Rejected' ? '#991b1b' : rawStatus === 'Waiting for Printing' ? '#854d0e' : '#854d0e'
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
      
      {/* Mobile Bottom Navigation */}
      <ResidentBottomNav />
    </div>
  );
}