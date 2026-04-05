import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function StaffDashboard() {
  const navigate = useNavigate();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState(null); 

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/staff/pending-requests');
        setPendingRequests(response.data);
      } catch (error) {
        console.error("Failed to fetch requests", error);
      }
    };

    fetchRequests();
    const interval = setInterval(fetchRequests, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (requestId, newStatus) => {
    if (newStatus === 'Released' && !window.confirm("Has the resident picked up this document?")) return;

    try {
      const staffId = localStorage.getItem('userId');
      await axios.put(`http://localhost:5000/api/staff/update-status/${requestId}`, {
        status: newStatus,
        official_id: staffId
      });

      const response = await axios.get('http://localhost:5000/api/staff/pending-requests');
      setPendingRequests(response.data);
    } catch (error) {
      alert("Error updating request.");
    }
  };

  // NEW: The specific Reject Function
  const handleReject = async (requestId) => {
    // This pops up a typing box for the staff member!
    const reason = window.prompt("⚠️ REJECT APPLICATION\nPlease enter the reason for rejection (e.g., 'Invalid ID', 'Blurry Photo'):");
    
    // If they click cancel or leave it blank, stop the process
    if (!reason || reason.trim() === "") return;

    try {
      const staffId = localStorage.getItem('userId');
      await axios.put(`http://localhost:5000/api/staff/reject/${requestId}`, {
        official_id: staffId,
        reason: reason
      });

      alert("Application Rejected.");
      // Refresh the queue
      const response = await axios.get('http://localhost:5000/api/staff/pending-requests');
      setPendingRequests(response.data);
    } catch (error) {
      alert("Error rejecting request.");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif', backgroundColor: '#f8fafc' }}>
      
      {/* Sidebar */}
      <div style={{ width: '260px', background: '#0f172a', color: 'white', padding: '30px 20px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '20px', margin: '0 0 40px 0', borderBottom: '1px solid #334155', paddingBottom: '15px' }}>
          👨‍💼 Front Desk System
        </h2>
        <div style={{ flex: 1 }}>
          <p style={{ margin: '15px 0', cursor: 'pointer', fontWeight: 'bold' }}>📥 Queue Management</p>
          <p onClick={() => navigate('/document-records')} style={{ margin: '15px 0', cursor: 'pointer', color: '#94a3b8' }}>🗂️ Document Records</p>
        </div>
        <button onClick={handleLogout} style={{ padding: '10px', background: '#334155', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Logout</button>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '40px' }}>
        <h1 style={{ margin: '0 0 30px 0', color: '#0f172a', fontSize: '28px' }}>Document Processing Queue</h1>

        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 25px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <h3 style={{ margin: 0, color: '#334155' }}>Active Applications ({pendingRequests.length})</h3>
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', color: '#475569', textAlign: 'left', fontSize: '14px', textTransform: 'uppercase' }}>
                <th style={{ padding: '15px 25px' }}>Q #</th>
                <th style={{ padding: '15px 25px' }}>Resident Name</th>
                <th style={{ padding: '15px 25px' }}>Document & Purpose</th>
                <th style={{ padding: '15px 25px' }}>Review Files</th>
                <th style={{ padding: '15px 25px' }}>Status</th>
                <th style={{ padding: '15px 25px', width: '200px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingRequests.length > 0 ? (
                pendingRequests.map((req) => (
                  <tr key={req.request_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '15px 25px', fontWeight: 'bold', color: '#0f172a' }}>{req.daily_sequence_no}</td>
                    <td style={{ padding: '15px 25px', color: '#334155', fontWeight: '500' }}>{req.first_name} {req.last_name}</td>
                    <td style={{ padding: '15px 25px' }}>
                      <div style={{ fontWeight: 'bold', color: '#1e3a8a', fontSize: '14px' }}>{req.doc_name}</div>
                      <div style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>Purpose: {req.purpose || 'None provided'}</div>
                    </td>
                    
                    <td style={{ padding: '15px 25px' }}>
                      <button 
                        onClick={() => setSelectedFiles({ idImage: req.id_proof_image, reqFile: req.requirement_file })} 
                        style={{ padding: '6px 12px', fontSize: '12px', background: 'white', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        👁️ Inspect Files
                      </button>
                    </td>

                    <td style={{ padding: '15px 25px' }}>
                      <span style={{
                        padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold',
                        background: req.status === 'Pending' ? '#fef08a' : '#dcfce7',
                        color: req.status === 'Pending' ? '#854d0e' : '#166534'
                      }}>
                        {req.status}
                      </span>
                    </td>
                    
                    <td style={{ padding: '15px 25px' }}>
                      {req.status === 'Pending' ? (
                        // NEW: Side-by-side Process and Reject buttons
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleUpdateStatus(req.request_id, 'Ready to Print')} style={{ padding: '8px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', flex: 1 }}>
                            Approve
                          </button>
                          <button onClick={() => handleReject(req.request_id)} style={{ padding: '8px', background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', flex: 1 }}>
                            Reject
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => navigate(`/print/${req.request_id}`)} style={{ padding: '8px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', flex: 1 }}>
                            🖨️ Print
                          </button>
                          <button onClick={() => handleUpdateStatus(req.request_id, 'Released')} style={{ padding: '8px', background: '#64748b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', flex: 1 }}>
                            ✅ Release
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Queue is currently empty.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side-by-Side Review Modal (Unchanged) */}
      {selectedFiles && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '1000px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#1e293b' }}>Application Review</h2>
              <button onClick={() => setSelectedFiles(null)} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Close Window</button>
            </div>

            <div style={{ display: 'flex', gap: '30px' }}>
              <div style={{ flex: 1, background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#475569' }}>1. Registered ID (Proof of Identity)</h4>
                {selectedFiles.idImage ? (
                  <img src={`http://localhost:5000/${selectedFiles.idImage}`} alt="Resident ID" style={{ width: '100%', height: '400px', objectFit: 'contain', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                ) : (
                  <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>No ID uploaded during registration.</p>
                )}
              </div>
              <div style={{ flex: 1, background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#475569' }}>2. Submitted Document Requirement</h4>
                {selectedFiles.reqFile ? (
                  <div>
                    <img src={`http://localhost:5000/${selectedFiles.reqFile}`} alt="Requirement File" style={{ width: '100%', height: '360px', objectFit: 'contain', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', marginBottom: '10px' }} />
                    <a href={`http://localhost:5000/${selectedFiles.reqFile}`} target="_blank" rel="noreferrer" style={{ display: 'block', textAlign: 'center', color: '#3b82f6', fontWeight: 'bold', textDecoration: 'none' }}>Open File in New Tab ↗</a>
                  </div>
                ) : (
                  <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>No requirement file attached to this request.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}