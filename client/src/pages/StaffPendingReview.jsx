import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function StaffPendingReview() {
  const navigate = useNavigate();
  const staffId = localStorage.getItem('userId');
  
  // Use state instead of a hardcoded constant so it can update in real-time
  const [canReview, setCanReview] = useState(localStorage.getItem('canReview') === '1');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState(null); 
  const [counts, setCounts] = useState({ pending: 0, ready: 0 });

  useEffect(() => {
    const fetchRequestsAndSync = async () => {
      try {
        // 1. Check Permissions in the background
        const profileRes = await axios.get(`http://localhost:5000/api/staff/profile/${staffId}`);
        const currentPermission = profileRes.data.can_review === 1;
        setCanReview(currentPermission);
        localStorage.setItem('canReview', profileRes.data.can_review);

        // Security check: Kick them out if access was revoked while they were on this page
        if (!currentPermission) {
          navigate('/staff-home');
          return; 
        }

        // 2. Fetch Queue
        const response = await axios.get('http://localhost:5000/api/staff/pending-requests');
        setPendingRequests(response.data.filter(req => req.status === 'Pending'));
        
        // 3. Fetch Notifications Count
        setCounts({
          pending: response.data.filter(req => req.status === 'Pending').length,
          ready: response.data.filter(req => req.status === 'Ready to Print').length
        });
      } catch (error) {
        console.error("Failed to fetch data", error);
      }
    };

    fetchRequestsAndSync();
    const interval = setInterval(fetchRequestsAndSync, 5000);
    return () => clearInterval(interval);
  }, [staffId, navigate]);

  const handleUpdateStatus = async (requestId, newStatus) => {
    try {
      await axios.put(`http://localhost:5000/api/staff/update-status/${requestId}`, { status: newStatus, official_id: staffId });
      const response = await axios.get('http://localhost:5000/api/staff/pending-requests');
      setPendingRequests(response.data.filter(req => req.status === 'Pending'));
      setCounts({
        pending: response.data.filter(req => req.status === 'Pending').length,
        ready: response.data.filter(req => req.status === 'Ready to Print').length
      });
    } catch (error) {
      alert("Error approving request.");
    }
  };

  const handleReject = async (requestId) => {
    const reason = window.prompt("⚠️ REJECT APPLICATION\nPlease enter the reason for rejection:");
    if (!reason || reason.trim() === "") return;
    try {
      await axios.put(`http://localhost:5000/api/staff/reject/${requestId}`, { official_id: staffId, reason: reason });
      const response = await axios.get('http://localhost:5000/api/staff/pending-requests');
      setPendingRequests(response.data.filter(req => req.status === 'Pending'));
      setCounts({
        pending: response.data.filter(req => req.status === 'Pending').length,
        ready: response.data.filter(req => req.status === 'Ready to Print').length
      });
    } catch (error) {
      alert("Error rejecting request.");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: '"Segoe UI", Tahoma, sans-serif', backgroundColor: '#f8fafc', overflowY: 'scroll' }}>
      {/* CSS for the glowing notification dots */}
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

      <div style={{ width: '280px', background: '#0f172a', color: 'white', padding: '30px 25px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '24px', margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>👨‍💼 Front Desk System</h2>
        <hr style={{ border: '0', borderTop: '1px solid #334155', marginBottom: '40px', width: '100%' }} />
        <div style={{ flex: 1 }}>
          <p onClick={() => navigate('/staff-home')} style={{ margin: '25px 0', cursor: 'pointer', fontWeight: 'normal', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
            🏠 Home Dashboard
          </p>
          
          <p style={{ margin: '25px 0', cursor: 'default', fontWeight: 'bold', color: 'white', display: 'flex', alignItems: 'center' }}>
            📋 Pending Review 
            {counts.pending > 0 && <span className="notification-dot">{counts.pending}</span>}
          </p>

          <p onClick={() => navigate('/staff-ready')} style={{ margin: '25px 0', cursor: 'pointer', fontWeight: 'normal', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
            🔖 Ready to Print 
            {counts.ready > 0 && <span className="notification-dot">{counts.ready}</span>}
          </p>
          
          <p onClick={() => navigate('/document-records')} style={{ margin: '25px 0', cursor: 'pointer', fontWeight: 'normal', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
            📁 Document Records
          </p>
        </div>
        <button onClick={handleLogout} style={{ padding: '10px', background: '#334155', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Logout</button>
      </div>

      <div style={{ flex: 1, padding: '40px' }}>
        <h1 style={{ margin: '0 0 30px 0', color: '#0f172a', fontSize: '28px' }}>Document Validation Queue</h1>
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', color: '#475569', textAlign: 'left', fontSize: '14px', textTransform: 'uppercase' }}>
                <th style={{ padding: '15px 25px' }}>Q #</th>
                <th style={{ padding: '15px 25px' }}>Resident Name</th>
                <th style={{ padding: '15px 25px' }}>Document & Purpose</th>
                <th style={{ padding: '15px 25px' }}>Review Files</th>
                <th style={{ padding: '15px 25px', width: '200px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingRequests.length > 0 ? pendingRequests.map((req) => (
                <tr key={req.request_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '15px 25px', fontWeight: 'bold' }}>{req.daily_sequence_no}</td>
                  <td style={{ padding: '15px 25px' }}>{req.first_name} {req.last_name}</td>
                  <td style={{ padding: '15px 25px' }}><b>{req.doc_name}</b><br/><span style={{fontSize:'12px', color:'#64748b'}}>{req.purpose}</span></td>
                  <td style={{ padding: '15px 25px' }}>
                    <button onClick={() => setSelectedFiles({ idImage: req.id_proof_image, reqFile: req.requirement_file })} style={{ padding: '6px 12px', fontSize: '12px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}>👁️ Files</button>
                  </td>
                  <td style={{ padding: '15px 25px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleUpdateStatus(req.request_id, 'Ready to Print')} style={{ padding: '8px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', flex: 1 }}>Approve</button>
                      <button onClick={() => handleReject(req.request_id)} style={{ padding: '8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', flex: 1 }}>Reject</button>
                    </div>
                  </td>
                </tr>
              )) : <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No pending applications.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Attachments Modal */}
      {selectedFiles && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '1000px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#1e293b' }}>Application Review</h2>
              <button onClick={() => setSelectedFiles(null)} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Close Window</button>
            </div>
            <div style={{ display: 'flex', gap: '30px' }}>
              <div style={{ flex: 1, background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#475569' }}>1. Registered ID</h4>
                {selectedFiles.idImage ? <img src={`http://localhost:5000/${selectedFiles.idImage}`} alt="ID" style={{ width: '100%', height: '400px', objectFit: 'contain', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px' }} /> : <p>No ID.</p>}
              </div>
              <div style={{ flex: 1, background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#475569' }}>2. Submitted Requirement</h4>
                {selectedFiles.reqFile ? <div><img src={`http://localhost:5000/${selectedFiles.reqFile}`} alt="Req" style={{ width: '100%', height: '360px', objectFit: 'contain', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', marginBottom: '10px' }} /><a href={`http://localhost:5000/${selectedFiles.reqFile}`} target="_blank" rel="noreferrer" style={{ display: 'block', textAlign: 'center', color: '#3b82f6', fontWeight: 'bold', textDecoration: 'none' }}>Open File ↗</a></div> : <p>No requirement.</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}