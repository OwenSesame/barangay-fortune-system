import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function PendingReview() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState(null);
  
  // Custom Modals for Admin Validation
  const [approvalModal, setApprovalModal] = useState({ isOpen: false, id: null });
  const [denialModal, setDenialModal] = useState({ isOpen: false, id: null, reason: '' });

  const fetchPendingRequests = async () => {
    try {
      // We reuse the staff route, but we will filter it to ONLY show 'Pending' for the Admin
      const response = await axios.get('http://localhost:5000/api/staff/pending-requests');
      const pendingOnly = response.data.filter(req => req.status === 'Pending');
      setRequests(pendingOnly);
    } catch (error) {
      console.error("Failed to fetch requests", error);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
    const interval = setInterval(fetchPendingRequests, 5000);
    return () => clearInterval(interval);
  }, []);

  // --- Official Admin Actions ---
  const handleApprove = async () => {
    try {
      const adminId = localStorage.getItem('userId');
      await axios.put(`http://localhost:5000/api/staff/update-status/${approvalModal.id}`, {
        status: 'Ready to Print',
        official_id: adminId
      });
      setApprovalModal({ isOpen: false, id: null });
      fetchPendingRequests();
    } catch (error) {
      alert("Error approving request.");
    }
  };

  const handleDeny = async (e) => {
    e.preventDefault();
    try {
      const adminId = localStorage.getItem('userId');
      await axios.put(`http://localhost:5000/api/staff/reject/${denialModal.id}`, {
        official_id: adminId,
        reason: denialModal.reason
      });
      setDenialModal({ isOpen: false, id: null, reason: '' });
      fetchPendingRequests();
    } catch (error) {
      alert("Error denying request.");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif', backgroundColor: '#f8fafc' }}>
      
      {/* Administrator Sidebar */}
      <div style={{ width: '260px', background: '#1e1b4b', color: 'white', padding: '30px 20px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '22px', margin: '0 0 40px 0', borderBottom: '1px solid #3730a3', paddingBottom: '15px' }}>Barangay Fortune</h2>
        <div style={{ flex: 1 }}>
          <p onClick={() => navigate('/admin-dashboard')} style={{ margin: '15px 0', cursor: 'pointer', color: '#a5b4fc' }}>🏠 Home</p>
          <p onClick={() => navigate('/account-management')} style={{ margin: '15px 0', cursor: 'pointer', color: '#a5b4fc' }}>👤 Account Management</p>
          <p style={{ margin: '15px 0', cursor: 'pointer', fontWeight: 'bold', color: 'white' }}>📋 Pending Review</p>
          <p onClick={() => navigate('/ready-to-print')} style={{ margin: '15px 0', cursor: 'pointer', color: '#a5b4fc' }}>🔖 Ready to Print</p>
          <p onClick={() => navigate('/document-management')} style={{ margin: '15px 0', cursor: 'pointer', color: '#a5b4fc' }}>📄 Document Templates</p>
        </div>
        <button onClick={handleLogout} style={{ padding: '10px', background: 'white', color: '#1e1b4b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Logout</button>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h1 style={{ margin: 0, color: '#0f172a', fontSize: '28px' }}>Admin Validation Queue</h1>
            <p style={{ color: '#64748b', marginTop: '5px' }}>Review and officially approve or deny pending resident applications.</p>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 25px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <h3 style={{ margin: 0, color: '#334155' }}>Awaiting Approval ({requests.length})</h3>
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', color: '#475569', textAlign: 'left', fontSize: '14px', textTransform: 'uppercase' }}>
                <th style={{ padding: '15px 25px' }}>Queue #</th>
                <th style={{ padding: '15px 25px' }}>Resident</th>
                <th style={{ padding: '15px 25px' }}>Document Type</th>
                <th style={{ padding: '15px 25px' }}>Review Files</th>
                <th style={{ padding: '15px 25px', width: '220px' }}>Admin Decision</th>
              </tr>
            </thead>
            <tbody>
              {requests.length > 0 ? (
                requests.map((req) => (
                  <tr key={req.request_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '15px 25px', fontWeight: 'bold', color: '#0f172a' }}>{req.daily_sequence_no}</td>
                    <td style={{ padding: '15px 25px', color: '#334155', fontWeight: '500' }}>{req.first_name} {req.last_name}</td>
                    <td style={{ padding: '15px 25px' }}>
                      <div style={{ fontWeight: 'bold', color: '#1e3a8a', fontSize: '14px' }}>{req.doc_name}</div>
                      <div style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>Purpose: {req.purpose || 'N/A'}</div>
                    </td>
                    <td style={{ padding: '15px 25px' }}>
                      <button onClick={() => setSelectedFiles({ idImage: req.id_proof_image, reqFile: req.requirement_file })} style={{ padding: '6px 12px', fontSize: '12px', background: 'white', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                        👁️ View Attachments
                      </button>
                    </td>
                    <td style={{ padding: '15px 25px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => setApprovalModal({ isOpen: true, id: req.request_id })} style={{ padding: '8px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', flex: 1 }}>
                          Approve
                        </button>
                        <button onClick={() => setDenialModal({ isOpen: true, id: req.request_id, reason: '' })} style={{ padding: '8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', flex: 1 }}>
                          Deny
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No pending applications require validation.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- APPROVAL CONFIRMATION MODAL --- */}
      {approvalModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '400px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>✅</div>
            <h2 style={{ margin: '0 0 10px 0', color: '#0f172a' }}>Confirm Approval</h2>
            <p style={{ color: '#64748b', marginBottom: '25px' }}>Are you sure you want to officially approve this document and send it to the printing queue?</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleApprove} style={{ flex: 1, padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Yes, Approve</button>
              <button onClick={() => setApprovalModal({ isOpen: false, id: null })} style={{ flex: 1, padding: '12px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* --- DENIAL CONFIRMATION MODAL --- */}
      {denialModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '400px' }}>
            <h2 style={{ margin: '0 0 10px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>⚠️ Deny Application</h2>
            <p style={{ color: '#64748b', marginBottom: '20px', fontSize: '14px' }}>Please provide an official reason for denying this request. This will be sent to the resident's dashboard.</p>
            <form onSubmit={handleDeny}>
              <textarea 
                placeholder="Type reason here (e.g., Expired ID, Mismatched Address)..." 
                value={denialModal.reason}
                onChange={(e) => setDenialModal({ ...denialModal, reason: e.target.value })}
                style={{ width: '100%', height: '100px', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '20px', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'none' }}
                required
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ flex: 1, padding: '12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Submit Denial</button>
                <button type="button" onClick={() => setDenialModal({ isOpen: false, id: null, reason: '' })} style={{ flex: 1, padding: '12px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Side-by-Side Review Modal (Reused from Staff Dashboard for Admin Verification) */}
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